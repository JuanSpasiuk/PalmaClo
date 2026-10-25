-- Ejecutar antes de la migración de hashes si la columna es menor que VARCHAR(255).
-- Hacer una copia de seguridad de la base antes de aplicar cambios.
ALTER TABLE usuarios MODIFY password VARCHAR(255) NOT NULL;
