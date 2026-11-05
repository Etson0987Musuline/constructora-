import { projectFactory, type Draft } from "../../lib/patterns.ts";
import type { Resource } from "./contracts.ts";
export function validate(resource: Resource, value: unknown): Draft {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("El cuerpo debe ser un objeto JSON.");
  const input = value as Record<string, unknown>;
  const fields = ["name", "detail", "kind", "status"] as const;
  for (const field of fields) if (typeof input[field] !== "string" || !input[field].trim()) throw new Error(`El campo ${field} es obligatorio y debe ser texto.`);
  const draft = Object.fromEntries(fields.map(field => [field, (input[field] as string).trim()])) as Draft;
  if (draft.name.length > 100 || draft.detail.length > 160) throw new Error("Nombre máximo: 100 caracteres. Detalle máximo: 160.");
  const kinds = resource === "clientes" ? ["Persona", "Empresa"] : ["Residencial", "Comercial"];
  if (!kinds.includes(draft.kind)) throw new Error(`kind debe ser: ${kinds.join(", ")}.`);
  const statuses = resource === "clientes" ? ["Activo", "Inactivo"] : projectFactory(draft.kind).createPolicy().statuses();
  if (!statuses.includes(draft.status)) throw new Error(`status debe ser: ${statuses.join(", ")}.`);
  if (resource === "clientes" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.detail)) throw new Error("detail debe contener un correo electrónico válido.");
  return draft;
}

