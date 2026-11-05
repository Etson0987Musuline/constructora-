import type { Repository } from "../domain/contracts.ts";
import { JsonRepositoryCreator, MemoryRepositoryCreator } from "./repository-creator.ts";
// Abstract Factory creates related repositories within the same storage environment.
export interface PersistenceFactory {
 createClientsRepository(): Repository;
 createProjectsRepository(): Repository;
}
export class JsonPersistenceFactory implements PersistenceFactory {
 private creator = new JsonRepositoryCreator();
 createClientsRepository() { return this.creator.create("clientes"); }
 createProjectsRepository() { return this.creator.create("obras"); }
}
export class MemoryPersistenceFactory implements PersistenceFactory {
 private creator = new MemoryRepositoryCreator({ clientes: [], obras: [] });
 createClientsRepository() { return this.creator.create("clientes"); }
 createProjectsRepository() { return this.creator.create("obras"); }
}
const jsonFamily = new JsonPersistenceFactory();
const memoryFamily = new MemoryPersistenceFactory();
export function persistenceFactory(): PersistenceFactory {
 const mode = process.env.CONSTRUCTORA_STORAGE ?? "json";
 if (mode === "json") return jsonFamily;
 if (mode === "memory") return memoryFamily;
 throw new Error("CONSTRUCTORA_STORAGE debe ser json o memory.");
}
