/** Gemini OCR の JSON ルートを1頭分のオブジェクトにする。 */

export function unwrapOcrPayload(raw: unknown): Record<string, unknown> {
  let value: unknown = raw;
  if (Array.isArray(value)) value = value[0];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("JSONの形が違います");
  }
  return value as Record<string, unknown>;
}
