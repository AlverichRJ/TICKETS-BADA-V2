# Tickets BADABUN

Sistema interno independiente para **tickets e inventario** preparado para despliegue manual en Ubuntu local bajo `/var/www/tickets/`.

La reconstrucción usa el stack operativo BADABUN: **React + Vite + TypeScript**, **Express + tRPC**, **Drizzle ORM**, **MySQL**, Google OAuth 2.0, **PM2** y **Nginx**. No usa PostgreSQL, Prisma, APIs propietarias ni servicios serverless.

## Estructura

```text
/var/www/tickets/
├── client/
├── server/
├── drizzle/
├── dist/                 # generado por build si aplica, no editar manualmente
└── ecosystem.config.cjs
```

## Desarrollo local

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm dev
```

## Build de producción

```bash
pnpm install
pnpm db:migrate
pnpm build
pm2 start ecosystem.config.cjs
```

El servidor Node sirve tanto la API como el frontend compilado. Nginx debe apuntar al puerto local `4000`.
