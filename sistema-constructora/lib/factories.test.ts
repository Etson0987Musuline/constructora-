import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { MemoryPersistenceFactory, JsonPersistenceFactory } from "../backend/factories/persistence-factory.ts";
import { ClientModuleFactory, ProjectModuleFactory } from "../backend/factories/module-factory.ts";
import { CrudService } from "../backend/application/crud-service.ts";
import { RelationError } from "../backend/domain/relation-error.ts";
const client = {name:"Juan",detail:"juan@example.com",kind:"Persona",status:"Activo",document:"12345678",phone:"987654321",address:"Lima"};
test("Factory Method y Abstract Factory: intercambiar familias sin cambiar el servicio", () => {
 const folder=mkdtempSync(path.join(tmpdir(),"factory-family-"));const previous=process.env.CONSTRUCTORA_DATA_FILE;process.env.CONSTRUCTORA_DATA_FILE=path.join(folder,"records.json");
 try {
  for(const family of [new MemoryPersistenceFactory(),new JsonPersistenceFactory()]) {
   const clients = new CrudService(new ClientModuleFactory(family));
   const projects = new CrudService(new ProjectModuleFactory(family));
   const customer = clients.create(client);
   const draft = {name:"Obra",detail:"Lima",kind:"Residencial",status:"En ejecución",clientId:customer.id,responsible:"Ana",startDate:"2026-11-05",endDate:"2027-01-31",budget:1000,progress:40};
   const work = projects.create(draft);
   assert.equal(projects.find(work.id)?.progress,40);
   assert.throws(()=>clients.remove(customer.id),RelationError);
   assert.throws(()=>projects.create({...draft,clientId:"missing"}),RelationError);
   for(const progress of [-1,101,1.5,"50"]) assert.throws(()=>projects.update(work.id,{...draft,progress}),/avance/);
   assert.equal(projects.update(work.id,{...draft,progress:100})?.progress,100);
   assert.equal(new CrudService(new ProjectModuleFactory(family)).find(work.id)?.clientId,customer.id);
   assert.equal(new MemoryPersistenceFactory().createClientsRepository().list().length,0);
   assert.equal(projects.remove(work.id),true);assert.equal(clients.remove(customer.id),true);
  }
 } finally {if(previous===undefined)delete process.env.CONSTRUCTORA_DATA_FILE;else process.env.CONSTRUCTORA_DATA_FILE=previous;rmSync(folder,{recursive:true,force:true});}
});
