import { auth } from "@/auth";
import { getBaseUrl } from "@/lib/env";

const ALLOWED_ACTIONS = new Set(["run", "submit"]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const { id, action } = await params;
  if (!ALLOWED_ACTIONS.has(action)) {
    return new Response("Not found", { status: 404 });
  }

  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.error("Auth session error:", error);
  }
  const token = session?.backendToken;

  const backendRes = await fetch(`${getBaseUrl()}/api/test/${id}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: await req.text(),
    cache: "no-store",
  });

  return new Response(backendRes.body, {
    status: backendRes.status,
    headers: {
      "Content-Type": backendRes.headers.get("content-type") || "application/x-ndjson",
    },
  });
}
