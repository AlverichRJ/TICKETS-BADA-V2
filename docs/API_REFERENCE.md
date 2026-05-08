# Referencia de API REST

La API expone rutas bajo `/api` y utiliza una cookie httpOnly firmada con JWT después de completar Google OAuth. Las validaciones de rol se aplican siempre en backend.

## Autenticación

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/auth/google` | Público | Inicia flujo Google OAuth 2.0. |
| GET | `/api/auth/google/callback` | Público | Callback de Google, crea cookie de sesión y redirige al frontend. |
| GET | `/api/auth/me` | Autenticado | Devuelve usuario actual. |
| POST | `/api/auth/logout` | Autenticado | Elimina cookie de sesión. |

## Tickets

| Método | Ruta | Rol | Regla |
|---|---|---|---|
| GET | `/api/tickets` | ADMIN, USER | ADMIN ve todos; USER solo sus tickets. |
| POST | `/api/tickets` | ADMIN, USER | Crea ticket con folio `TK-001`, `TK-002`, etc. |
| GET | `/api/tickets/:id` | ADMIN, USER | USER no puede ver tickets ajenos. |
| PATCH | `/api/tickets/:id` | ADMIN | Edita datos, prioridad, líder, estado y notas técnicas. |

### Crear ticket

```json
{
  "deviceId": "opcional",
  "leaderId": "opcional",
  "failureDescription": "La pantalla del equipo parpadea al encender y se apaga después de 30 segundos.",
  "deviceSpecs": "Lenovo ThinkPad, 16 GB RAM, serie SN-001",
  "priority": "HIGH"
}
```

## Inventario

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/devices` | ADMIN | Lista todos los equipos. |
| POST | `/api/devices` | ADMIN | Registra equipo. |
| PATCH | `/api/devices/:id` | ADMIN | Actualiza asignación, estado y descripción. |
| POST | `/api/devices/:deviceId/files` | ADMIN | Sube PDF, JPG o PNG asociado al equipo. |

### Crear equipo

```json
{
  "assignedUserId": "opcional",
  "equipment": "MacBook Pro 14",
  "serialNumber": "C02XXXXXXX",
  "state": "ASSIGNED",
  "description": "Equipo asignado a diseño.",
  "loanStatus": "ACTIVE"
}
```

## Archivos

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/files/:id/download` | ADMIN | Descarga documento almacenado localmente. |

La subida de archivos usa `multipart/form-data` con campo `file`. El campo `type` acepta `RESPONSIVA`, `INE` u `OTHER`.

## Usuarios

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/users` | ADMIN | Lista usuarios registrados por OAuth. |

## Códigos de error esperados

| Código | Significado |
|---|---|
| 400 | Datos inválidos o archivo no permitido. |
| 401 | Sesión requerida o inválida. |
| 403 | Usuario sin permisos para la acción. |
| 404 | Recurso no encontrado. |
| 500 | Error interno no controlado. |
