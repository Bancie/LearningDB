# Entire checkpoint – status and how to verify

## ✅ What is already working

- **Entire CLI**: Installed (v0.4.3) and on `PATH`.
- **Repo enabled**: Entire is enabled with strategy **manual-commit**.
- **Git hooks**: Installed and wired to Entire:
  - `commit-msg` – adds checkpoint trailer to commits
  - `post-commit` – condenses session data when commit has checkpoint
  - `prepare-commit-msg` – prepares commit message for Entire
  - `pre-push` – can prompt to link commits to sessions when pushing
- **Agent hooks**: `.claude/settings.json` has Entire hooks for session-start, session-end, user-prompt-submit, pre-task, post-task, post-todo.
- **Logs**: `.entire/logs/entire.log` shows hooks firing (session-start, session-end, user-prompt-submit, phase transition).
- **Active session**: `entire status` shows an active session and your last prompt, so the integration is detecting the current Cursor/Claude session.

So the integration **is** working at the level of: enabled repo, Git hooks, agent hooks, and session detection.

---

## Why it can feel “unclear”

### 1. Session shows as “unknown”

- In logs and in `entire status` you may see `session_id: "unknown"` or `[Claude Code] unknown`.
- Entire’s docs are written for the **Claude Code CLI**. In **Cursor**, the same hooks run, but Cursor may not pass the same session/transcript identifiers, so Entire keeps the session as “unknown” while still treating it as one active session.
- So: “unknown” means “session detected but not fully identified,” not “Entire is broken.”

### 2. manual-commit: checkpoints only on commit

- With **manual-commit** (your current strategy), **checkpoints are created only when you run `git commit`**.
- You will **not** see new checkpoints appearing in real time as you chat; you only get a checkpoint when you commit. That’s expected.

### 3. No `.entire/metadata/` yet

- The `.entire/metadata/` directory is created when at least one **checkpoint** exists (i.e. after a commit that gets an `Entire-Checkpoint` trailer).
- If you haven’t made such a commit yet, it’s normal that this folder doesn’t exist.

### 4. Sessions on entire.io only after push

- Sessions/checkpoints show up on [entire.io](https://entire.io) after you **push** and (when prompted) choose to **link the commit to your session**. Until then, everything is local.

---

## How to verify end-to-end

1. **Check status anytime**
   ```bash
   entire status
   ```
   You should see “Enabled (manual-commit)” and an active session (possibly “unknown”).

2. **Create a checkpoint**
   - Make some edits in this repo (e.g. in this Cursor chat).
   - Commit:
     ```bash
     git add -A
     git commit -m "Test: verify Entire checkpoint"
     ```
   - After the commit, the commit message should get an `Entire-Checkpoint: <id>` trailer. You can check with:
     ```bash
     git log -1 --pretty=format:%B
     ```

3. **Optional: rewind**
   ```bash
   entire rewind --list
   ```
   You should see at least one checkpoint after the commit above.

4. **Optional: push and link to session**
   ```bash
   git push
   ```
   If Entire prompts you to link the commit to your session, say yes. Then check the repo/session on [entire.io](https://entire.io).

5. **Optional: explain a checkpoint**
   ```bash
   entire explain --checkpoint <checkpoint-id>
   # or
   entire explain --commit HEAD
   ```

---

## Summary

| What you might think          | What’s actually true                                      |
|------------------------------|------------------------------------------------------------|
| “Nothing is happening”       | Hooks are firing; checkpoints only appear on **commit**.   |
| “Session is unknown”         | Cursor doesn’t pass a session ID; detection still works.   |
| “I don’t see checkpoints”    | With manual-commit, commit first, then check `entire status` / `entire rewind --list`. |
| “Not on entire.io”           | Sessions appear there after you **push** and link.         |

**Bottom line:** Entire is installed, enabled, and working. To “see” it clearly: **make a commit** in this repo during an active Cursor session, then run `entire status` and `entire rewind --list` (and optionally push and link on entire.io).
