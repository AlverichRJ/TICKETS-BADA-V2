# Despliegue Ubuntu local - Tickets BADABUN

Este proyecto está diseñado para correr en un servidor local Ubuntu dentro de `/var/www/tickets/`, con DDNS `http://ticketsbd.ddns.net`, Nginx, PM2 y MySQL.

## 1. Base de datos MySQL

```sql
CREATE DATABASE badabun_tickets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tickets_user'@'localhost' IDENTIFIED BY 'CAMBIAR_PASSWORD';
GRANT ALL PRIVILEGES ON badabun_tickets.* TO 'tickets_user'@'localhost';
FLUSH PRIVILEGES;
```

## 2. Variables de entorno

Crear `/var/www/tickets/.env` tomando como base `.env.example`. No subir `.env` a GitHub.

```env
PUBLIC_APP_URL=http://ticketsbd.ddns.net
CORS_ORIGIN=http://ticketsbd.ddns.net
GOOGLE_CALLBACK_URL=http://ticketsbd.ddns.net/api/auth/google/callback
```

El `GOOGLE_CLIENT_SECRET` debe colocarse manualmente en el servidor.

## 3. Instalar, migrar y compilar

```bash
cd /var/www/tickets
pnpm install
pnpm db:migrate
pnpm build
pm2 start ecosystem.config.cjs
pm2 save
```

## 4. Nginx

Copiar `deploy/nginx/ticketsbd.ddns.net.conf` a `/etc/nginx/sites-available/ticketsbd.ddns.net.conf` y enlazarlo en `sites-enabled`.

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Reglas obligatorias

No subir `.env`, no subir compilados, no usar PostgreSQL, no usar Prisma y no introducir dependencias de infraestructura propietaria.
