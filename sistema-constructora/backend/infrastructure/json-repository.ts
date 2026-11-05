import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import path from "node:path";
import type { Entry } from "../../lib/patterns.ts";
import type { Resource, Repository } from "../domain/contracts.ts";
type Database = Record<Resource, Entry[]>;
export class JsonRepository implements Repository {
  private resource: Resource;
  constructor(resource: Resource) { this.resource = resource; }
  private file() { return process.env.CONSTRUCTORA_DATA_FILE ?? path.join(process.cwd(), "data", "records.json"); }
  private read(): Database {
    const file = this.file();
    if (!existsSync(/* turbopackIgnore: true */ file)) return { clientes: [], obras: [] };
    return JSON.parse(readFileSync(/* turbopackIgnore: true */ file, "utf8"));
  }
  private write(db: Database) {
    const file = this.file();
    mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    writeFileSync(temporary, JSON.stringify(db, null, 2), "utf8");
    renameSync(temporary, file);
  }
  list() { return this.read()[this.resource]; }
  find(id: string) { return this.list().find(entry => entry.id === id); }
  insert(entry: Entry) {
    const db = this.read(); db[this.resource].push(entry); this.write(db); return entry;
  }
  replace(id: string, entry: Entry) {
    const db = this.read(); const index = db[this.resource].findIndex(row => row.id === id);
    if (index < 0) return null;
    db[this.resource][index] = { ...entry, id }; this.write(db); return db[this.resource][index];
  }
  delete(id: string) {
    const db = this.read(); const index = db[this.resource].findIndex(row => row.id === id);
    if (index < 0) return false;
    db[this.resource].splice(index, 1); this.write(db); return true;
  }
}
