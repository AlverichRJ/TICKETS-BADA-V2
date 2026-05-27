# Reglas obligatorias - Tickets BADABUN

Este repositorio pertenece a una aplicación independiente de Tickets. No debe mezclarse con Nómina ni con futuros sistemas.

- Usar **MySQL**, no PostgreSQL.
- Usar **Drizzle**, no Prisma.
- Usar **Express + tRPC** en backend.
- Usar **React + Vite + TypeScript** en frontend.
- Desplegar manualmente en Ubuntu local bajo `/var/www/tickets/`.
- Usar Nginx y PM2; no serverless.
- No subir `.env`, secretos, tokens ni `GOOGLE_CLIENT_SECRET`.
- No subir código compilado ni editar `dist/index.js`.
- No usar APIs propietarias ni infraestructura cerrada.
- Mantener Google OAuth con APIs estándar de Google.
