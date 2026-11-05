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


## Clientes vinculados a obras y datos completos

Una obra debe tener `clientId` de un cliente existente. Primero registra al cliente y luego crea la obra usando su ID. No se puede eliminar un cliente con obras asociadas: elimina o reasigna antes sus obras. La API responde 409 si el cliente no existe o tiene obras al intentar eliminarlo.

Los siguientes ejemplos reemplazan los cuerpos mínimos anteriores; POST y PUT requieren todos los campos de su entidad.

Cliente Persona: DNI de 8 dígitos; Empresa: RUC de 11 dígitos. Teléfono y dirección obligatorios.

```json
{
  "name": "Juan Pérez",
  "detail": "juan@example.com",
  "kind": "Persona",
  "status": "Activo",
  "document": "12345678",
  "phone": "987654321",
  "address": "Av. Perú 123, Lima"
}
```

Obra: cliente, responsable, fecha inicial, fecha final y presupuesto obligatorio mayor que cero (soles). Fechas YYYY-MM-DD; fin igual o posterior al inicio.

```json
{
  "name": "Edificio Los Olivos",
  "detail": "Lima",
  "kind": "Residencial",
  "status": "Planificación",
  "clientId": "ID_DEL_CLIENTE",
  "responsible": "Ana Torres",
  "startDate": "2026-11-05",
  "endDate": "2027-05-30",
  "budget": 150000
}
```

Los registros antiguos no se borran ni reciben datos inventados: completa sus campos al editarlos. En la página aparecen como pendientes o sin asignar. El detalle del cliente muestra sus obras y el de la obra muestra el cliente y todos sus datos. Se mantienen Factory Method y Abstract Factory.

La colección Postman está actualizada: crear cliente, crear obra y eliminar obra antes de eliminar cliente. Si ya la importaste, vuelve a importar la versión nueva. Cada backend y el navegador mantienen sus almacenamientos independientes.

## Ficha de obra, avance y notificaciones

El formulario incluye selector de cliente, ingeniero responsable (nombre), fechas, presupuesto en soles y avance físico de 0 a 100%. La ficha separa información general, cliente asociado y avance. La barra refleja el porcentaje registrado manualmente; no se deduce de las fechas ni del estado. Los registros antiguos sin porcentaje muestran «Sin registrar» hasta editarlos.

Las APIs aceptan `progress` como entero de 0 a 100 en obras; si se omite vale 0. Se conserva al consultar y editar enviándolo en PUT. La colección Postman incluye 0 en creación y 45 en actualización. El formulario muestra mensajes de éxito al guardar, actualizar y eliminar, y errores en el contexto del formulario.

## Patrones aplicados a la persistencia

Factory Method crea un repositorio individual. Abstract Factory entrega los repositorios de clientes y obras del mismo entorno. Las fábricas del módulo reciben esa fábrica como dependencia; los servicios no cambian al intercambiarla. Los entornos implementados son archivo JSON (persistente, por defecto) y memoria (temporal, para pruebas). Ambos mantienen las restricciones cliente-obra. Oracle, PostgreSQL y AWS son ejemplos de las imágenes de referencia y no están implementados.

Para usar memoria, define `CONSTRUCTORA_STORAGE=memory` antes de iniciar el servidor; `json` selecciona archivos. Reinicia el servidor al cambiarlo. Cambiar de entorno no migra datos y memoria se vacía al reiniciar. Cada fábrica de memoria creada explícitamente aísla sus datos; dentro de una fábrica ambos repositorios comparten contexto. La interfaz sigue guardando sus propios datos en el navegador.

En TypeScript, `backend/factories/repository-creator.ts` usa clase abstracta y subclases; `persistence-factory.ts` agrupa repositorios JSON o memoria. En Go, `factories/persistence_factory.go` implementa los mismos contratos mediante interfaces y composición. Go no tiene herencia de clases; TypeScript demuestra literalmente ese criterio de las imágenes.

Pruebas TypeScript (desde sistema-constructora): `node --experimental-strip-types --test lib/api.test.ts lib/patterns.test.ts lib/factories.test.ts`. Pruebas Go (desde backend): `go test ./...` y `go vet ./...`.
