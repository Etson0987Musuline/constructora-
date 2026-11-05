import { serviceFor } from "../../../../backend/application/service-creator.ts";
import { missing, failure } from "../../../../backend/http.ts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ resource: string; id: string }> };
export async function GET(_request: Request, context: Context) {
  const { resource, id } = await context.params;
  const service = serviceFor(resource);
  if (!service) return missing();
  try { const entry = service.find(id); return entry ? Response.json(entry) : missing(); }
  catch (error) { return failure(error); }
}
export async function PUT(request: Request, context: Context) {
  const { resource, id } = await context.params;
  const service = serviceFor(resource);
  if (!service) return missing();
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "JSON inválido." }, { status: 400 }); }
  try { const entry = service.update(id, body); return entry ? Response.json(entry) : missing(); }
  catch (error) { return failure(error); }
}
export async function DELETE(_request: Request, context: Context) {
  const { resource, id } = await context.params;
  const service = serviceFor(resource);
  if (!service) return missing();
  try { return service.remove(id) ? new Response(null, { status: 204 }) : missing(); }
  catch (error) { return failure(error); }
}
