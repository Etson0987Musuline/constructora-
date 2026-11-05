import { RelationError } from "./domain/relation-error.ts";
import { ValidationError } from "./application/crud-service.ts";
export const missing = () => Response.json({ error: "Registro no encontrado." }, { status: 404 });
export function failure(error: unknown) {
  if (error instanceof RelationError) return Response.json({ error: error.message }, { status: 409 });
  if (error instanceof ValidationError) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ error: "No se pudo completar la operación de almacenamiento." }, { status: 500 });
}

