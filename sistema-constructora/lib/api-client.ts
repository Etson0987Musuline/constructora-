import type { Draft, Entry } from "./patterns.ts";
export type Module = "clients" | "projects";
const resources: Record<Module,string> = { clients:"clientes", projects:"obras" };
export type Records = Record<Module, Entry[]>;
export type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;
export function createApi(fetcher: Fetcher = fetch) {
 async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetcher(path, { ...init, cache:"no-store", headers:{ "Content-Type":"application/json", ...init?.headers } });
  if (!response.ok) {
   const body = await response.json().catch(()=>null);
   throw new Error(body?.error ?? `La operación falló (${response.status}). Intenta nuevamente.`);
  }
  return response.status === 204 ? undefined as T : response.json();
 }
 return {
  async load(): Promise<Records> { const [clients,projects] = await Promise.all([request<Entry[]>("/api/clientes"),request<Entry[]>("/api/obras")]); return {clients,projects}; },
  save(module: Module, draft: Draft, id?: string | null): Promise<Entry> { return request(`/api/${resources[module]}${id ? `/${encodeURIComponent(id)}` : ""}`, {method:id?"PUT":"POST",body:JSON.stringify(draft)}); },
  remove(module: Module, id: string): Promise<void> { return request(`/api/${resources[module]}/${encodeURIComponent(id)}`,{method:"DELETE"}); }
 };
}
export const api = createApi();
