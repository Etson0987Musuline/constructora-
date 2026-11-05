import type { Repository, Resource } from "../domain/contracts.ts";
import { JsonRepository } from "../infrastructure/json-repository.ts";
import { MemoryRepository, type MemoryDatabase } from "../infrastructure/memory-repository.ts";
// Factory Method produces one repository. Subclasses override the construction method.
export abstract class RepositoryCreator {
 protected abstract factoryMethod(resource: Resource): Repository;
 create(resource: Resource): Repository { return this.factoryMethod(resource); }
}
export class JsonRepositoryCreator extends RepositoryCreator {
 protected factoryMethod(resource: Resource): Repository { return new JsonRepository(resource); }
}
export class MemoryRepositoryCreator extends RepositoryCreator {
 private database: MemoryDatabase;
 constructor(database: MemoryDatabase) { super(); this.database = database; }
 protected factoryMethod(resource: Resource): Repository { return new MemoryRepository(resource, this.database); }
}
