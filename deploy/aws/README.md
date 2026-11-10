# Desplegar Constructora en AWS (consola web, us-east-1)

Arquitectura preparada: una EC2 Amazon Linux 2023, Docker Compose, web Next.js y API Go. La web llama a `/api` en el mismo dominio; Next.js redirige internamente a Go. Solo se publica la web. El JSON de Go se guarda en un volumen Docker sobre EBS. Conserva ambos patrones Factory.

Esta es una demostración para una instancia con acceso limitado a tu IP. Usa HTTP, no incorpora login ni HTTPS: no abras el grupo a todo Internet ni cargues datos personales reales. Para producción pública hay que añadir autenticación, HTTPS/dominio, backups y una base de datos administrada antes de ampliar el acceso.

## 1. Antes de crear recursos

- Cuenta AWS con permisos para CloudFormation, EC2, VPC, IAM y Systems Manager.
- Selecciona Norte de Virginia (`us-east-1`).
- Revisa los cargos de EC2, EBS y dirección IPv4 pública en tu cuenta. No se asume que sea gratis.
- Asegura que los Dockerfile, compose.yaml y esta plantilla estén publicados en GitHub. El arranque clona el repositorio público. Puedes usar `main` o el SHA completo de un commit que ya contenga estos archivos.
- Consulta tu IPv4 pública desde el equipo que abrirá la web (por ejemplo https://checkip.amazonaws.com/) y añade `/32`. Ejemplo de formato: `203.0.113.10/32` (no uses esta IP de ejemplo).

## 2. Crear desde la consola

1. Abre https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1 e inicia sesión tú mismo.
2. Elige **Crear pila / Con nuevos recursos (estándar)**.
3. Selecciona **Cargar un archivo de plantilla** y carga `deploy/aws/ec2.yaml`.
4. Nombre: `constructora-demo`.
5. Parámetros: `AllowedClientCidr` = tu IPv4/32; `InstanceType` = `t3.small`; `SourceRef` = `main` o SHA publicado. Conserva `LatestAmi`.
6. En la revisión, comprueba los recursos y reconoce la creación de recursos IAM. Crear la pila inicia los cargos.
7. Espera `CREATE_COMPLETE` (hasta 30 minutos). La instancia compila los contenedores y envía una señal de éxito solo después de comprobar la salud de web y API.
8. En **Salidas / Outputs**, abre `WebUrl` desde la IP autorizada. `ApiHealth` debe devolver JSON.
9. Prueba crear cliente, crear obra asociada y recargar desde otro dispositivo autorizado: los datos ya proceden del servidor.

La plantilla crea su VPC, subred, ruta, rol de instancia, EC2 y dirección pública estable. No abre SSH. Se administra desde la consola con Systems Manager / Session Manager. Si tu IP cambia, actualiza `AllowedClientCidr` en la pila. No alteres SourceRef esperando una actualización automática de la app: UserData solo ejecuta el arranque inicial.

## 3. Administración, actualización y respaldo

Desde EC2 selecciona la instancia, **Conectar / Session Manager**. La salida `SessionManager` también ofrece el enlace. Si falla el arranque, revisa `sudo tail -100 /var/log/constructora-bootstrap.log`.

```bash
cd /opt/constructora
sudo docker compose ps
sudo docker compose logs --tail=100
```

Actualizar a un commit ya publicado sin borrar datos:

```bash
cd /opt/constructora
sudo git fetch origin main
sudo git checkout origin/main
sudo docker compose up --detach --build --wait --wait-timeout 300
```

Hacer copia coherente del JSON (escribir fuera de la carpeta del repositorio):

```bash
cd /opt/constructora
sudo sh -c 'docker compose exec -T api cat /data/records.json > /root/constructora-backup.json'
```

Si aún no existen registros, el archivo no existe. Descarga/copia el respaldo a almacenamiento independiente; un archivo en la misma EC2 no protege contra pérdida del servidor. El archivo se escribe por reemplazo atómico en Go.

No ejecutes `docker compose down --volumes`: borra el volumen de datos. Una reconstrucción o reinicio conserva el volumen, pero reemplazar EC2 no adjunta automáticamente el disco antiguo.

## 4. Costos y eliminación

Eliminar la pila termina la EC2 y libera su dirección pública. El EBS raíz tiene `DeleteOnTermination=false` para conservar los datos; sigue generando cargos hasta que lo respaldes y elimines manualmente en EC2 / Volúmenes. Una creación fallida también puede dejar ese disco retenido. Detener EC2 no elimina cargos por EBS o dirección pública reservada.

## 5. Ejecución local y migración

Con Docker y Compose instalados, desde la raíz: `docker compose up --build --wait`. Abre http://localhost:8080. Localmente la web se vincula solo a 127.0.0.1.

La web ya no guarda clientes/obras en localStorage: ahora usa API. Los datos anteriores del navegador no se borran, pero no se importan automáticamente. Para datos locales existentes del backend, respalda y transfiere `data/records.json` con ambos módulos a la EC2 antes de empezar a usarla; no combines archivos de distintas instancias ni sobrescribas registros en uso. Los IDs cliente-obra deben conservarse.

El backend TypeScript sigue disponible en desarrollo local si no se configura API_BACKEND_URL. El Dockerfile de la web compila el proxy a `http://api:8081`; cambiarlo requiere reconstruir la imagen.

## Documentación consultada

- https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configure-root-volume-delete-on-termination.html
- https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-getting-started-instance-profile.html
- https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/cfn-signal.html
- https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-docker.html
