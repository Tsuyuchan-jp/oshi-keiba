import overlayJson from "../data/gougai-overlays.json" with { type: "json" };

export type GougaiOverlay = {
  before: string;
  after: string;
  slogan: string;
};

const overlays = overlayJson.overlays as GougaiOverlay[];

export const GOUGAI_DEFAULT_SLOGAN = "見事チャンピオンに";

export function gougaiOverlays(): readonly GougaiOverlay[] {
  return overlays;
}

export function overlayBySlogan(slogan: string): GougaiOverlay {
  return overlays.find((row) => row.slogan === slogan)
    ?? overlays.find((row) => row.slogan === GOUGAI_DEFAULT_SLOGAN)
    ?? overlays[0]!;
}

/** CSV のプレースホルダを紙面用の字に替える。着差は開催に無いので僅差。 */
export function overlayColumns(overlay: GougaiOverlay, umaName: string): { mid: string; left: string } {
  const sub = (value: string) =>
    value.replaceAll("<character_name>", umaName).replaceAll("<bashin>", "僅差");
  return { mid: sub(overlay.before), left: sub(overlay.after) };
}

export function overlayLabel(overlay: GougaiOverlay, umaName: string): string {
  return overlay.slogan
    .replaceAll("<character_name>", umaName)
    .replaceAll("<bashin>", "僅差");
}
