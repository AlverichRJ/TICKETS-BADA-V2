-- Promueve el correo administrador inicial para evitar bloqueo de altas y edición tras activar roles persistentes.
UPDATE "User"
SET "role" = 'ADMIN'
WHERE LOWER("email") = 'suarez@badabun.com';
