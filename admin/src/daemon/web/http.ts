export function json(payload: any, status = 200) {
  return Response.json(payload, { status });
}

export function errorResponse(message: string, code = 1, status = 400) {
  return Response.json({ status: "error", error: message, code }, { status });
}

export function normalizeError(err: any) {
  if (!err) return { message: "Unknown error" };
  if (typeof err === "string") return { message: err };
  if (err instanceof Error) {
    return { message: err.message, code: (err as any).code };
  }
  return { message: "Unknown error" };
}

export async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
