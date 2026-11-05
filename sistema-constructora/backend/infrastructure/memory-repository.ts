import type { Entry } from "../../lib/patterns.ts";
import type { Repository, Resource } from "../domain/contracts.ts";
import { RelationError } from "../domain/relation-error.ts";
export type MemoryDatabase = Record<Resource, Entry[]>;
export class MemoryRepository implements Repository {
 private resource: Resource;
 private database: MemoryDatabase;
 constructor(resource: Resource, database: MemoryDatabase) { this.resource = resource; this.database = database; }
 list() { return structuredClone(this.database[this.resource]); }
 find(id: string) { return this.list().find(row => row.id === id); }
 private check(entry: Entry) {
  if (this.resource === "obras" && !this.database.clientes.some(client => client.id === entry.clientId)) throw new RelationError("El cliente asociado no existe.");
 }
 insert(entry: Entry) { this.check(entry); this.database[this.resource].push(structuredClone(entry)); return structuredClone(entry); }
 replace(id: string, entry: Entry) {
  const index = this.database[this.resource].findIndex(row => row.id === id); if (index < 0) return null;
  this.check(entry); const updated = { ...entry, id }; this.database[this.resource][index] = structuredClone(updated); return structuredClone(updated);
 }
 delete(id: string) {
  const index = this.database[this.resource].findIndex(row => row.id === id); if (index < 0) return false;
  if (this.resource === "clientes" && this.database.obras.some(row => row.clientId === id)) throw new RelationError("No se puede eliminar un cliente con obras asociadas.");
  this.database[this.resource].splice(index, 1); return true;
 }
}
