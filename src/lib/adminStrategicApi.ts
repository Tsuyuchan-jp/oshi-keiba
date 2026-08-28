/**
 * 戦略例外スキル API（管理・JSON）
 */
import {
  addStrategicSkill,
  dismissStrategicSkill,
  exportStrategicSkillsJson,
  listStrategicDismissed,
  listStrategicSkills,
  removeStrategicSkill,
  undismissStrategicSkill,
} from "./strategicSkills.ts";

type Gate = { session: { userId: string; role: string }; user: { id: string } };

import { loadBoard } from "./store.ts";
import { eventScoreSetup } from "./store.ts";
import { applyAutoScoreRecompute, prepareAutoScoreRecompute } from "./scoreRecompute.ts";

async function requireSetup(db: D1Database): Promise<void> {
  const board = await loadBoard(db);
  if (board.event.status !== "setup") {
    throw new Error("出走登録中だけ編集できます");
  }
}

async function recomputeCurrentAutoScores(db: D1Database): Promise<void> {
  const board = await loadBoard(db);
  const skills = await listStrategicSkills(db);
  const changes = await prepareAutoScoreRecompute(db, board.event, eventScoreSetup(board.event), skills);
  await applyAutoScoreRecompute(db, changes);
}

/** 管理 API。該当しなければ null */
export async function tryAdminStrategicApi(
  request: Request,
  env: Env,
  path: string,
  gate: Gate,
): Promise<Response | null> {
  void gate;
  const base = "/admin/api/strategic-skills";

  if (path === `${base}/export` && request.method === "GET") {
    const json = await exportStrategicSkillsJson(env.DB);
    return new Response(json, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="strategic-skills.json"',
      },
    });
  }

  if (path === base && request.method === "GET") {
    const [skills, dismissed] = await Promise.all([
      listStrategicSkills(env.DB),
      listStrategicDismissed(env.DB),
    ]);
    return Response.json({ skills, dismissed });
  }

  if (path === base && request.method === "POST") {
    await requireSetup(env.DB);
    const body = (await request.json()) as {
      skillId?: number;
      name?: string;
      points?: number;
      memo?: string;
    };
    await addStrategicSkill(env.DB, {
      skillId: Number(body.skillId),
      name: String(body.name ?? ""),
      points: body.points ?? 1,
      memo: body.memo ?? "",
    });
    await recomputeCurrentAutoScores(env.DB);
    return Response.json({ ok: true });
  }

  if (path === base && request.method === "DELETE") {
    await requireSetup(env.DB);
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isFinite(id)) throw new Error("id が不正です");
    await removeStrategicSkill(env.DB, id);
    await recomputeCurrentAutoScores(env.DB);
    return Response.json({ ok: true });
  }

  if (path === `${base}/dismiss` && request.method === "POST") {
    await requireSetup(env.DB);
    const body = (await request.json()) as { skillId?: number; name?: string };
    await dismissStrategicSkill(env.DB, {
      skillId: Number(body.skillId),
      name: String(body.name ?? ""),
    });
    await recomputeCurrentAutoScores(env.DB);
    return Response.json({ ok: true });
  }

  if (path === `${base}/dismiss` && request.method === "DELETE") {
    await requireSetup(env.DB);
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isFinite(id)) throw new Error("id が不正です");
    await undismissStrategicSkill(env.DB, id);
    await recomputeCurrentAutoScores(env.DB);
    return Response.json({ ok: true });
  }

  return null;
}

/** 出走登録・採点用に一覧取得 */
export async function loadStrategicSkillsBundle(db: D1Database): Promise<{
  skills: Awaited<ReturnType<typeof listStrategicSkills>>;
  dismissed: Awaited<ReturnType<typeof listStrategicDismissed>>;
}> {
  const [skills, dismissed] = await Promise.all([
    listStrategicSkills(db),
    listStrategicDismissed(db),
  ]);
  return { skills, dismissed };
}
