import { pool } from '../config/database.js';

const PRODUCT_FIELDS = 'id, nombre, descripcion, precio, stock, imagen';

export async function listProducts({ limit, cursor }) {
  const values = cursor ? [cursor, limit + 1] : [limit + 1];
  const where = cursor ? 'WHERE activo = 1 AND id < ?' : 'WHERE activo = 1';
  const [rows] = await pool.execute(
    'SELECT ' + PRODUCT_FIELDS + ' FROM productos ' + where + ' ORDER BY id DESC LIMIT ?',
    values,
  );

  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasNextPage ? String(items.at(-1).id) : null };
}

export async function listArchivedProducts({ limit, cursor }) {
  const values = cursor ? [cursor, limit + 1] : [limit + 1];
  const where = cursor ? 'WHERE activo = 0 AND id < ?' : 'WHERE activo = 0';
  const [rows] = await pool.execute(
    'SELECT ' + PRODUCT_FIELDS + ' FROM productos ' + where + ' ORDER BY id DESC LIMIT ?',
    values,
  );
  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasNextPage ? String(items.at(-1).id) : null };
}

export async function createProduct(product) {
  const [result] = await pool.execute(
    'INSERT INTO productos (nombre, descripcion, precio, stock, imagen, activo) VALUES (?, ?, ?, ?, ?, 1)',
    [product.nombre, product.descripcion, product.precio, product.stock, product.imagen],
  );
  return String(result.insertId);
}

export async function updateProduct(id, product) {
  const [result] = await pool.execute(
    'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen = ? WHERE id = ? AND activo = 1',
    [product.nombre, product.descripcion, product.precio, product.stock, product.imagen, id],
  );
  return result.affectedRows > 0;
}

export async function archiveProduct(id) {
  const [result] = await pool.execute(
    'UPDATE productos SET activo = 0 WHERE id = ? AND activo = 1',
    [id],
  );
  return result.affectedRows > 0;
}

export async function restoreProduct(id) {
  const [result] = await pool.execute(
    'UPDATE productos SET activo = 1 WHERE id = ? AND activo = 0',
    [id],
  );
  return result.affectedRows > 0;
}

