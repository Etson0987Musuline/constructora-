# Sistema Constructora

Dos CRUD en Next.js y TypeScript:

- **Clientes — Factory Method:** `ClientCreator` define el flujo y su método abstracto; `ConcreteClientCreator` crea el producto `Client`.
- **Obras — Abstract Factory:** `ProjectFactory` define dos productos relacionados (obra y política). `ResidentialFactory` y `CommercialFactory` entregan familias compatibles, con sus propios estados iniciales.

Ambos módulos permiten crear, listar, buscar, consultar detalles, editar y eliminar con confirmación. Los formularios validan campos obligatorios y correo electrónico. Los datos se conservan en `localStorage`: son locales a este navegador y no se comparten entre equipos. No requiere base de datos ni servidor de persistencia.

## Ejecutar

Desde esta carpeta:

```powershell
npm install
npm run dev
```

Abrir http://localhost:3000.

## Verificar

```powershell
npm run build
node --experimental-strip-types --test lib/patterns.test.ts
```

Las pruebas requieren Node.js 22.6 o posterior. La implementación de los patrones está en `lib/patterns.ts`, la interfaz y operaciones CRUD en `app/page.tsx` y los estilos adaptables en `app/globals.css`.

## API y Postman

Importa `postman/Constructora.postman_collection.json` en Postman. `base_url` vale `http://localhost:3000`. Inicia `npm run dev` y ejecuta cada carpeta en orden; Crear captura automáticamente `cliente_id` u `obra_id`.

| Método | Clientes | Obras |
| --- | --- | --- |
| GET | /api/clientes | /api/obras |
| POST | /api/clientes | /api/obras |
| GET | /api/clientes/{id} | /api/obras/{id} |
| PUT | /api/clientes/{id} | /api/obras/{id} |
| DELETE | /api/clientes/{id} | /api/obras/{id} |

POST y PUT reciben JSON con los cuatro campos obligatorios: `name`, `detail`, `kind`, `status`. PUT reemplaza todos los campos conservando el ID. GET de listado acepta `?q=texto`.

Cliente: `{"name":"Juan Pérez","detail":"juan@example.com","kind":"Persona","status":"Activo"}`. Tipos: Persona/Empresa. Estados: Activo/Inactivo.

Obra: `{"name":"Edificio Los Olivos","detail":"Lima","kind":"Residencial","status":"Planificación"}`. Residencial: Planificación/En ejecución/Entregada. Comercial: Evaluación/En ejecución/Entregada.

Respuestas: creación 201, lectura/actualización 200, eliminación 204 sin cuerpo, validación 400, registro inexistente 404, fallo de almacenamiento 500. Los errores son JSON con campo `error`.

La API persiste en `data/records.json` (excluido del control de versiones), para uso local en una sola instancia de Node.js. Es independiente del localStorage de la interfaz: los registros no se sincronizan. No incorpora autenticación.

Pruebas: `node --experimental-strip-types --test lib/api.test.ts lib/patterns.test.ts`.

## Estructura del backend

El flujo de cada petición es:

```text
Rutas HTTP → ServiceCreator (Factory Method)
           → CrudModuleFactory (Abstract Factory)
           → CrudService → Repository → archivo JSON
```

- `backend/domain/contracts.ts`: contratos del repositorio, validador, constructor y fábrica abstracta.
- `backend/domain/validation.ts`: reglas de campos, tipos, correos y estados.
- `backend/application/service-creator.ts`: `ServiceCreator` define `factoryMethod()` y el flujo de creación del servicio. `ClientServiceCreator` y `ProjectServiceCreator` seleccionan la fábrica del módulo.
- `backend/factories/module-factory.ts`: `ClientModuleFactory` y `ProjectModuleFactory` implementan Abstract Factory. Cada una entrega tres productos compatibles: repositorio de su entidad, validador y constructor.
- `backend/application/crud-service.ts`: coordina validación, construcción, consulta, búsqueda, actualización y eliminación, dependiendo de los contratos.
- `backend/infrastructure/json-repository.ts`: lectura y escritura en archivo; se puede sustituir implementando `Repository` y proporcionando otra fábrica.
- `backend/http.ts`: traducción de errores a respuestas HTTP.
- `app/api`: adaptación de las peticiones y respuestas, sin acceso directo a archivos.

Los dos patrones se usan para componer ambos CRUD. Además, los constructores de dominio conservan Factory Method para clientes y las familias Abstract Factory para obras residenciales/comerciales en `lib/patterns.ts`. La actualización valida y construye la entidad mediante la misma familia, conservando su ID.

Se conservan las rutas y los cuerpos de la colección Postman. La persistencia JSON sigue destinada a una instancia local del servidor; la interfaz continúa con su almacenamiento independiente.

## Backend independiente en Go

La carpeta `../backend` también implementa ambos CRUD usando Factory Method y Abstract Factory. Ejecutar `go run .` allí para servir en puerto 8081. Tiene README y colección Postman propios. Cada backend conserva su almacenamiento separado.
