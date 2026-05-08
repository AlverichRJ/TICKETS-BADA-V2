# Sistema interno de tickets e inventario

Sistema web empresarial para reemplazar procesos gestionados en hojas de cálculo por una aplicación local con **tickets**, **inventario**, **archivos adjuntos**, **Google OAuth 2.0** y **control de acceso por roles**. Está diseñado para ejecutarse en un servidor Ubuntu local con DDNS, Nginx y PostgreSQL, sin APIs propietarias ni dependencia serverless.

## Stack

| Componente | Tecnología |
|---|---|
| Backend | Node.js, Express, TypeScript |
| Frontend | React, Vite, TypeScript |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Archivos | Multer + almacenamiento local |
| Autenticación | Google OAuth 2.0 + JWT en cookie httpOnly |
| Proxy | Nginx |

## Estructura

```txt
sistema-tickets-inventario/
├── apps/
│   ├── server/              # API Express, Prisma, OAuth, Multer
│   └── client/              # React + Vite
├── deploy/
│   ├── nginx/               # Configuración de proxy reverso
│   └── systemd/             # Servicio systemd para API
├── docs/                    # Arquitectura y notas técnicas
├── docker-compose.yml       # PostgreSQL local opcional
├── .env.example             # Variables de entorno requeridas
└── README.md
```

## Instalación local para desarrollo

Primero instala dependencias desde la raíz del proyecto.

```bash
npm install
cp .env.example .env
cp apps/client/.env.example apps/client/.env
```

Levanta PostgreSQL local con Docker o usa una instalación existente.

```bash
docker compose up -d postgres
npm run prisma:generate
npm run prisma:migrate -w apps/server
npm run seed -w apps/server
npm run dev
```

El frontend queda en `http://localhost:5173` y la API en `http://localhost:4000`.

## Google OAuth

Crea credenciales OAuth 2.0 en Google Cloud Console y configura el callback autorizado:

```txt
http://localhost:4000/api/auth/google/callback
https://tu-ddns.example.com/api/auth/google/callback
```

Después actualiza `.env` con `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_CALLBACK_URL`.

## Roles y permisos

| Rol | Permisos |
|---|---|
| ADMIN | Ve todos los tickets, edita tickets, cambia estados, administra inventario, sube/descarga archivos y consulta usuarios. |
| USER | Crea tickets y consulta únicamente sus propios tickets. No puede acceder a inventario ni a tickets de terceros. |

Los correos listados en `ADMIN_EMAILS` se promueven automáticamente a `ADMIN` al iniciar sesión con Google.

## Despliegue manual en Ubuntu

Compila el proyecto y copia los artefactos al servidor.

```bash
npm run build
sudo mkdir -p /opt/sistema-tickets-inventario /var/www/sistema-tickets-inventario/client
sudo cp -r apps package.json package-lock.json .env /opt/sistema-tickets-inventario/
sudo cp -r apps/client/dist/* /var/www/sistema-tickets-inventario/client/
sudo cp deploy/systemd/sistema-tickets-api.service /etc/systemd/system/
sudo cp deploy/nginx/sistema-tickets-inventario.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/sistema-tickets-inventario.conf /etc/nginx/sites-enabled/
sudo systemctl daemon-reload
sudo systemctl enable --now sistema-tickets-api
sudo nginx -t && sudo systemctl reload nginx
```

Para SSL con Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-ddns.example.com
```

## Archivos locales

Los documentos se guardan en la ruta definida por `UPLOAD_DIR`. En producción se recomienda usar una carpeta fuera del código, por ejemplo `/var/lib/sistema-tickets-inventario/uploads`, con permisos restringidos al usuario del servicio.

## Notas de producción

Antes de exponer el sistema por DDNS, reemplaza `JWT_SECRET` por una cadena aleatoria larga, configura `CORS_ORIGIN` con el dominio real, revisa `client_max_body_size` en Nginx y valida que PostgreSQL no esté expuesto públicamente si no es necesario.
