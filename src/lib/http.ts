export function html(body: string, status = 200, headers?: HeadersInit): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...headers,
    },
  });
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function redirect(location: string, headers?: HeadersInit): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: location, ...headers },
  });
}

/** flash 付きリダイレクト（?msg=&err=） */
export function bounce(path: string, text: string, error = false): Response {
  const u = new URL(path, "https://oshi-keiba.local");
  u.searchParams.set("msg", text);
  if (error) u.searchParams.set("err", "1");
  return redirect(u.pathname + u.search);
}

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function readForm(request: Request): Promise<URLSearchParams> {
  const ctype = request.headers.get("Content-Type") ?? "";
  if (ctype.includes("application/x-www-form-urlencoded")) {
    return new URLSearchParams(await request.text());
  }
  if (ctype.includes("multipart/form-data")) {
    const fd = await request.formData();
    const params = new URLSearchParams();
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string") params.set(k, v);
    }
    return params;
  }
  return new URLSearchParams();
}
