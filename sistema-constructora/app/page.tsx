"use client";
import { useEffect, useState, type FormEvent } from "react";
import { ConcreteClientCreator, projectFactory, type Draft, type Entry } from "@/lib/patterns";
import { RecordDetail } from "@/components/record-detail";
import { validate } from "@/backend/domain/validation";
const initial: Record<string, Entry[]> = { clients: [], projects: [] };
const blank: Draft = { name: "", detail: "", kind: "Persona", status: "Activo" };
export default function Home() {
  const [tab, setTab] = useState("clients");
  const [data, setData] = useState(initial);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<Draft>(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Entry | null>(null);
  const [message, setText] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error">("error");
  function setMessage(text: string, kind: "success" | "error" = "error") { setText(text); setMessageKind(kind); }
  const clients = tab === "clients";
  const statuses = clients ? ["Activo", "Inactivo"] : projectFactory(form.kind).createPolicy().statuses();
  useEffect(() => {
    try {
      const saved = localStorage.getItem("constructora-v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        const valid = (rows: unknown): rows is Entry[] => Array.isArray(rows) && rows.every(row => row && ["id", "name", "detail", "kind", "status"].every(key => typeof row[key] === "string"));
        if (valid(parsed.clients) && valid(parsed.projects)) setData(parsed);
        else setMessage("Los datos guardados no tienen un formato válido.");
      }
    } catch { setMessage("No se pudieron leer los datos del navegador."); }
    setReady(true);
  }, []);
  function persist(next: typeof data) {
    try { localStorage.setItem("constructora-v1", JSON.stringify(next)); setData(next); return true; }
    catch { setMessage("No se pudo guardar. Revisa el almacenamiento del navegador."); return false; }
  }
  function start(item?: Entry) {
    setMessage("");
    setEditing(item?.id ?? null);
    setForm(item ?? (clients ? blank : { name: "", detail: "", kind: "Residencial", status: "Planificación", progress: 0 }));
    setOpen(true);
  }
  function save(event: FormEvent) {
    event.preventDefault();
    let draft: Draft;
    try { draft = validate(clients ? "clientes" : "obras", form); }
    catch (error) { setMessage((error as Error).message); return; }
    if (!clients && !data.clients.some(client => client.id === draft.clientId)) { setMessage("Selecciona un cliente existente."); return; }
    if (!draft.name || !draft.detail) { setMessage("Completa los campos sin usar solo espacios."); return; }
    const built = clients ? new ConcreteClientCreator().create(draft) : projectFactory(draft.kind).createProject().build(draft);
    const record = { ...built, id: editing ?? built.id };
    const rows = editing ? data[tab].map(row => row.id === editing ? record : row) : [...data[tab], record];
    if (persist({ ...data, [tab]: rows })) { setOpen(false); setMessage(`${editing ? "Se actualizó" : "Se guardó"} ${clients ? "el cliente" : "la obra"} «${record.name}» correctamente.`, "success"); }
  }
  function remove(item: Entry) {
    if (clients && data.projects.some(project => project.clientId === item.id)) { setMessage("No puedes eliminar este cliente porque tiene obras asociadas."); return; }
    if (window.confirm(`¿Eliminar «${item.name}»? Esta acción no se puede deshacer.`)) {
      if (persist({ ...data, [tab]: data[tab].filter(row => row.id !== item.id) })) setMessage(`Se eliminó ${clients ? "el cliente" : "la obra"} «${item.name}» correctamente.`, "success");
    }
  }
  const rows = data[tab].filter(row => `${row.name} ${row.detail} ${row.kind} ${row.status} ${row.document ?? ""} ${row.phone ?? ""} ${row.responsible ?? ""} ${data.clients.find(client => client.id === row.clientId)?.name ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="shell">
    <aside><a className="brand" href="/">▥ <span>CONSTRUCTORA<small>GESTIÓN & DESARROLLO</small></span></a><div className="nav-label">ESPACIO DE TRABAJO</div><nav>{[["clients", "◉", "Clientes"], ["projects", "▦", "Obras"]].map(([key, icon, label]) => <button key={key} className={tab === key ? "selected" : ""} onClick={() => { setTab(key); setQuery(""); setMessage(""); }}><span>{icon}</span>{label}<b>{data[key].length}</b></button>)}</nav><div className="aside-bottom"><i /> Almacenamiento local<small>Los datos se guardan en este navegador.</small></div></aside>
    <main><header><span>Administración <span className="slash">/</span> {clients ? "Clientes" : "Obras"}</span><span className="avatar">AD</span></header><section className="content"><div className="eyebrow">SISTEMA DE GESTIÓN · CONSTRUCTORA</div><div className="heading"><div><h1>{clients ? "Clientes" : "Obras"}<span>.</span></h1><p>{clients ? "Organiza tus contactos y construye nuevas relaciones." : "Administra cada obra, desde la idea hasta la entrega."}</p></div><button className="primary" disabled={!ready} onClick={() => start()}>＋ {clients ? "Nuevo cliente" : "Nueva obra"}</button></div>
    <div className="stats"><article><span>{clients ? "Total de clientes" : "Total de obras"}</span><strong>{data[tab].length.toString().padStart(2, "0")}</strong><small>Registros en tu espacio de trabajo</small></article><article><span>{clients ? "Clientes activos" : "En ejecución"}</span><strong>{data[tab].filter(row => row.status === (clients ? "Activo" : "En ejecución")).length.toString().padStart(2, "0")}</strong><small><i /> {clients ? "Relaciones en movimiento" : "Proyectos en movimiento"}</small></article><article className="pattern"><span>PATRÓN DE DISEÑO</span><strong>{clients ? "Factory Method" : "Abstract Factory"}</strong><small>{clients ? "Un creador delega la construcción del cliente." : "Familias de obras y políticas compatibles."}</small></article></div>
    <div className="records"><div className="toolbar"><div><h2>{clients ? "Directorio de clientes" : "Portafolio de obras"}</h2><span>{data[tab].length} registros</span></div><label className="search">⌕ <input aria-label="Buscar registros" placeholder={clients ? "Buscar clientes…" : "Buscar obras…"} value={query} onChange={event => setQuery(event.target.value)} /></label></div>
    {message && !open && <div className={`notice notice-${messageKind}`} role={messageKind === "error" ? "alert" : "status"}>{message}<button aria-label="Cerrar mensaje" onClick={() => setMessage("")}>×</button></div>}
    <div className="table-wrap"><table><thead><tr><th>{clients ? "CLIENTE" : "OBRA"}</th><th>{clients ? "CONTACTO" : "UBICACIÓN"}</th><th>{clients ? "DOCUMENTO" : "CLIENTE"}</th><th>TIPO</th><th>ESTADO</th><th>ACCIONES</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><span className="row-icon">{row.name.slice(0, 2).toUpperCase()}</span><button className="name" onClick={() => setView(row)}>{row.name}</button></td><td>{row.detail}</td><td>{clients ? row.document || "Pendiente" : data.clients.find(client => client.id === row.clientId)?.name || "Sin asignar"}</td><td>{row.kind}</td><td><span className={`badge ${row.status === "Inactivo" ? "muted" : ""}`}>{row.status}</span></td><td><div className="actions"><button onClick={() => setView(row)}>Ver</button><button onClick={() => start(row)}>Editar</button><button className="danger" onClick={() => remove(row)}>Eliminar</button></div></td></tr>)}</tbody></table></div>
    {!rows.length && <div className="empty"><div>▦</div><h3>{query ? "No encontramos coincidencias" : clients ? "Tu próximo cliente empieza aquí" : "Construye tu próximo proyecto"}</h3><p>{query ? "Prueba con otro nombre, tipo o estado." : "Crea tu primer registro para comenzar a organizar tu trabajo."}</p>{!query && <button disabled={!ready} className="secondary" onClick={() => start()}>＋ Crear {clients ? "cliente" : "obra"}</button>}</div>}<footer>{ready ? `${rows.length} registros visibles` : "Cargando datos…"}<span>Gestión simple. Bases sólidas.</span></footer></div>
    <div className="explanation"><span>⌘</span><div><b>Arquitectura del módulo</b><p>{clients ? "ConcreteClientCreator implementa el método de fábrica y devuelve un producto Client. El flujo de creación utiliza la abstracción ClientCreator." : "ResidentialFactory y CommercialFactory producen dos objetos relacionados: un proyecto y su política de estados. La familia seleccionada determina ambos productos."}</p></div></div>
    </section></main>
    {open && <div className="overlay"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title"><button className="close" aria-label="Cerrar formulario" onClick={() => setOpen(false)}>×</button><div className="eyebrow">{clients ? "FACTORY METHOD" : "ABSTRACT FACTORY"}</div><h2 id="form-title">{editing ? "Editar" : "Crear"} {clients ? "cliente" : "obra"}</h2><form onSubmit={save} onInvalid={() => setMessage("Revisa los campos obligatorios y los valores indicados en el formulario.")}>{message && <div className={`notice notice-${messageKind}`} role="alert">{message}</div>}<label>Nombre<input autoFocus required maxLength={100} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label><label>{clients ? "Correo electrónico" : "Ubicación"}<input required type={clients ? "email" : "text"} maxLength={160} value={form.detail} onChange={event => setForm({ ...form, detail: event.target.value })} /></label>{clients ? <>
<label>{form.kind === "Empresa" ? "RUC (11 dígitos)" : "DNI (8 dígitos)"}<input required inputMode="numeric" maxLength={11} value={form.document ?? ""} onChange={event => setForm({ ...form, document: event.target.value })}/></label>
<label>Teléfono<input required type="tel" maxLength={20} value={form.phone ?? ""} onChange={event => setForm({ ...form, phone: event.target.value })}/></label>
<label>Dirección<input required maxLength={200} value={form.address ?? ""} onChange={event => setForm({ ...form, address: event.target.value })}/></label>
</> : <>
<label>Cliente<select required value={form.clientId ?? ""} onChange={event => setForm({ ...form, clientId: event.target.value })}><option value="">Selecciona un cliente</option>{data.clients.map(client => <option key={client.id} value={client.id}>{client.name} · {client.document || "Documento pendiente"}</option>)}</select></label>
{!data.clients.length && <p role="status">Registra primero un cliente en el módulo Clientes.</p>}
<label>Ingeniero responsable<input required maxLength={200} value={form.responsible ?? ""} onChange={event => setForm({ ...form, responsible: event.target.value })}/></label>
<div className="form-grid"><label>Fecha de inicio<input required type="date" value={form.startDate ?? ""} onChange={event => setForm({ ...form, startDate: event.target.value })}/></label><label>Fecha de fin<input required type="date" min={form.startDate} value={form.endDate ?? ""} onChange={event => setForm({ ...form, endDate: event.target.value })}/></label></div>
<label>Presupuesto (S/)<input required type="number" min="0.01" max="1000000000000" step="0.01" value={form.budget ?? ""} onChange={event => setForm({ ...form, budget: event.target.value === "" ? undefined : Number(event.target.value) })}/></label>
<label>Avance físico de la obra <span className="progress-value">{form.progress ?? 0}%</span><input aria-label="Avance físico de la obra" type="range" min="0" max="100" step="1" value={form.progress ?? 0} onChange={event => setForm({ ...form, progress: Number(event.target.value) })}/></label><p className="field-help">Registra el avance real de la obra; se guarda al confirmar el formulario.</p>
</>}<div className="form-grid"><label>Tipo<select value={form.kind} onChange={event => { const kind = event.target.value; setForm({ ...form, kind, status: clients ? form.status : projectFactory(kind).createPolicy().statuses()[0] }); }}>{(clients ? ["Persona", "Empresa"] : ["Residencial", "Comercial"]).map(kind => <option key={kind}>{kind}</option>)}</select></label><label>Estado<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label></div>{!clients && <p className="family">{projectFactory(form.kind).createPolicy().description()}</p>}<div className="form-actions"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="primary" type="submit">Guardar {clients ? "cliente" : "obra"}</button></div></form></section></div>}
    {view && <RecordDetail record={view} clients={data.clients} projects={data.projects} isClient={clients} onClose={() => setView(null)} onEdit={() => { setView(null); start(view); }}/>}
  </div>;
}
