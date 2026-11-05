# Backend Go — Constructora

Servidor independiente de Next.js, sin dependencias externas. Requiere Go 1.27 o posterior.

```powershell
cd C:\Users\LENOVO\Downloads\Constructora\Constructora\backend
go run .
```

URL: http://localhost:8081. `PORT` permite cambiar el puerto. `CONSTRUCTORA_DATA_FILE` permite cambiar el archivo; por defecto `data/records.json`.

## Los dos patrones en ambos CRUD

- **Factory Method** en `factories/factory_method.go`: `Creator` declara `FactoryMethod() Product`; `ClientCreator` y `ProjectCreator` eligen el producto concreto. El flujo compartido `Create` delega la construcción a ese método. Go utiliza interfaces y composición, sin clases abstractas.
- **Abstract Factory** en `factories/abstract_factory.go`: `ModuleFactory` crea una familia compatible de tres productos: repositorio, validador y creador. `ClientFactory` entrega los de clientes; `ProjectFactory` los de obras.
- `services/crud.go` recibe la fábrica abstracta, coordina el CRUD y llama al flujo Factory Method tanto en creación como en actualización.
- `handlers/proyectos.go` adapta JSON, rutas y códigos HTTP; no contiene persistencia ni construcción de entidades.
- `database/conexion.go` implementa el contrato Repository con un archivo JSON, escritura temporal y mutex para no perder cambios concurrentes en una instancia.
- `models/proyecto.go` contiene DTO y entidad compartidos.
- `main.go` compone las dependencias y registra ambos módulos.

```text
HTTP → handler → servicio CRUD
                    ├── Abstract Factory → repositorio + validador + creador
                    └── Factory Method del creador → producto → entidad
```

## Endpoints para Postman

Importa `postman/Constructora-Go.postman_collection.json`. Ejecuta Crear primero; se captura el ID automáticamente.

| Método | Clientes | Obras |
| --- | --- | --- |
| POST | /api/clientes | /api/obras |
| GET | /api/clientes | /api/obras |
| GET | /api/clientes/{id} | /api/obras/{id} |
| PUT | /api/clientes/{id} | /api/obras/{id} |
| DELETE | /api/clientes/{id} | /api/obras/{id} |

GET de listado admite `?q=texto`. Salud: GET `/api/salud`.

Cliente (POST y PUT; Content-Type application/json):

```json
{"name":"Juan Pérez","detail":"juan@example.com","kind":"Persona","status":"Activo"}
```

Tipos: Persona/Empresa. Estados: Activo/Inactivo.

Obra:

```json
{"name":"Edificio Los Olivos","detail":"Lima","kind":"Residencial","status":"Planificación"}
```

Residencial: Planificación/En ejecución/Entregada. Comercial: Evaluación/En ejecución/Entregada. PUT requiere los cuatro campos y conserva el ID.

Códigos: 201 creado, 200 consulta/actualización, 204 eliminación, 400 datos inválidos, 404 inexistente, 405 método no permitido, 500 error de almacenamiento.

## Verificación

```powershell
go test ./...
go vet ./...
```

Las pruebas cubren ambos CRUD, validación, persistencia al reconstruir el router, conservación del ID, búsqueda y creaciones simultáneas.

El backend Next.js sigue disponible en `../sistema-constructora/backend` con los dos patrones y API en puerto 3000. Ambos servidores tienen archivos de datos independientes y la interfaz mantiene localStorage. No hay sincronización entre ellos. Este backend está preparado para uso local en una instancia; no incluye autenticación.


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
