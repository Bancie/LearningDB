/**
 * Vite dev-only middleware: serves /api/* and /orch/* in-memory so the UI can run
 * without MySQL or the Python backend. Enable via `npm run dev:mock`.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const json = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

const text = (res: ServerResponse, status: number, body: string) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain");
  res.end(body);
};

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`;

type Conv = {
  id: string;
  user_id: number;
  title: string;
  provider: string;
  model: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

type Msg = {
  id: string;
  conversation_id: string;
  user_id: number;
  role: "user" | "assistant";
  content: string;
  request_id: string | null;
  created_at: string;
};

const nowIso = () => new Date().toISOString();

const mockActivityRows = [
  {
    ACTIVITY_ID: 1,
    ACT_NAME: "Mock: Doc React Router",
    ACT_STATUS: "in_progress",
    CREATED_AT: "2026-04-01 10:00:00",
  },
  {
    ACTIVITY_ID: 2,
    ACT_NAME: "Mock: Bai tap Bayes",
    ACT_STATUS: "done",
    CREATED_AT: "2026-04-02 14:30:00",
  },
];

const mockViewRows = [
  {
    ACTIVITY_ID: 1,
    ACT_NAME: "Mock: Doc React Router",
    Total: 0.5,
    Learning: 0.2,
    Overview: 0.2,
    Practice: 0.1,
  },
  {
    ACTIVITY_ID: 2,
    ACT_NAME: "Mock: Bai tap Bayes",
    Total: 0.5,
    Learning: 0.15,
    Overview: 0.2,
    Practice: 0.15,
  },
];

const mockLogRows = [
  {
    ACTIVITY_ID: 1,
    ACTI_LOG_ID: 101,
    ACT_NAME: "Mock: Doc React Router",
    START_TIME: "02:15:00",
  },
];

const mockOutputRows = [
  {
    AO_ID: 201,
    ACT_NAME: "Mock: Doc React Router",
    START_TIME: "2026-04-14T09:00:00",
    FINISH_TIME: "2026-04-14T09:45:00",
  },
];

const mockBayesRows = [
  {
    ACTIVITY_ID: 1,
    ACT_NAME: "Mock activity A",
    Total: 0.4,
    Learning: 0.2,
    Overview: 0.1,
    Practice: 0.1,
  },
  {
    ACTIVITY_ID: 2,
    ACT_NAME: "Mock activity B",
    Total: 0.35,
    Learning: 0.15,
    Overview: 0.1,
    Practice: 0.1,
  },
];

const mockTableColumns: Record<string, unknown[]> = {
  activity: [
    {
      name: "ACTIVITY_ID",
      type: "INTEGER",
      nullable: false,
      is_primary_key: true,
      autoincrement: true,
    },
    {
      name: "ACT_NAME",
      type: "VARCHAR",
      nullable: false,
      is_primary_key: false,
      autoincrement: false,
    },
    {
      name: "ACT_STATUS",
      type: "VARCHAR",
      nullable: true,
      is_primary_key: false,
      autoincrement: false,
    },
  ],
};

const mockTableRows: Record<string, Record<string, unknown>[]> = {
  activity: [
    { ACTIVITY_ID: 1, ACT_NAME: "Row mock 1", ACT_STATUS: "in_progress" },
    { ACTIVITY_ID: 2, ACT_NAME: "Row mock 2", ACT_STATUS: "done" },
  ],
};

function createMockState() {
  const chatPrefs = new Map<number, { user_id: number; provider: string; model: string; updated_at: string | null }>();
  const conversations = new Map<number, Conv[]>();
  const messages = new Map<string, Msg[]>();

  const seedUser = (userId: number) => {
    if (conversations.has(userId)) return;
    const cid = uuid();
    const t = nowIso();
    const conv: Conv = {
      id: cid,
      user_id: userId,
      title: "Mock: Chao ban",
      provider: "openai",
      model: "gpt-4.1-mini",
      created_at: t,
      updated_at: t,
      last_message_at: t,
    };
    conversations.set(userId, [conv]);
    const msgUser: Msg = {
      id: uuid(),
      conversation_id: cid,
      user_id: userId,
      role: "user",
      content: "Day la tin nhan mock.",
      request_id: null,
      created_at: t,
    };
    const msgAsst: Msg = {
      id: uuid(),
      conversation_id: cid,
      user_id: userId,
      role: "assistant",
      content: "Day la phan hoi mock (khong goi LLM that).",
      request_id: uuid(),
      created_at: t,
    };
    messages.set(`${userId}:${cid}`, [msgUser, msgAsst]);
    chatPrefs.set(userId, {
      user_id: userId,
      provider: "openai",
      model: "gpt-4.1-mini",
      updated_at: t,
    });
  };

  return { chatPrefs, conversations, messages, seedUser };
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
    });
    req.on("end", () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw) as unknown);
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

export function mockApiPlugin(): Plugin {
  const state = createMockState();

  return {
    name: "learningdb-mock-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api/") && !url.startsWith("/orch/")) {
          next();
          return;
        }

        const method = (req.method ?? "GET").toUpperCase();
        const path = url.split("?")[0] ?? "";

        try {
          // --- Orchestrator (/orch) ---
          if (path === "/orch/health" && method === "GET") {
            json(res, 200, { status: "healthy", service: "learningdb-orchestrator-mock" });
            return;
          }
          if (path === "/orch/providers" && method === "GET") {
            json(res, 200, [
              {
                id: "openai",
                label: "OpenAI (mock)",
                available: true,
                models: [
                  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", available: true },
                  { id: "gpt-4.1", label: "GPT-4.1", available: true },
                ],
              },
              {
                id: "anthropic",
                label: "Anthropic (mock)",
                available: true,
                models: [
                  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", available: true },
                ],
              },
            ]);
            return;
          }

          const prefMatch = path.match(/^\/orch\/chat\/preferences\/(\d+)$/);
          if (prefMatch && method === "GET") {
            const uid = Number(prefMatch[1]);
            state.seedUser(uid);
            json(res, 200, state.chatPrefs.get(uid) ?? null);
            return;
          }
          if (prefMatch && method === "PUT") {
            const uid = Number(prefMatch[1]);
            const body = (await readJsonBody(req)) as { provider?: string; model?: string };
            const t = nowIso();
            const row = {
              user_id: uid,
              provider: String(body.provider ?? "openai"),
              model: String(body.model ?? "gpt-4.1-mini"),
              updated_at: t,
            };
            state.chatPrefs.set(uid, row);
            json(res, 200, row);
            return;
          }

          const convListMatch = path.match(/^\/orch\/chat\/conversations\/(\d+)$/);
          if (convListMatch && method === "GET") {
            const uid = Number(convListMatch[1]);
            state.seedUser(uid);
            json(res, 200, conversationsToArray(state.conversations.get(uid) ?? []));
            return;
          }
          if (convListMatch && method === "POST") {
            const uid = Number(convListMatch[1]);
            state.seedUser(uid);
            const body = (await readJsonBody(req)) as {
              title?: string;
              provider?: string;
              model?: string;
            };
            const t = nowIso();
            const conv: Conv = {
              id: uuid(),
              user_id: uid,
              title: body.title?.trim() || "New chat (mock)",
              provider: body.provider ?? "openai",
              model: body.model ?? "gpt-4.1-mini",
              created_at: t,
              updated_at: t,
              last_message_at: null,
            };
            const list = state.conversations.get(uid) ?? [];
            list.unshift(conv);
            state.conversations.set(uid, list);
            json(res, 200, conv);
            return;
          }

          const convDelMatch = path.match(/^\/orch\/chat\/conversations\/(\d+)\/([^/]+)$/);
          if (convDelMatch && method === "DELETE") {
            const uid = Number(convDelMatch[1]);
            const cid = convDelMatch[2];
            const list = state.conversations.get(uid);
            if (!list) {
              json(res, 404, { detail: "Not found" });
              return;
            }
            const idx = list.findIndex((c) => c.id === cid);
            if (idx === -1) {
              json(res, 404, { detail: "Not found" });
              return;
            }
            list.splice(idx, 1);
            state.messages.delete(`${uid}:${cid}`);
            json(res, 200, { id: cid, deleted_at: nowIso() });
            return;
          }

          const msgListMatch = path.match(/^\/orch\/chat\/conversations\/(\d+)\/([^/]+)\/messages$/);
          if (msgListMatch && method === "GET") {
            const uid = Number(msgListMatch[1]);
            const cid = msgListMatch[2];
            state.seedUser(uid);
            json(res, 200, state.messages.get(`${uid}:${cid}`) ?? []);
            return;
          }
          if (msgListMatch && method === "POST") {
            const uid = Number(msgListMatch[1]);
            const cid = msgListMatch[2];
            const body = (await readJsonBody(req)) as {
              role?: string;
              content?: string;
              request_id?: string;
            };
            const role = body.role === "assistant" ? "assistant" : "user";
            const content = String(body.content ?? "").trim() || "(empty)";
            const t = nowIso();
            const m: Msg = {
              id: uuid(),
              conversation_id: cid,
              user_id: uid,
              role,
              content,
              request_id: body.request_id ?? null,
              created_at: t,
            };
            const key = `${uid}:${cid}`;
            const arr = state.messages.get(key) ?? [];
            arr.push(m);
            state.messages.set(key, arr);
            const list = state.conversations.get(uid) ?? [];
            const conv = list.find((c) => c.id === cid);
            if (conv) {
              conv.last_message_at = t;
              conv.updated_at = t;
            }
            json(res, 200, m);
            return;
          }

          if (path === "/orch/chat" && method === "POST") {
            const body = (await readJsonBody(req)) as {
              user_id?: number;
              message?: string;
              conversation_id?: string;
              provider?: string;
              model?: string;
            };
            const uid = Number(body.user_id) || 1;
            const convId = body.conversation_id?.trim() || uuid();
            const provider = body.provider ?? "openai";
            const model = body.model ?? "gpt-4.1-mini";
            const echo = String(body.message ?? "").slice(0, 200);
            json(res, 200, {
              request_id: uuid(),
              conversation_id: convId,
              answer: `[Mock orchestrator] Ban da gui: "${echo}". LLM that khong duoc goi trong che do dev:mock.`,
              resolved_provider: provider,
              resolved_model: model,
              tool_invocations: [],
              warnings: [],
              action_preview: null,
            });
            return;
          }

          // --- Backend API (/api) ---
          if (path === "/api/health" && method === "GET") {
            json(res, 200, { status: "healthy" });
            return;
          }

          const profileMatch = path.match(/^\/api\/users\/(\d+)\/profile$/);
          if (profileMatch && method === "GET") {
            const uid = Number(profileMatch[1]);
            json(res, 200, {
              data: { user_id: uid, user_location: "Asia/Ho_Chi_Minh" },
            });
            return;
          }

          const apiPrefGet = path.match(/^\/api\/users\/(\d+)\/chat-preferences$/);
          if (apiPrefGet && method === "GET") {
            const uid = Number(apiPrefGet[1]);
            state.seedUser(uid);
            json(res, 200, { data: state.chatPrefs.get(uid) ?? null });
            return;
          }
          if (apiPrefGet && method === "PUT") {
            const uid = Number(apiPrefGet[1]);
            const body = (await readJsonBody(req)) as { provider?: string; model?: string };
            const t = nowIso();
            const row = {
              user_id: uid,
              provider: String(body.provider ?? "openai"),
              model: String(body.model ?? "gpt-4.1-mini"),
              updated_at: t,
            };
            state.chatPrefs.set(uid, row);
            json(res, 200, { data: row });
            return;
          }

          const apiConvList = path.match(/^\/api\/users\/(\d+)\/conversations$/);
          if (apiConvList && method === "GET") {
            const uid = Number(apiConvList[1]);
            state.seedUser(uid);
            json(res, 200, { data: conversationsToApiRows(state.conversations.get(uid) ?? []) });
            return;
          }
          if (apiConvList && method === "POST") {
            const uid = Number(apiConvList[1]);
            state.seedUser(uid);
            const body = (await readJsonBody(req)) as Record<string, unknown>;
            const t = nowIso();
            const id = uuid();
            const conv: Conv = {
              id,
              user_id: uid,
              title: String(body.title ?? "New chat (mock)"),
              provider: String(body.provider ?? "openai"),
              model: String(body.model ?? "gpt-4.1-mini"),
              created_at: t,
              updated_at: t,
              last_message_at: null,
            };
            const list = state.conversations.get(uid) ?? [];
            list.unshift(conv);
            state.conversations.set(uid, list);
            json(res, 200, { data: conversationToApiRow(conv) });
            return;
          }

          const apiConvDel = path.match(/^\/api\/users\/(\d+)\/conversations\/([^/]+)$/);
          if (apiConvDel && method === "DELETE") {
            const uid = Number(apiConvDel[1]);
            const cid = apiConvDel[2];
            const list = state.conversations.get(uid);
            if (!list) {
              json(res, 404, { detail: "Not found" });
              return;
            }
            const idx = list.findIndex((c) => c.id === cid);
            if (idx === -1) {
              json(res, 404, { detail: "Not found" });
              return;
            }
            list.splice(idx, 1);
            state.messages.delete(`${uid}:${cid}`);
            json(res, 200, { data: { id: cid, deleted_at: nowIso() } });
            return;
          }

          const apiMsgList = path.match(/^\/api\/users\/(\d+)\/conversations\/([^/]+)\/messages$/);
          if (apiMsgList && method === "GET") {
            const uid = Number(apiMsgList[1]);
            const cid = apiMsgList[2];
            state.seedUser(uid);
            json(res, 200, { data: state.messages.get(`${uid}:${cid}`) ?? [] });
            return;
          }
          if (apiMsgList && method === "POST") {
            const uid = Number(apiMsgList[1]);
            const cid = apiMsgList[2];
            const body = (await readJsonBody(req)) as Record<string, unknown>;
            const t = nowIso();
            const m: Msg = {
              id: uuid(),
              conversation_id: cid,
              user_id: uid,
              role: body.role === "assistant" ? "assistant" : "user",
              content: String(body.content ?? ""),
              request_id: body.request_id ? String(body.request_id) : null,
              created_at: t,
            };
            const key = `${uid}:${cid}`;
            const arr = state.messages.get(key) ?? [];
            arr.push(m);
            state.messages.set(key, arr);
            json(res, 200, { data: m });
            return;
          }

          if (path === "/api/tables" && method === "GET") {
            json(res, 200, { tables: ["activity", "activity_log", "activity_output"] });
            return;
          }

          const colMatch = path.match(/^\/api\/tables\/([^/]+)\/columns$/);
          if (colMatch && method === "GET") {
            const name = decodeURIComponent(colMatch[1]).toLowerCase();
            const cols = mockTableColumns[name];
            if (!cols) {
              json(res, 200, { columns: [] });
              return;
            }
            json(res, 200, { columns: cols });
            return;
          }

          const rowsMatch = path.match(/^\/api\/tables\/([^/]+)\/rows$/);
          if (rowsMatch && method === "GET") {
            const name = decodeURIComponent(rowsMatch[1]).toLowerCase();
            const rows = mockTableRows[name] ?? [];
            json(res, 200, { rows, total: rows.length });
            return;
          }

          if (path === "/api/tables/insert" && method === "POST") {
            json(res, 200, { success: true, message: "Mock: insert accepted (no persistence)." });
            return;
          }

          if (rowsMatch && method === "PATCH") {
            json(res, 200, { success: true, message: "Mock: row updated (no persistence)." });
            return;
          }
          if (rowsMatch && method === "DELETE") {
            json(res, 200, { success: true, message: "Row deleted" });
            return;
          }

          if (path === "/api/activities" && method === "GET") {
            json(res, 200, { activity_ids: [1, 2] });
            return;
          }

          const listUid = path.match(/^\/api\/activities\/list\/(\d+)$/);
          if (listUid && method === "GET") {
            json(res, 200, { data: mockActivityRows });
            return;
          }

          const viewUid = path.match(/^\/api\/activities\/view\/(\d+)$/);
          if (viewUid && method === "GET") {
            json(res, 200, { data: mockViewRows });
            return;
          }

          const logUid = path.match(/^\/api\/activities\/current-log\/(\d+)$/);
          if (logUid && method === "GET") {
            json(res, 200, { data: mockLogRows });
            return;
          }

          const outUid = path.match(/^\/api\/activities\/current-output\/(\d+)$/);
          if (outUid && method === "GET") {
            json(res, 200, { data: mockOutputRows });
            return;
          }

          if (
            (path === "/api/update/prior" || path === "/api/update/posterior" || path === "/api/update/status") &&
            method === "POST"
          ) {
            json(res, 200, { success: true, message: "Mock: update accepted." });
            return;
          }
          if (path === "/api/update/zero" && method === "POST") {
            json(res, 200, { success: true, message: "Mock: zero accepted." });
            return;
          }

          if (path === "/api/bayes/check-prior" && method === "GET") {
            json(res, 200, { valid: true, total: 1, message: "Mock prior OK." });
            return;
          }
          if (path === "/api/bayes/run" && (method === "GET" || method === "POST")) {
            json(res, 200, { data: mockBayesRows });
            return;
          }

          json(res, 404, { detail: `Mock: no handler for ${method} ${path}` });
        } catch (e) {
          text(res, 500, e instanceof Error ? e.message : "Mock error");
        }
      });
    },
  };
}

/** Orchestrator list shape (camelCase dates). */
function conversationsToArray(list: Conv[]) {
  return list.map((c) => ({
    id: c.id,
    user_id: c.user_id,
    title: c.title,
    provider: c.provider,
    model: c.model,
    created_at: c.created_at,
    updated_at: c.updated_at,
    last_message_at: c.last_message_at,
  }));
}

/** Backend API list shape (UPPER_SNAKE + string dates). */
function conversationsToApiRows(list: Conv[]) {
  return list.map(conversationToApiRow);
}

function conversationToApiRow(c: Conv) {
  return {
    ID: c.id,
    USER_ID: c.user_id,
    TITLE: c.title,
    PROVIDER: c.provider,
    MODEL: c.model,
    CREATED_AT: c.created_at,
    UPDATED_AT: c.updated_at,
    LAST_MESSAGE_AT: c.last_message_at,
  };
}
