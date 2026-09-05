import subtitleJson from "../data/gougai-subtitles.json" with { type: "json" };

export const GOUGAI_DEFAULT_SUBTITLE = "324.png";

export function gougaiSubtitleFiles(): string[] {
  const files = subtitleJson.files as string[];
  if (files.includes(GOUGAI_DEFAULT_SUBTITLE)) return files;
  return [GOUGAI_DEFAULT_SUBTITLE, ...files];
}

export function gougaiSubtitleUrl(file: string): string {
  const name = file.replace(/[^0-9A-Za-z._-]/g, "") || GOUGAI_DEFAULT_SUBTITLE;
  return `/twinkle/subtitles/${name}`;
}
