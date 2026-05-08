# Entrega técnica: Sistema interno de tickets e inventario

Se generó un monorepo listo para versionarse en GitHub y desplegarse manualmente en un servidor Ubuntu local. El sistema respeta la separación entre frontend, backend, base de datos, documentación y archivos de despliegue. No utiliza APIs propietarias ni dependencias serverless.

## Alcance entregado

| Área | Estado | Detalle |
|---|---:|---|
| Arquitectura | Completo | Monorepo con `apps/server`, `apps/client`, `deploy` y `docs`. |
| Backend Express | Completo | API REST modular con controladores, rutas, middleware, validaciones y servicios. |
| Prisma/PostgreSQL | Completo | Schema normalizado con usuarios, equipos, tickets, archivos, auditoría y secuencia de folios. |
| Roles y permisos | Completo | `ADMIN` y `USER`, con autorización en backend. |
| Google OAuth | Completo | Passport Google OAuth 2.0, JWT y cookie httpOnly. |
| Subida local | Completo | Multer, validación PDF/JPG/PNG y asociación a equipos/usuarios. |
| Frontend React | Completo | Login, callback OAuth, tickets, creación de ticket e inventario para ADMIN. |
| Ubuntu/Nginx | Completo | Configuración Nginx, systemd y guía de despliegue. |
| Validación | Completo | `npm run build` ejecutado correctamente para backend y frontend. |

## Decisiones de seguridad

Todas las restricciones críticas se aplican en backend. La interfaz oculta secciones según el rol, pero la seguridad real está en los middlewares `authenticate` y `requireRole`. La sesión usa cookie httpOnly, lo que reduce exposición del token ante JavaScript del navegador. Los archivos se guardan localmente y solo `ADMIN` puede gestionarlos o descargarlos.

## Comandos validados

```bash
cd /home/ubuntu/sistema-tickets-inventario-entregable
npm install
npm run build
```

La compilación generó correctamente el cliente Vite y el servidor TypeScript, incluyendo `prisma generate`.

## Próximos pasos recomendados

Antes de ejecutar en producción, configura `.env` con credenciales reales de PostgreSQL, Google OAuth y un `JWT_SECRET` robusto. Después ejecuta migraciones, seed de administradores y configura Nginx con el DDNS real.

## Archivos clave

| Archivo | Propósito |
|---|---|
| `README.md` | Guía principal lista para GitHub. |
| `.env.example` | Variables requeridas sin secretos reales. |
| `apps/server/prisma/schema.prisma` | Modelo de datos completo. |
| `apps/server/src/middleware/auth.middleware.ts` | Autenticación y autorización por roles. |
| `apps/server/src/routes/*.ts` | Rutas REST separadas por módulo. |
| `apps/client/src/pages/*.tsx` | Pantallas React principales. |
| `deploy/nginx/sistema-tickets-inventario.conf` | Proxy reverso para DDNS y frontend estático. |
| `deploy/systemd/sistema-tickets-api.service` | Servicio Linux para API. |
| `docs/DEPLOYMENT_UBUNTU.md` | Guía operativa de despliegue. |
| `docs/API_REFERENCE.md` | Referencia de endpoints. |
