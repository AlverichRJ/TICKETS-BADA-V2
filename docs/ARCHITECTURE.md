# Arquitectura del sistema

El sistema está organizado como un monorepo local con separación explícita entre **frontend**, **backend**, **base de datos** y **configuración de despliegue**. La aplicación no depende de APIs propietarias de Manus ni de serverless; se ejecuta sobre Node.js, Express, React, PostgreSQL y Prisma en un servidor Ubuntu administrado manualmente.

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | React + Vite | Login, captura de tickets, consulta de tickets y vista de inventario para ADMIN. |
| Backend | Node.js + Express | API REST, autorización por roles, validaciones, OAuth, subida de archivos y reglas de negocio. |
| Persistencia | PostgreSQL + Prisma | Usuarios, equipos, tickets, archivos e historial de cambios. |
| Archivos | Multer + filesystem local | Guarda PDF, JPG y PNG en `/uploads` o ruta configurada. |
| Proxy | Nginx | Sirve frontend estático, redirige `/api` al backend y queda listo para SSL con Let's Encrypt. |

## Reglas de seguridad aplicadas

Todas las restricciones críticas se validan en backend. Los usuarios con rol `USER` solo pueden crear y consultar sus propios tickets. Los usuarios `ADMIN` pueden consultar todos los tickets, modificar estados, administrar inventario, ver usuarios y descargar documentos. Esta separación se implementa con middleware de autenticación y middleware de roles sobre cada ruta protegida.
