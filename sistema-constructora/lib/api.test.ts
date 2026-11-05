import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { GET as list, POST } from "../app/api/[resource]/route.ts";
import { GET, PUT, DELETE } from "../app/api/[resource]/[id]/route.ts";
test("API: relación cliente-obra, campos, actualización, persistencia y eliminación protegida", async () => {
 const directory = mkdtempSync(path.join(tmpdir(), "constructora-api-"));
 const previous = process.env.CONSTRUCTORA_DATA_FILE;
 const file = path.join(directory, "records.json");
 process.env.CONSTRUCTORA_DATA_FILE = file;
 const req = (method: string, body?: unknown) => new Request("http://localhost/api/test", { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
 const ctx = (resource: string, id = "") => ({ params: Promise.resolve({ resource, id }) });
 const client = { name:"Juan",detail:"test@example.com",kind:"Persona",status:"Activo",document:"12345678",phone:"987654321",address:"Lima" };
 const project = { name:"Edificio",detail:"Lima",kind:"Residencial",status:"Planificación",clientId:"missing",responsible:"Ana",startDate:"2026-11-01",endDate:"2027-01-31",budget:150000 };
 try {
  assert.equal((await POST(req("POST",{...client,document:"123"}),ctx("clientes"))).status,400);
  assert.equal((await POST(req("POST",{...client,phone:"abc"}),ctx("clientes"))).status,400);
  const created = await POST(req("POST",client),ctx("clientes")); assert.equal(created.status,201);
  const customer = await created.json(); const c = ctx("clientes",customer.id);
  assert.equal((await POST(req("POST",project),ctx("obras"))).status,409);
  const validProject = {...project,clientId:customer.id};
  for (const invalid of [{budget:0},{endDate:"2026-01-01"},{startDate:"2026-02-30"},{responsible:""}]) {
   assert.equal((await POST(req("POST",{...validProject,...invalid}),ctx("obras"))).status,400);
  }
  const built = await POST(req("POST",validProject),ctx("obras")); assert.equal(built.status,201);
  const work = await built.json(); const p = ctx("obras",work.id);
  assert.equal(work.clientId,customer.id); assert.equal(work.budget,150000);
  assert.equal((await DELETE(req("DELETE"),c)).status,409);
  assert.equal((await PUT(req("PUT",{...validProject,clientId:"missing"}),p)).status,409);
  const edited = await PUT(req("PUT",{...validProject,budget:200000}),p);
  assert.equal(edited.status,200); assert.equal((await edited.json()).id,work.id);
  assert.equal((await (await GET(req("GET"),p)).json()).budget,200000);
  const updatedClient = await PUT(req("PUT",{...client,phone:"999888777"}),c);
  assert.equal(updatedClient.status,200);
  assert.equal((await (await list(req("GET"),ctx("obras"))).json()).length,1);
  assert.equal((await DELETE(req("DELETE"),p)).status,204);
  assert.equal((await DELETE(req("DELETE"),c)).status,204);
  assert.equal((await GET(req("GET"),c)).status,404);
  assert.equal((await DELETE(req("DELETE"),c)).status,404);
  assert.equal((await PUT(req("PUT",client),c)).status,404);
  assert.equal((await POST(new Request("http://localhost",{method:"POST",body:"{"}),ctx("clientes"))).status,400);
  assert.equal((await list(req("GET"),ctx("otro"))).status,404);
  writeFileSync(file,"{broken");
  assert.equal((await list(req("GET"),ctx("clientes"))).status,500);
 } finally {
  if (previous === undefined) delete process.env.CONSTRUCTORA_DATA_FILE; else process.env.CONSTRUCTORA_DATA_FILE = previous;
  rmSync(directory,{recursive:true,force:true});
 }
});
