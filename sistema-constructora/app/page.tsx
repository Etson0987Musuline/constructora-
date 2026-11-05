"use client";
import { useEffect, useState, type FormEvent } from "react";
import { ConcreteClientCreator, projectFactory, type Draft, type Entry } from "@/lib/patterns";
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
  const [message, setMessage] = useState("");
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
    setEditing(item?.id ?? null);
    setForm(item ?? (clients ? blank : { name: "", detail: "", kind: "Residencial", status: "Planificación" }));
    setOpen(true);
  }
  function save(event: FormEvent) {
    event.preventDefault();
    const draft = { ...form, name: form.name.trim(), detail: form.detail.trim() };
    if (!draft.name || !draft.detail) { setMessage("Completa los campos sin usar solo espacios."); return; }
    const built = clients ? new ConcreteClientCreator().create(draft) : projectFactory(draft.kind).createProject().build(draft);
    const record = { ...built, id: editing ?? built.id };
    const rows = editing ? data[tab].map(row => row.id === editing ? record : row) : [...data[tab], record];
    if (persist({ ...data, [tab]: rows })) { setOpen(false); setMessage(editing ? "Registro actualizado." : "Registro creado."); }
  }
  function remove(item: Entry) {
    if (window.confirm(`¿Eliminar «${item.name}»? Esta acción no se puede deshacer.`)) {
      if (persist({ ...data, [tab]: data[tab].filter(row => row.id !== item.id) })) setMessage("Registro eliminado.");
    }
  }
  const rows = data[tab].filter(row => `${row.name} ${row.detail} ${row.kind} ${row.status}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="shell">
    <aside><a className="brand" href="/">▥ <span>CONSTRUCTORA<small>GESTIÓN & DESARROLLO</small></span></a><div className="nav-label">ESPACIO DE TRABAJO</div><nav>{[["clients", "◉", "Clientes"], ["projects", "▦", "Obras"]].map(([key, icon, label]) => <button key={key} className={tab === key ? "selected" : ""} onClick={() => { setTab(key); setQuery(""); setMessage(""); }}><span>{icon}</span>{label}<b>{data[key].length}</b></button>)}</nav><div className="aside-bottom"><i /> Almacenamiento local<small>Los datos se guardan en este navegador.</small></div></aside>
    <main><header><span>Administración <span className="slash">/</span> {clients ? "Clientes" : "Obras"}</span><span className="avatar">AD</span></header><section className="content"><div className="eyebrow">SISTEMA DE GESTIÓN · CONSTRUCTORA</div><div className="heading"><div><h1>{clients ? "Clientes" : "Obras"}<span>.</span></h1><p>{clients ? "Organiza tus contactos y construye nuevas relaciones." : "Administra cada obra, desde la idea hasta la entrega."}</p></div><button className="primary" disabled={!ready} onClick={() => start()}>＋ {clients ? "Nuevo cliente" : "Nueva obra"}</button></div>
    <div className="stats"><article><span>{clients ? "Total de clientes" : "Total de obras"}</span><strong>{data[tab].length.toString().padStart(2, "0")}</strong><small>Registros en tu espacio de trabajo</small></article><article><span>{clients ? "Clientes activos" : "En ejecución"}</span><strong>{data[tab].filter(row => row.status === (clients ? "Activo" : "En ejecución")).length.toString().padStart(2, "0")}</strong><small><i /> {clients ? "Relaciones en movimiento" : "Proyectos en movimiento"}</small></article><article className="pattern"><span>PATRÓN DE DISEÑO</span><strong>{clients ? "Factory Method" : "Abstract Factory"}</strong><small>{clients ? "Un creador delega la construcción del cliente." : "Familias de obras y políticas compatibles."}</small></article></div>
    <div className="records"><div className="toolbar"><div><h2>{clients ? "Directorio de clientes" : "Portafolio de obras"}</h2><span>{data[tab].length} registros</span></div><label className="search">⌕ <input aria-label="Buscar registros" placeholder={clients ? "Buscar clientes…" : "Buscar obras…"} value={query} onChange={event => setQuery(event.target.value)} /></label></div>
    {message && <div className="notice" role="status">{message}<button aria-label="Cerrar mensaje" onClick={() => setMessage("")}>×</button></div>}
    <div className="table-wrap"><table><thead><tr><th>{clients ? "CLIENTE" : "OBRA"}</th><th>{clients ? "CONTACTO" : "UBICACIÓN"}</th><th>TIPO</th><th>ESTADO</th><th>ACCIONES</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><span className="row-icon">{row.name.slice(0, 2).toUpperCase()}</span><button className="name" onClick={() => setView(row)}>{row.name}</button></td><td>{row.detail}</td><td>{row.kind}</td><td><span className={`badge ${row.status === "Inactivo" ? "muted" : ""}`}>{row.status}</span></td><td><div className="actions"><button onClick={() => setView(row)}>Ver</button><button onClick={() => start(row)}>Editar</button><button className="danger" onClick={() => remove(row)}>Eliminar</button></div></td></tr>)}</tbody></table></div>
    {!rows.length && <div className="empty"><div>▦</div><h3>{query ? "No encontramos coincidencias" : clients ? "Tu próximo cliente empieza aquí" : "Construye tu próximo proyecto"}</h3><p>{query ? "Prueba con otro nombre, tipo o estado." : "Crea tu primer registro para comenzar a organizar tu trabajo."}</p>{!query && <button disabled={!ready} className="secondary" onClick={() => start()}>＋ Crear {clients ? "cliente" : "obra"}</button>}</div>}<footer>{ready ? `${rows.length} registros visibles` : "Cargando datos…"}<span>Gestión simple. Bases sólidas.</span></footer></div>
    <div className="explanation"><span>⌘</span><div><b>Arquitectura del módulo</b><p>{clients ? "ConcreteClientCreator implementa el método de fábrica y devuelve un producto Client. El flujo de creación utiliza la abstracción ClientCreator." : "ResidentialFactory y CommercialFactory producen dos objetos relacionados: un proyecto y su política de estados. La familia seleccionada determina ambos productos."}</p></div></div>
    </section></main>
    {open && <div className="overlay"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title"><button className="close" aria-label="Cerrar formulario" onClick={() => setOpen(false)}>×</button><div className="eyebrow">{clients ? "FACTORY METHOD" : "ABSTRACT FACTORY"}</div><h2 id="form-title">{editing ? "Editar" : "Crear"} {clients ? "cliente" : "obra"}</h2><form onSubmit={save}><label>Nombre<input autoFocus required maxLength={100} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label><label>{clients ? "Correo electrónico" : "Ubicación"}<input required type={clients ? "email" : "text"} maxLength={160} value={form.detail} onChange={event => setForm({ ...form, detail: event.target.value })} /></label><div className="form-grid"><label>Tipo<select value={form.kind} onChange={event => { const kind = event.target.value; setForm({ ...form, kind, status: clients ? form.status : projectFactory(kind).createPolicy().statuses()[0] }); }}>{(clients ? ["Persona", "Empresa"] : ["Residencial", "Comercial"]).map(kind => <option key={kind}>{kind}</option>)}</select></label><label>Estado<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label></div>{!clients && <p className="family">{projectFactory(form.kind).createPolicy().description()}</p>}{message && <p role="status">{message}</p>}<div className="form-actions"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="primary" type="submit">Guardar {clients ? "cliente" : "obra"}</button></div></form></section></div>}
    {view && <div className="overlay"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title"><button className="close" aria-label="Cerrar detalle" onClick={() => setView(null)}>×</button><div className="eyebrow">DETALLE DEL REGISTRO</div><h2 id="detail-title">{view.name}</h2><dl><dt>{clients ? "Contacto" : "Ubicación"}</dt><dd>{view.detail}</dd><dt>Tipo</dt><dd>{view.kind}</dd><dt>Estado</dt><dd>{view.status}</dd><dt>Identificador</dt><dd className="identifier">{view.id}</dd></dl><button className="primary" onClick={() => setView(null)}>Cerrar</button></section></div>}
  </div>;
}
