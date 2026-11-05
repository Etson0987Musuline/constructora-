import type { CrudModuleFactory } from "../domain/contracts.ts";
export class ValidationError extends Error {}
export class CrudService {
  private repository;
  private validator;
  private builder;
  constructor(factory: CrudModuleFactory) {
    this.repository = factory.createRepository();
    this.validator = factory.createValidator();
    this.builder = factory.createBuilder();
  }
  private build(value: unknown) {
    let draft;
    try { draft = this.validator.validate(value); }
    catch (error) { throw new ValidationError((error as Error).message); }
    return this.builder.build(draft);
  }
  list(query = "") {
    const text = query.toLowerCase();
    return this.repository.list().filter(row => `${row.name} ${row.detail} ${row.kind} ${row.status}`.toLowerCase().includes(text));
  }
  find(id: string) { return this.repository.find(id); }
  create(value: unknown) { return this.repository.insert(this.build(value)); }
  update(id: string, value: unknown) { return this.repository.replace(id, { ...this.build(value), id }); }
  remove(id: string) { return this.repository.delete(id); }
}
