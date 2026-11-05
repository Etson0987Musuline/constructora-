import { ConcreteClientCreator, projectFactory, type Draft } from "../../lib/patterns.ts";
import type { CrudModuleFactory } from "../domain/contracts.ts";
import { validate } from "../domain/validation.ts";
import { persistenceFactory, type PersistenceFactory } from "./persistence-factory.ts";
export class ClientModuleFactory implements CrudModuleFactory {
  private persistence: PersistenceFactory;
  constructor(persistence: PersistenceFactory = persistenceFactory()) { this.persistence = persistence; }
  createRepository() { return this.persistence.createClientsRepository(); }
  createValidator() { return { validate: (value: unknown) => validate("clientes", value) }; }
  createBuilder() {
    const creator = new ConcreteClientCreator();
    return { build: (draft: Draft) => creator.create(draft) };
  }
}
export class ProjectModuleFactory implements CrudModuleFactory {
  private persistence: PersistenceFactory;
  constructor(persistence: PersistenceFactory = persistenceFactory()) { this.persistence = persistence; }
  createRepository() { return this.persistence.createProjectsRepository(); }
  createValidator() { return { validate: (value: unknown) => validate("obras", value) }; }
  createBuilder() { return { build: (draft: Draft) => projectFactory(draft.kind).createProject().build(draft) }; }
}

