import { serviceFor } from "../../../backend/application/service-creator.ts";
import { missing, failure } from "../../../backend/http.ts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ resource: string }> };
export async function GET(request: Request, context: Context) {
  const service = serviceFor((await context.params).resource);
  if (!service) return missing();
  try { return Response.json(service.list(new URL(request.url).searchParams.get("q") ?? "")); }
  catch (error) { return failure(error); }
}
export async function POST(request: Request, context: Context) {
  const { resource } = await context.params;
  const service = serviceFor(resource);
  if (!service) return missing();
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "JSON inválido." }, { status: 400 }); }
  try {
    const entry = service.create(body);
    return Response.json(entry, { status: 201, headers: { Location: `/api/${resource}/${entry.id}` } });
  } catch (error) { return failure(error); }
}
