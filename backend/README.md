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
