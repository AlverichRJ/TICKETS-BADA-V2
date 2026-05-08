# Guía de despliegue manual en Ubuntu

Esta guía prepara el sistema para ejecución local con acceso por DDNS, Nginx como proxy reverso, PostgreSQL como base de datos y Node.js como runtime. La aplicación está diseñada para ejecutarse como servicio tradicional, **no serverless**, y no requiere APIs propietarias.

## Supuestos de infraestructura

| Elemento | Valor recomendado |
|---|---|
| Sistema operativo | Ubuntu Server 22.04 LTS o superior |
| Runtime | Node.js 20 o superior |
| Base de datos | PostgreSQL 16 o una versión soportada por Prisma |
| Proxy | Nginx |
| Dominio | DDNS ya apuntando al servidor |
| SSL | Let's Encrypt mediante Certbot |

## Instalación de paquetes base

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib git curl ufw
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## Preparar PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE tickets_inventory;
CREATE USER tickets_user WITH ENCRYPTED PASSWORD 'CAMBIA_ESTA_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE tickets_inventory TO tickets_user;
\q
```

Ajusta `DATABASE_URL` en `.env` con el usuario, contraseña y base reales.

## Instalar aplicación

```bash
sudo mkdir -p /opt/sistema-tickets-inventario
sudo chown -R $USER:$USER /opt/sistema-tickets-inventario
git clone TU_REPOSITORIO_GITHUB /opt/sistema-tickets-inventario
cd /opt/sistema-tickets-inventario
npm ci
cp .env.example .env
nano .env
npm run prisma:generate
npm run prisma:migrate -w apps/server
npm run seed -w apps/server
npm run build
```

## Preparar archivos locales

```bash
sudo mkdir -p /var/lib/sistema-tickets-inventario/uploads
sudo chown -R www-data:www-data /var/lib/sistema-tickets-inventario
```

En `.env`, usa:

```txt
UPLOAD_DIR=/var/lib/sistema-tickets-inventario/uploads
```

## Frontend estático

```bash
sudo mkdir -p /var/www/sistema-tickets-inventario/client
sudo rsync -av --delete apps/client/dist/ /var/www/sistema-tickets-inventario/client/
sudo chown -R www-data:www-data /var/www/sistema-tickets-inventario
```

## Servicio systemd

```bash
sudo cp deploy/systemd/sistema-tickets-api.service /etc/systemd/system/sistema-tickets-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now sistema-tickets-api
sudo systemctl status sistema-tickets-api
```

Si el servicio falla, revisa logs con:

```bash
journalctl -u sistema-tickets-api -f
```

## Nginx

Edita `deploy/nginx/sistema-tickets-inventario.conf` y reemplaza `tu-ddns.example.com` por tu DDNS real. Después:

```bash
sudo cp deploy/nginx/sistema-tickets-inventario.conf /etc/nginx/sites-available/sistema-tickets-inventario.conf
sudo ln -s /etc/nginx/sites-available/sistema-tickets-inventario.conf /etc/nginx/sites-enabled/sistema-tickets-inventario.conf
sudo nginx -t
sudo systemctl reload nginx
```

## SSL con Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-ddns.example.com
```

## Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## Checklist antes de producción

| Revisión | Estado esperado |
|---|---|
| `JWT_SECRET` | Cadena aleatoria larga, no incluida en GitHub. |
| `CORS_ORIGIN` | Dominio real del frontend. |
| `GOOGLE_CALLBACK_URL` | URL pública con `/api/auth/google/callback`. |
| PostgreSQL | No expuesto públicamente salvo necesidad explícita. |
| `UPLOAD_DIR` | Fuera del repositorio, con permisos de `www-data`. |
| Nginx | `nginx -t` sin errores. |
| Servicio API | `systemctl status sistema-tickets-api` activo. |
