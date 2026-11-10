import test from "node:test";
import assert from "node:assert/strict";
import { createApi } from "./api-client.ts";
const draft = {name:"Juan",detail:"juan@example.com",kind:"Persona",status:"Activo"};
test("El cliente web usa la API compartida y preserva IDs y errores",async()=>{
 const calls: {url:string; method:string; body?:string}[]=[];
 const client=createApi(async(url,init)=>{
  calls.push({url,method:init?.method??"GET",body:init?.body as string|undefined});
  if(init?.method==="DELETE")return new Response(null,{status:204});
  if(url.endsWith("/missing"))return Response.json({error:"Registro no encontrado."},{status:404});
  return Response.json(init?.method?{...draft,id:"server-id"}:[]);
 });
 assert.deepEqual(await client.load(),{clients:[],projects:[]});
 const saved=await client.save("clients",draft);assert.equal(saved.id,"server-id");
 await client.save("projects",draft,"work-id");
 await client.remove("clients","client-id");
 await assert.rejects(client.save("clients",draft,"missing"),/Registro no encontrado/);
 assert.equal(calls[2].method,"POST");assert.equal(calls[2].url,"/api/clientes");
 assert.equal(calls[3].method,"PUT");assert.equal(calls[3].url,"/api/obras/work-id");
 assert.equal(calls[4].method,"DELETE");assert.equal(calls[4].url,"/api/clientes/client-id");
});
