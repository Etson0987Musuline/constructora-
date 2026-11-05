import { projectFactory, type Draft } from "../../lib/patterns.ts";
import type { Resource } from "./contracts.ts";
export function validate(resource: Resource, value: unknown): Draft {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("El cuerpo debe ser un objeto JSON.");
  const input = value as Record<string, unknown>;
  const fields = ["name", "detail", "kind", "status"] as const;
  for (const field of fields) if (typeof input[field] !== "string" || !input[field].trim()) throw new Error(`El campo ${field} es obligatorio y debe ser texto.`);
  const draft: Draft = { name: (input.name as string).trim(), detail: (input.detail as string).trim(), kind: (input.kind as string).trim(), status: (input.status as string).trim() };
  if (draft.name.length > 100 || draft.detail.length > 160) throw new Error("Nombre máximo: 100 caracteres. Detalle máximo: 160.");
  const kinds = resource === "clientes" ? ["Persona", "Empresa"] : ["Residencial", "Comercial"];
  if (!kinds.includes(draft.kind)) throw new Error(`kind debe ser: ${kinds.join(", ")}.`);
  const statuses = resource === "clientes" ? ["Activo", "Inactivo"] : projectFactory(draft.kind).createPolicy().statuses();
  if (!statuses.includes(draft.status)) throw new Error(`status debe ser: ${statuses.join(", ")}.`);
  if (resource === "clientes" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.detail)) throw new Error("detail debe contener un correo electrónico válido.");
  const extra = resource === "clientes" ? ["document", "phone", "address"] : ["clientId", "responsible", "startDate", "endDate"];
  for (const field of extra) {
    if (typeof input[field] !== "string" || !input[field].trim() || input[field].length > 200) throw new Error(field + " es obligatorio (máximo 200 caracteres).");
    Object.assign(draft, { [field]: input[field].trim() });
  }
  if (resource === "clientes") {
    if (!(draft.kind === "Persona" ? /^\d{8}$/ : /^\d{11}$/).test(draft.document!)) throw new Error("Persona requiere DNI de 8 dígitos; Empresa, RUC de 11 dígitos.");
    if (!/^\+?[\d ()-]{7,20}$/.test(draft.phone!)) throw new Error("Teléfono inválido (7 a 20 caracteres).");
  } else {
    const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10) === date;
    if (!validDate(draft.startDate!) || !validDate(draft.endDate!) || draft.endDate! < draft.startDate!) throw new Error("Fechas inválidas: el fin debe ser igual o posterior al inicio.");
    if (typeof input.budget !== "number" || !Number.isFinite(input.budget) || input.budget <= 0 || input.budget > 1e12) throw new Error("El presupuesto debe ser mayor que cero y no superar 1 billón.");
    draft.budget = input.budget;
    const progress = input.progress ?? 0;
    if (typeof progress !== "number" || !Number.isInteger(progress) || progress < 0 || progress > 100) throw new Error("El avance debe ser un entero entre 0 y 100.");
    draft.progress = progress;
  }
  return draft;
}

