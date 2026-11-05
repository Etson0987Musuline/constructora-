export type ExtraFields = { document?: string; phone?: string; address?: string; clientId?: string; responsible?: string; startDate?: string; endDate?: string; budget?: number; progress?: number };
export type Entry = ExtraFields & { id: string; name: string; detail: string; kind: string; status: string };
export type Draft = Omit<Entry, "id">;
interface ClientProduct { build(data: Draft): Entry }
class Client implements ClientProduct {
  build(data: Draft): Entry { return { ...data, id: crypto.randomUUID() }; }
}
// Factory Method: el creador delega la construcción a las subclases.
export abstract class ClientCreator {
  protected abstract factoryMethod(): ClientProduct;
  create(data: Draft): Entry { return this.factoryMethod().build(data); }
}
export class ConcreteClientCreator extends ClientCreator {
  protected factoryMethod(): ClientProduct { return new Client(); }
}
interface ProjectProduct { build(data: Draft): Entry }
interface PolicyProduct { statuses(): string[]; description(): string }
// Abstract Factory: familias de productos relacionados (obra y política).
export interface ProjectFactory {
  createProject(): ProjectProduct;
  createPolicy(): PolicyProduct;
}
class ResidentialProject implements ProjectProduct {
  build(data: Draft): Entry { return { ...data, kind: "Residencial", id: crypto.randomUUID() }; }
}
class CommercialProject implements ProjectProduct {
  build(data: Draft): Entry { return { ...data, kind: "Comercial", id: crypto.randomUUID() }; }
}
class ResidentialPolicy implements PolicyProduct {
  statuses() { return ["Planificación", "En ejecución", "Entregada"]; }
  description() { return "Familia residencial: viviendas y edificios habitacionales."; }
}
class CommercialPolicy implements PolicyProduct {
  statuses() { return ["Evaluación", "En ejecución", "Entregada"]; }
  description() { return "Familia comercial: locales y espacios de negocio."; }
}
export class ResidentialFactory implements ProjectFactory {
  createProject() { return new ResidentialProject(); }
  createPolicy() { return new ResidentialPolicy(); }
}
export class CommercialFactory implements ProjectFactory {
  createProject() { return new CommercialProject(); }
  createPolicy() { return new CommercialPolicy(); }
}
export function projectFactory(kind: string): ProjectFactory {
  return kind === "Comercial" ? new CommercialFactory() : new ResidentialFactory();
}
