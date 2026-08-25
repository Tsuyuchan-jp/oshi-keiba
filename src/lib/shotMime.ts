/** OCR・スクショ保存で受け付ける MIME（Gemini / R2 共通） */
export const ALLOWED_SHOT_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

/** image/jpg などを正規化し、未対応なら null */
export function normalizeShotMime(type: string, fileName = ""): string | null {
  let t = type.trim().toLowerCase();
  if (t === "image/jpg") t = "image/jpeg";
  if (!t && fileName) {
    const n = fileName.toLowerCase();
    if (n.endsWith(".webp")) t = "image/webp";
    else if (n.endsWith(".png")) t = "image/png";
    else if (n.endsWith(".jpg") || n.endsWith(".jpeg")) t = "image/jpeg";
  }
  return (ALLOWED_SHOT_MIME as readonly string[]).includes(t) ? t : null;
}
