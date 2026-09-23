/**
 * 戦略例外スキル API（管理・JSON）
 */
import {
  dismissStrategicSkill,
  exportStrategicSkillsJson,
  listStrategicDismissed,
  listStrategicSkills,
  prepareAddStrategicSkill,
  prepareRemoveStrategicSkill,
  undismissStrategicSkill,
} from "./strategicSkills.ts";

type Gate = { session: { userId: string; role: string }; user: { id: string } };

import { loadBoard } from "./store.ts";
import { eventScoreSetup } from "./store.ts";
import { autoScoreRecomputeStatements, prepareAutoScoreRecompute } from "./scoreRecompute.ts";

async function requireSetup(db: D1Database, archiveBucket?: R2Bucket): Promise<void> {
  const board = await loadBoard(db, archiveBucket);
  if (board.event.status !== "setup") {
    throw new Error("出走登録中だけ編集できます");
  }
}

type StrategicMutation =
  | { action: "upsert"; skill: { skillId: number; name: string; points: number; memo?: string } }
  | { action: "remove"; skillId: number };

function projectedSkills(
  current: Awaited<ReturnType<typeof listStrategicSkills>>,
  mutation: StrategicMutation,
) {
  if (mutation.action === "remove") {
    if (!Number.isFinite(mutation.skillId) || mutation.skillId <= 0) throw new Error("id が不正です");
    return current.filter((skill) => skill.skillId !== mutation.skillId);
  }
  const { skill } = mutation;
  if (!Number.isFinite(skill.skillId) || skill.skillId <= 0) throw new Error("スキル id が不正です");
  const name = skill.name.trim();
  if (!name) throw new Error("スキル名を入れてください");
  if (!Number.isFinite(skill.points) || skill.points < 0) throw new Error("点数が不正です");
  const next = { skillId: skill.skillId, name, points: skill.points, memo: (skill.memo ?? "").trim() };
  return [...current.filter((row) => row.skillId !== next.skillId), next].sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

async function prepareStrategicMutation(
  db: D1Database,
  mutation: StrategicMutation,
  archiveBucket?: R2Bucket,
) {
  const board = await loadBoard(db, archiveBucket);
  const current = await listStrategicSkills(db);
  const skills = projectedSkills(current, mutation);
  const changes = await prepareAutoScoreRecompute(db, board.event, eventScoreSetup(board.event), skills);
  const statements = mutation.action === "upsert"
    ? prepareAddStrategicSkill(db, mutation.skill)
    : prepareRemoveStrategicSkill(db, mutation.skillId);
  return { changes, statements };
}

async function commitStrategicMutation(
  db: D1Database,
  mutation: StrategicMutation,
  archiveBucket?: R2Bucket,
): Promise<void> {
  const { changes, statements } = await prepareStrategicMutation(db, mutation, archiveBucket);
  await db.batch([...statements, ...autoScoreRecomputeStatements(db, changes)]);
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
    await requireSetup(env.DB, env.SHOTS);
    const body = (await request.json()) as {
      skillId?: number;
      name?: string;
      points?: number;
      memo?: string;
    };
    await commitStrategicMutation(env.DB, { action: "upsert", skill: {
      skillId: Number(body.skillId),
      name: String(body.name ?? ""),
      points: body.points ?? 1,
      memo: body.memo ?? "",
    }}, env.SHOTS);
    return Response.json({ ok: true });
  }

  if (path === base && request.method === "DELETE") {
    await requireSetup(env.DB, env.SHOTS);
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isFinite(id)) throw new Error("id が不正です");
    await commitStrategicMutation(env.DB, { action: "remove", skillId: id }, env.SHOTS);
    return Response.json({ ok: true });
  }

  if (path === `${base}/dismiss` && request.method === "POST") {
    await requireSetup(env.DB, env.SHOTS);
    const body = (await request.json()) as { skillId?: number; name?: string };
    await dismissStrategicSkill(env.DB, {
      skillId: Number(body.skillId),
      name: String(body.name ?? ""),
    });
    return Response.json({ ok: true });
  }

  if (path === `${base}/dismiss` && request.method === "DELETE") {
    await requireSetup(env.DB, env.SHOTS);
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isFinite(id)) throw new Error("id が不正です");
    await undismissStrategicSkill(env.DB, id);
    return Response.json({ ok: true });
  }

  if (path === `${base}/preview` && request.method === "POST") {
    await requireSetup(env.DB, env.SHOTS);
    const body = (await request.json()) as { action?: string; skill?: { skillId?: number; name?: string; points?: number; memo?: string }; skillId?: number };
    const mutation: StrategicMutation = body.action === "remove"
      ? { action: "remove", skillId: Number(body.skillId) }
      : { action: "upsert", skill: {
          skillId: Number(body.skill?.skillId), name: String(body.skill?.name ?? ""),
          points: Number(body.skill?.points), memo: String(body.skill?.memo ?? ""),
        } };
    const { changes } = await prepareStrategicMutation(env.DB, mutation, env.SHOTS);
    return Response.json({ changes });
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
