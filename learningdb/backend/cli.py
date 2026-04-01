"""CLI entrypoint to run LearningDB full stack locally."""

from __future__ import annotations

import os
import shutil
import signal
import socket
import subprocess
import sys
import threading
from pathlib import Path
from typing import IO

import mysql.connector
import typer
from dotenv import dotenv_values

app = typer.Typer(help="LearningDB CLI", no_args_is_help=True)


def _resolve_db_target(env_values: dict[str, str]) -> tuple[str, int | None]:
    raw_host = (env_values.get("DB_HOST") or "").strip()
    explicit_port = env_values.get("DB_PORT")
    host = raw_host
    port: int | None = None

    if raw_host.count(":") == 1:
        candidate_host, candidate_port = raw_host.split(":", 1)
        if candidate_host and candidate_port.isdigit():
            host = candidate_host
            port = int(candidate_port)

    if port is None and explicit_port and explicit_port.isdigit():
        port = int(explicit_port)

    return host, port


def _try_start_db_service(repo_root: Path) -> bool:
    compose_path = repo_root / "compose.yml"
    docker_bin = shutil.which("docker")
    if not compose_path.exists() or not docker_bin:
        return False

    result = subprocess.run(
        [docker_bin, "compose", "up", "-d", "--wait", "db"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode == 0:
        return True

    # Fallback for older Docker Compose versions that don't support --wait.
    fallback = subprocess.run(
        [docker_bin, "compose", "up", "-d", "db"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        check=False,
    )
    return fallback.returncode == 0


def _read_env(env_path: Path) -> dict[str, str]:
    values = dotenv_values(env_path)
    return {k: str(v) for k, v in values.items() if v is not None}


def _print_stream(prefix: str, stream: IO[str]) -> None:
    for line in iter(stream.readline, ""):
        clean_line = line.rstrip()
        if clean_line:
            typer.echo(f"[{prefix}] {clean_line}")


def _ensure_exists(path: Path, message: str) -> None:
    if not path.exists():
        typer.secho(message, fg=typer.colors.RED, err=True)
        raise typer.Exit(code=1)


def _connect_mysql(connect_args: dict[str, object]) -> None:
    conn = mysql.connector.connect(**connect_args)
    conn.close()


def _detect_lan_ip() -> str | None:
    """Best-effort detect LAN IP for cross-device access."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return str(sock.getsockname()[0])
    except OSError:
        return None
    finally:
        sock.close()


def _resolve_api_public_host(bind_host: str) -> str:
    normalized = bind_host.strip()
    if normalized in {"0.0.0.0", "::"}:
        return _detect_lan_ip() or "localhost"
    if normalized in {"127.0.0.1", "::1", "localhost"}:
        return "localhost"
    return normalized


def _check_mysql(env_values: dict[str, str], repo_root: Path) -> tuple[str, int]:
    required = ("DB_HOST", "DB_USER", "DB_PASS", "DB_NAME")
    missing = [key for key in required if not env_values.get(key)]
    if missing:
        missing_csv = ", ".join(missing)
        typer.secho(
            f".env is missing required DB values: {missing_csv}",
            fg=typer.colors.RED,
            err=True,
        )
        raise typer.Exit(code=1)

    host, port = _resolve_db_target(env_values)
    connect_args: dict[str, object] = {
        "host": host,
        "user": env_values["DB_USER"],
        "password": env_values["DB_PASS"],
        "database": env_values["DB_NAME"],
        "connection_timeout": 3,
    }
    if port is not None:
        connect_args["port"] = port

    try:
        _connect_mysql(connect_args)
        return host, port if port is not None else 3306
    except mysql.connector.Error as first_exc:
        if port is None and host in {"localhost", "127.0.0.1"}:
            retry_args = dict(connect_args)
            retry_args["port"] = 3308
            try:
                _connect_mysql(retry_args)
                return host, 3308
            except mysql.connector.Error:
                pass

        start_db_ok = _try_start_db_service(repo_root)
        if start_db_ok:
            primary_post_start_port = 3308 if (port is None and host in {"localhost", "127.0.0.1"}) else (port or 3306)
            post_start_ports = [primary_post_start_port]
            if host in {"localhost", "127.0.0.1"}:
                for fallback_port in (3308, 3306):
                    if fallback_port not in post_start_ports:
                        post_start_ports.append(fallback_port)

            for post_start_port in post_start_ports:
                post_start_args = dict(connect_args)
                post_start_args["port"] = post_start_port
                try:
                    _connect_mysql(post_start_args)
                    return host, post_start_port
                except mysql.connector.Error:
                    pass

        typer.secho(
            f"Cannot connect to MySQL ({first_exc}). Start DB first then retry. "
            "You can set DB_PORT in .env if needed, or run `docker compose up -d db`.",
            fg=typer.colors.RED,
            err=True,
        )
        raise typer.Exit(code=1) from first_exc


def _terminate(proc: subprocess.Popen[str]) -> None:
    if proc.poll() is not None:
        return
    proc.terminate()
    try:
        proc.wait(timeout=8)
    except subprocess.TimeoutExpired:
        proc.kill()


@app.command()
def serve(
    prod: bool = typer.Option(
        False,
        "--prod",
        help="Run frontend with production-like server (build + start).",
    ),
    host: str = typer.Option("0.0.0.0", help="Backend host."),
    port: int = typer.Option(8000, help="Backend port."),
    web_host: str = typer.Option("0.0.0.0", help="Frontend host."),
    web_port: int = typer.Option(5173, help="Frontend port."),
    orch_host: str = typer.Option("0.0.0.0", help="Orchestrator host."),
    orch_port: int = typer.Option(8100, help="Orchestrator port."),
) -> None:
    """Run MySQL-backed API and web app together."""
    repo_root = Path(__file__).resolve().parents[2]
    app_root = repo_root / "learningdb"
    backend_dir = app_root / "backend"
    env_path = repo_root / ".env"
    package_json = app_root / "package.json"
    node_modules = app_root / "node_modules"

    _ensure_exists(env_path, f"Missing .env at: {env_path}")
    _ensure_exists(package_json, f"Missing package.json at: {package_json}")
    _ensure_exists(node_modules, f"Missing node_modules at: {node_modules}. Run npm install first.")

    env_values = _read_env(env_path)
    db_host, db_port = _check_mysql(env_values, repo_root)

    shell_env = os.environ.copy()
    shell_env.update(env_values)
    shell_env["DB_HOST"] = db_host
    shell_env["DB_PORT"] = str(db_port)
    shell_env.setdefault("VITE_API_BASE_URL", f"http://{_resolve_api_public_host(host)}:{port}/api")
    shell_env.setdefault("VITE_ORCH_API_BASE_URL", f"http://{_resolve_api_public_host(orch_host)}:{orch_port}")

    typer.echo(
        "[serve] endpoints: "
        f"web=http://{_resolve_api_public_host(web_host)}:{web_port} "
        f"api=http://{_resolve_api_public_host(host)}:{port}/api "
        f"orchestrator=http://{_resolve_api_public_host(orch_host)}:{orch_port}"
    )

    if prod:
        typer.echo("[web] building frontend...")
        build_result = subprocess.run(
            ["npm", "run", "build"],
            cwd=app_root,
            env=shell_env,
            check=False,
        )
        if build_result.returncode != 0:
            raise typer.Exit(code=build_result.returncode)

    api_proc = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "main:app",
            "--host",
            host,
            "--port",
            str(port),
        ],
        cwd=backend_dir,
        env=shell_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    orch_proc = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "orchestrator.app:app",
            "--host",
            orch_host,
            "--port",
            str(orch_port),
        ],
        cwd=app_root,
        env=shell_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    if prod:
        web_cmd = ["npm", "run", "start", "--", "--host", web_host, "--port", str(web_port)]
    else:
        web_cmd = ["npm", "run", "dev", "--", "--host", web_host, "--port", str(web_port)]
    web_proc = subprocess.Popen(
        web_cmd,
        cwd=app_root,
        env=shell_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    threads = []
    if api_proc.stdout is not None:
        threads.append(threading.Thread(target=_print_stream, args=("api", api_proc.stdout), daemon=True))
    if orch_proc.stdout is not None:
        threads.append(threading.Thread(target=_print_stream, args=("orch", orch_proc.stdout), daemon=True))
    if web_proc.stdout is not None:
        threads.append(threading.Thread(target=_print_stream, args=("web", web_proc.stdout), daemon=True))
    for thread in threads:
        thread.start()

    processes = [api_proc, orch_proc, web_proc]

    def _handle_signal(signum: int, _frame: object) -> None:
        typer.echo(f"\nReceived signal {signum}. Stopping services...")
        for proc in processes:
            _terminate(proc)
        raise typer.Exit(code=0)

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    try:
        while True:
            for proc in processes:
                code = proc.poll()
                if code is not None:
                    for other in processes:
                        if other is not proc:
                            _terminate(other)
                    raise typer.Exit(code=code)
    except KeyboardInterrupt:
        for proc in processes:
            _terminate(proc)
        raise typer.Exit(code=0)


@app.callback()
def cli() -> None:
    """LearningDB command group."""


def main() -> None:
    app()


if __name__ == "__main__":
    main()
