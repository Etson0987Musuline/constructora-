import assert from "node:assert/strict";
import test from "node:test";
import { ConcreteClientCreator, ResidentialFactory, CommercialFactory } from "./patterns.ts";
const draft = { name: "Registro", detail: "Lima", kind: "Persona", status: "Activo" };
test("Factory Method construye clientes independientes", () => {
  const creator = new ConcreteClientCreator();
  const first = creator.create(draft);
  const second = creator.create(draft);
  assert.equal(first.name, draft.name);
  assert.notEqual(first.id, second.id);
  assert.equal("id" in draft, false);
});
test("Abstract Factory mantiene compatibles las familias de productos", () => {
  for (const [factory, kind, status] of [[new ResidentialFactory(), "Residencial", "Planificación"], [new CommercialFactory(), "Comercial", "Evaluación"]] as const) {
    const policy = factory.createPolicy();
    const entry = factory.createProject().build({ ...draft, status: policy.statuses()[0] });
    assert.equal(entry.kind, kind);
    assert.equal(entry.status, status);
    assert.ok(entry.id);
    assert.ok(policy.description().length > 0);
  }
});
