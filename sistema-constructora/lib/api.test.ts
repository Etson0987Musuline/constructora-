import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { GET as list, POST } from "../app/api/[resource]/route.ts";
import { GET, PUT, DELETE } from "../app/api/[resource]/[id]/route.ts";
test("API: CRUD de ambas entidades y errores de validación", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "constructora-api-"));
  const previous = process.env.CONSTRUCTORA_DATA_FILE;
  process.env.CONSTRUCTORA_DATA_FILE = path.join(directory, "records.json");
  const request = (method: string, body?: unknown) => new Request("http://localhost/api/test", { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }) });
  try {
    for (const resource of ["clientes", "obras"]) {
      const context = { params: Promise.resolve({ resource }) };
      const draft = { name: "Prueba", detail: resource === "clientes" ? "test@example.com" : "Lima", kind: resource === "clientes" ? "Persona" : "Comercial", status: resource === "clientes" ? "Activo" : "Evaluación" };
      assert.equal((await POST(request("POST", {}), context)).status, 400);
      assert.equal((await POST(request("POST", { ...draft, status: "incorrecto" }), context)).status, 400);
      const created = await POST(request("POST", draft), context);
      assert.equal(created.status, 201);
      const entry = await created.json();
      const single = { params: Promise.resolve({ resource, id: entry.id }) };
      assert.equal((await (await list(request("GET"), context)).json()).length, 1);
      assert.equal((await (await GET(request("GET"), single)).json()).name, draft.name);
      const updated = await PUT(request("PUT", { ...draft, name: "Editado" }), single);
      assert.equal(updated.status, 200);
      assert.equal((await updated.json()).id, entry.id);
      assert.equal((await (await GET(request("GET"), single)).json()).name, "Editado");
      assert.equal((await DELETE(request("DELETE"), single)).status, 204);
      assert.equal((await GET(request("GET"), single)).status, 404);
      assert.equal((await DELETE(request("DELETE"), single)).status, 404);
      assert.equal((await PUT(request("PUT", draft), single)).status, 404);
      assert.equal((await (await list(request("GET"), context)).json()).length, 0);
    }
    assert.equal((await POST(new Request("http://localhost/api/clientes", { method: "POST", body: "{" }), { params: Promise.resolve({ resource: "clientes" }) })).status, 400);
    assert.equal((await list(request("GET"), { params: Promise.resolve({ resource: "otro" }) })).status, 404);
  } finally {
    if (previous === undefined) delete process.env.CONSTRUCTORA_DATA_FILE;
    else process.env.CONSTRUCTORA_DATA_FILE = previous;
    rmSync(directory, { recursive: true, force: true });
  }
});
