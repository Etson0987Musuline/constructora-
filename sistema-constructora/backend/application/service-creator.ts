import type { CrudModuleFactory, Resource } from "../domain/contracts.ts";
import { CrudService } from "./crud-service.ts";
import { ClientModuleFactory, ProjectModuleFactory } from "../factories/module-factory.ts";
// Factory Method: the inherited workflow creates a service through a factory method.
export abstract class ServiceCreator {
  protected abstract factoryMethod(): CrudModuleFactory;
  create(): CrudService { return new CrudService(this.factoryMethod()); }
}
export class ClientServiceCreator extends ServiceCreator {
  protected factoryMethod(): CrudModuleFactory { return new ClientModuleFactory(); }
}
export class ProjectServiceCreator extends ServiceCreator {
  protected factoryMethod(): CrudModuleFactory { return new ProjectModuleFactory(); }
}
export function serviceFor(resource: string): CrudService | null {
  const creators: Record<Resource, ServiceCreator> = { clientes: new ClientServiceCreator(), obras: new ProjectServiceCreator() };
  if (resource !== "clientes" && resource !== "obras") return null;
  return creators[resource].create();
}
