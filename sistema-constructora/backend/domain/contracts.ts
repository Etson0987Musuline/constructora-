import type { Draft, Entry } from "../../lib/patterns.ts";
export type Resource = "clientes" | "obras";
export interface Repository {
  list(): Entry[];
  find(id: string): Entry | undefined;
  insert(entry: Entry): Entry;
  replace(id: string, entry: Entry): Entry | null;
  delete(id: string): boolean;
}
export interface RecordBuilder { build(draft: Draft): Entry }
export interface DraftValidator { validate(value: unknown): Draft }
// Abstract Factory supplies a compatible family for one CRUD module.
export interface CrudModuleFactory {
  createRepository(): Repository;
  createValidator(): DraftValidator;
  createBuilder(): RecordBuilder;
}
