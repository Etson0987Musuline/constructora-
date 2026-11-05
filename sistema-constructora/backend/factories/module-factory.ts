import { ConcreteClientCreator, projectFactory, type Draft } from "../../lib/patterns.ts";
import type { CrudModuleFactory } from "../domain/contracts.ts";
import { validate } from "../domain/validation.ts";
import { JsonRepository } from "../infrastructure/json-repository.ts";
export class ClientModuleFactory implements CrudModuleFactory {
  createRepository() { return new JsonRepository("clientes"); }
  createValidator() { return { validate: (value: unknown) => validate("clientes", value) }; }
  createBuilder() {
    const creator = new ConcreteClientCreator();
    return { build: (draft: Draft) => creator.create(draft) };
  }
}
export class ProjectModuleFactory implements CrudModuleFactory {
  createRepository() { return new JsonRepository("obras"); }
  createValidator() { return { validate: (value: unknown) => validate("obras", value) }; }
  createBuilder() { return { build: (draft: Draft) => projectFactory(draft.kind).createProject().build(draft) }; }
}

