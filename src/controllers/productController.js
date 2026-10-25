import * as products from '../models/productModel.js';

const IMAGE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}\.(?:jpg|jpeg|png|webp|avif)$/i;
const MAX_UNSIGNED_BIGINT = 18446744073709551615n;

function numericValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) return Number(value);
  return Number.NaN;
}

function readProduct(body) {
  const errors = {};
  const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : '';
  const descripcion = typeof body?.descripcion === 'string' ? body.descripcion.trim() : '';
  const precio = numericValue(body?.precio);
  const stock = numericValue(body?.stock);
  const imagen = typeof body?.imagen === 'string' ? body.imagen.trim() : '';

  if (!nombre || nombre.length > 120) errors.nombre = 'El nombre debe tener entre 1 y 120 caracteres.';
  if (descripcion.length > 1500) errors.descripcion = 'La descripción no puede superar 1500 caracteres.';
  if (!Number.isFinite(precio) || precio < 0 || precio > 99999999.99 || Math.abs(precio * 100 - Math.round(precio * 100)) > 1e-8) errors.precio = 'Ingresa un precio válido con hasta dos decimales.';
  if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) errors.stock = 'Ingresa un stock entero igual o mayor que cero.';
  if (!IMAGE_NAME.test(imagen) || imagen.includes('..')) errors.imagen = 'Usa el nombre de una imagen JPG, PNG, WebP o AVIF existente.';

  if (Object.keys(errors).length) return { errors };
  return { value: { nombre, descripcion: descripcion || null, precio, stock, imagen } };
}

function readProductId(value) {
  if (!/^[1-9]\d{0,19}$/.test(value || '')) return null;
  try {
    return BigInt(value) <= MAX_UNSIGNED_BIGINT ? value : null;
  } catch {
    return null;
  }
}

export async function listProducts(req, res, next) {
  const limitValue = req.query.limit === undefined ? 24 : Number(req.query.limit);
  const cursor = req.query.cursor === undefined ? null : readProductId(String(req.query.cursor));
  if (!Number.isInteger(limitValue) || limitValue < 1 || limitValue > 100 || (req.query.cursor !== undefined && !cursor)) {
    return res.status(400).json({ error: 'La paginación no es válida.' });
  }

  try {
    res.json(await products.listProducts({ limit: limitValue, cursor }));
  } catch (error) {
    next(error);
  }
}

export async function listArchivedProducts(req, res, next) {
  const limitValue = req.query.limit === undefined ? 24 : Number(req.query.limit);
  const cursor = req.query.cursor === undefined ? null : readProductId(String(req.query.cursor));
  if (!Number.isInteger(limitValue) || limitValue < 1 || limitValue > 100 || (req.query.cursor !== undefined && !cursor)) {
    return res.status(400).json({ error: 'La paginación no es válida.' });
  }

  try {
    res.json(await products.listArchivedProducts({ limit: limitValue, cursor }));
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  const parsed = readProduct(req.body || {});
  if (parsed.errors) return res.status(400).json({ error: 'Revisa los campos del producto.', fields: parsed.errors });

  try {
    const id = await products.createProduct(parsed.value);
    res.status(201).json({ item: { id, ...parsed.value } });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  const id = readProductId(req.params.id);
  const parsed = readProduct(req.body || {});
  if (!id) return res.status(400).json({ error: 'El identificador del producto no es válido.' });
  if (parsed.errors) return res.status(400).json({ error: 'Revisa los campos del producto.', fields: parsed.errors });

  try {
    if (!(await products.updateProduct(id, parsed.value))) return res.status(404).json({ error: 'No encontramos ese producto.' });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function archiveProduct(req, res, next) {
  const id = readProductId(req.params.id);
  if (!id) return res.status(400).json({ error: 'El identificador del producto no es válido.' });

  try {
    if (!(await products.archiveProduct(id))) return res.status(404).json({ error: 'No encontramos ese producto.' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function restoreProduct(req, res, next) {
  const id = readProductId(req.params.id);
  if (!id) return res.status(400).json({ error: 'El identificador del producto no es válido.' });

  try {
    if (!(await products.restoreProduct(id))) return res.status(404).json({ error: 'No encontramos ese producto archivado.' });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
