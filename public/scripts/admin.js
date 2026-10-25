import { renderProducts } from './products.js?v=4';

const form = document.querySelector('#productForm');
const grid = document.querySelector('#productsGrid');
const message = document.querySelector('#catalogMessage');
const formMessage = document.querySelector('#formMessage');
const editorTitle = document.querySelector('#editorTitle');
const saveButton = document.querySelector('#saveProductButton');
const cancelButton = document.querySelector('#cancelEditButton');
const loadMoreButton = document.querySelector('#loadMoreButton');
const logoutButton = document.querySelector('#logoutButton');
const imageInput = form.elements.imagen;
const imagePreview = document.querySelector('#imagePreviewImg');
const imagePreviewEmpty = document.querySelector('#imagePreviewEmpty');
const inventorySearch = document.querySelector('#inventorySearch');
const productCount = document.querySelector('#productCount');
const stockCount = document.querySelector('#stockCount');
const lowStockCount = document.querySelector('#lowStockCount');
const catalogTitle = document.querySelector('#catalogTitle');
const toggleArchivedButton = document.querySelector('#toggleArchivedButton');
let products = [];
let nextCursor = null;
let loading = false;
let archivedMode = false;

async function readJson(response) {
  return response.json().catch(() => ({}));
}

function renderInventory() {
  const query = inventorySearch.value.trim().toLocaleLowerCase('es-AR');
  const visible = products.filter((product) => {
    const text = [product.nombre, product.descripcion, product.imagen].join(' ').toLocaleLowerCase('es-AR');
    return !query || text.includes(query);
  });
  if (!archivedMode) {
    productCount.textContent = String(products.length);
    stockCount.textContent = String(products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0));
    lowStockCount.textContent = String(products.filter((product) => (Number(product.stock) || 0) <= 3).length);
  }

  if (!products.length) {
    grid.replaceChildren();
    const empty = document.createElement('div');
    empty.className = 'catalog-empty';
    const title = document.createElement('strong');
    title.textContent = archivedMode ? 'No hay productos archivados.' : 'Todavía no hay productos.';
    const copy = document.createElement('span');
    copy.textContent = archivedMode ? 'Los productos que archives aparecerán acá y podrás restaurarlos.' : 'Agregá la primera pieza desde el formulario de arriba.';
    empty.append(title, copy);
    grid.append(empty);
    message.textContent = '';
  } else if (!visible.length) {
    grid.replaceChildren();
    const empty = document.createElement('div');
    empty.className = 'catalog-empty';
    const title = document.createElement('strong');
    title.textContent = 'No encontramos coincidencias.';
    const copy = document.createElement('span');
    copy.textContent = 'Probá con otro nombre o limpiá la búsqueda.';
    empty.append(title, copy);
    grid.append(empty);
    message.textContent = '';
  } else {
    renderProducts(grid, visible, {
      admin: true,
      archived: archivedMode,
      onEdit: beginEdit,
      onDelete: archiveProduct,
      onRestore: restoreArchivedProduct,
    });
    message.textContent = query ? visible.length + (visible.length === 1 ? ' resultado' : ' resultados') : '';
  }
  loadMoreButton.hidden = !nextCursor || Boolean(query);
}

async function loadProducts({ append = false } = {}) {
  if (loading) return;
  loading = true;
  toggleArchivedButton.disabled = true;
  grid.setAttribute('aria-busy', 'true');
  message.textContent = 'Cargando inventario…';
  const params = new URLSearchParams({ limit: '100' });
  if (append && nextCursor) params.set('cursor', nextCursor);

  try {
    const endpoint = archivedMode ? '/api/productos/archived' : '/api/productos';
    const response = await fetch(endpoint + '?' + params.toString(), { headers: { Accept: 'application/json' }, cache: 'no-store' });
    const data = await readJson(response);
    if (response.status === 401) {
      window.location.assign('/login?next=%2Fadmin');
      return;
    }
    if (response.status === 403) {
      products = [];
      grid.replaceChildren();
      message.textContent = 'Esta sección requiere una sesión de administrador.';
      return;
    }
    if (!response.ok) throw new Error(data.error || 'No pudimos cargar el inventario.');
    const incoming = Array.isArray(data.items) ? data.items : [];
    products = append ? [...products, ...incoming] : incoming;
    nextCursor = data.nextCursor || null;
    renderInventory();
  } catch (error) {
    message.textContent = error.message || 'No pudimos cargar el inventario.';
  } finally {
    loading = false;
    toggleArchivedButton.disabled = false;
    grid.setAttribute('aria-busy', 'false');
  }
}

function updateImagePreview() {
  const filename = imageInput.value.trim();
  const valid = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}\.(jpg|jpeg|png|webp|avif)$/i.test(filename) && !filename.includes('..');
  imagePreviewEmpty.hidden = valid;
  imagePreview.hidden = !valid;
  if (valid) imagePreview.src = '/assets/images/' + encodeURIComponent(filename);
  else imagePreview.removeAttribute('src');
}

imagePreview.addEventListener('error', () => {
  imagePreview.hidden = true;
  imagePreviewEmpty.hidden = false;
  imagePreviewEmpty.textContent = 'No encontramos esa imagen';
});
imageInput.addEventListener('input', updateImagePreview);

function beginEdit(product) {
  form.elements.productId.value = product.id;
  form.elements.nombre.value = product.nombre || '';
  form.elements.descripcion.value = product.descripcion || '';
  form.elements.precio.value = product.precio;
  form.elements.stock.value = product.stock;
  imageInput.value = product.imagen || '';
  updateImagePreview();
  editorTitle.textContent = 'Editar producto';
  saveButton.innerHTML = 'Guardar cambios <span aria-hidden="true">↗</span>';
  cancelButton.hidden = false;
  formMessage.textContent = '';
  form.elements.nombre.focus();
}

function resetEditor() {
  form.reset();
  form.elements.productId.value = '';
  editorTitle.textContent = 'Agregar un producto';
  saveButton.innerHTML = 'Guardar producto <span aria-hidden="true">↗</span>';
  cancelButton.hidden = true;
  formMessage.textContent = '';
  imagePreview.removeAttribute('src');
  imagePreview.hidden = true;
  imagePreviewEmpty.hidden = false;
  imagePreviewEmpty.textContent = 'Vista previa';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  saveButton.disabled = true;
  formMessage.textContent = '';

  const id = form.elements.productId.value;
  const payload = {
    nombre: form.elements.nombre.value,
    descripcion: form.elements.descripcion.value,
    precio: form.elements.precio.value,
    stock: form.elements.stock.value,
    imagen: imageInput.value,
  };

  try {
    const response = await fetch(id ? '/api/productos/' + encodeURIComponent(id) : '/api/productos', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.error || 'No pudimos guardar el producto.');

    resetEditor();
    await loadProducts();
    formMessage.textContent = id ? 'Producto actualizado.' : 'Producto creado.';
  } catch (error) {
    formMessage.textContent = error.message || 'No pudimos guardar el producto.';
  } finally {
    saveButton.disabled = false;
  }
});

async function restoreArchivedProduct(id) {
  const product = products.find((item) => String(item.id) === String(id));
  if (!window.confirm('¿Restaurar ' + (product?.nombre || 'este producto') + '? Volverá a aparecer en la tienda.')) return;
  try {
    const response = await fetch('/api/productos/' + encodeURIComponent(id) + '/restore', { method: 'PATCH' });
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.error || 'No pudimos restaurar el producto.');
    await loadProducts();
    message.textContent = 'Producto restaurado y visible nuevamente en la tienda.';
  } catch (error) {
    message.textContent = error.message || 'No pudimos restaurar el producto.';
  }
}

async function archiveProduct(id) {
  const product = products.find((item) => String(item.id) === String(id));
  if (!window.confirm('¿Archivar ' + (product?.nombre || 'este producto') + '? Dejará de aparecer en la tienda.')) return;
  try {
    const response = await fetch('/api/productos/' + encodeURIComponent(id), { method: 'DELETE' });
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.error || 'No pudimos archivar el producto.');
    await loadProducts();
    message.textContent = 'Producto archivado.';
  } catch (error) {
    message.textContent = error.message || 'No pudimos archivar el producto.';
  }
}

inventorySearch.addEventListener('input', renderInventory);
toggleArchivedButton.addEventListener('click', async () => {
  archivedMode = !archivedMode;
  catalogTitle.textContent = archivedMode ? 'Productos archivados' : 'Productos publicados';
  toggleArchivedButton.textContent = archivedMode ? 'Ver publicados' : 'Ver archivados';
  inventorySearch.value = '';
  products = [];
  nextCursor = null;
  grid.replaceChildren();
  await loadProducts();
});
cancelButton.addEventListener('click', resetEditor);
loadMoreButton.addEventListener('click', () => loadProducts({ append: true }));
logoutButton.addEventListener('click', async () => {
  logoutButton.disabled = true;
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } finally {
    window.location.assign('/login');
  }
});

imagePreview.hidden = true;
loadProducts();


