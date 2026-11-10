# Constructora

Sistema de clientes y obras con Factory Method y Abstract Factory, interfaz Next.js/TypeScript y backend Go.

## AWS

[Guía de despliegue en EC2 desde la consola](deploy/aws/README.md) y [plantilla CloudFormation](deploy/aws/ec2.yaml). Región prevista: us-east-1. La plantilla crea infraestructura con cargos y acceso restringido a una IPv4 /32. No es una publicación abierta: antes de abrirla al público requiere HTTPS y autenticación.

## Ejecutar integrado con Docker

```bash
docker compose up --build --wait
```

Abrir http://localhost:8080. La web usa la API Go a través del mismo origen. El volumen `constructora_records` conserva clientes y obras al reiniciar o reconstruir contenedores. No ejecutar `docker compose down --volumes` si se necesitan los datos.

## Desarrollo sin Docker

Desde `sistema-constructora`: `npm install` y `npm run dev`. La web utiliza la API TypeScript local por defecto. Para usar Go, iniciar `go run .` en `backend` y definir `API_BACKEND_URL=http://localhost:8081` antes de iniciar Next.js. La configuración del proxy se toma al iniciar/compilar.

Los datos antiguos de localStorage no se borran, pero la interfaz ya no los usa ni los importa automáticamente. El servidor es ahora la fuente de datos compartida.

## Pruebas

- Go (desde backend): `go test ./...` y `go vet ./...`.
- Next.js (desde sistema-constructora): `node --experimental-strip-types --test lib/api.test.ts lib/patterns.test.ts lib/factories.test.ts lib/api-client.test.ts` y `npm run build`.

Los Dockerfile requieren Docker Engine y Compose. La configuración local usa JSON, una sola instancia y no incorpora login.
