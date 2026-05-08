# Diseño técnico: alta de inventario con responsiva

El modelo `Device` ya cubre los campos solicitados por la tabla del usuario. `equipment` representa el nombre o equipo, `assignedUserId` representa el usuario asignado, `serialNumber` representa el número de serie, `state` representa el estado del equipo, `description` representa la descripción y `loanStatus` representa el estado del préstamo. La responsiva no requiere una columna nueva en `Device`, porque el modelo `File` ya se relaciona con `Device` mediante `deviceId` y tiene el tipo `RESPONSIVA`.

| Campo de la tabla | Campo técnico existente | Observación de implementación |
|---|---|---|
| Nombre | `equipment` | Se mostrará como nombre del equipo en el formulario y en la tabla. |
| Equipo asignado | `assignedUserId` / `assignedUser` | Se poblará con `/api/users`, filtrando usuarios activos y evitando duplicados por email. |
| Número de serie | `serialNumber` | El backend ya lo exige como único. |
| Estado del equipo | `state` | Usa `AVAILABLE`, `ASSIGNED`, `MAINTENANCE` y `RETIRED`. |
| Descripción | `description` | Campo opcional de texto. |
| Estado del préstamo | `loanStatus` | Usa `ACTIVE` y `RETURNED`. |
| Responsiva | `File` con `type = RESPONSIVA` | Se cargará después de crear el equipo con `POST /api/devices/:deviceId/files`. |

El flujo de frontend será de dos pasos para mantener compatibilidad con el backend actual. Primero se enviará JSON a `POST /api/devices` con los campos del dispositivo. Si el administrador adjuntó archivo, se enviará después un `FormData` con `file` y `type=RESPONSIVA` a `POST /api/devices/:deviceId/files`. Finalmente se recargará el listado para que el registro muestre el botón de visualización.

No se requiere migración Prisma en este cambio, porque los campos solicitados y la relación de archivos ya existen en el esquema actual. La visualización de responsiva se realizará con la ruta autenticada `/api/files/:id/download`; al no existir exposición pública de `/uploads`, no se deben usar rutas locales directas de archivos.
