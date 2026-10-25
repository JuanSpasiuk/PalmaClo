import { categoryForProduct, categoryLabel, renderProducts } from './products.js?v=4';

const $ = (selector) => document.querySelector(selector);
const grid = $('#productsGrid');
const message = $('#catalogMessage');
const resultsCount = $('#resultsCount');
const searchInput = $('#searchInput');
const sortSelect = $('#sortSelect');
const loadMoreButton = $('#loadMoreButton');
const clearFiltersButton = $('#clearFiltersButton');
const favoritesFilter = $('#favoritesFilter');
const cartDialog = $('#cartDialog');
const productDialog = $('#productDialog');
const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 });
const CART_KEY = 'palmaclo.cart.v1';
const FAVORITES_KEY = 'palmaclo.favorites.v1';
let products = [];
let nextCursor = null;
let activeCategory = 'todos';
let showFavorites = false;
let cart = readStorage(CART_KEY, {});
let favorites = new Set(readStorage(FAVORITES_KEY, []));
let toastTimer;
let loading = false;
let currentDetail = null;

function setupTicker() {
  const ticker = $(".ticker");
  const track = $(".ticker-track");
  const template = track?.querySelector('.ticker-sequence')?.cloneNode(true);
  if (!ticker || !track || !template) return;

  const rebuild = () => {
    const firstSet = document.createElement('div');
    firstSet.className = 'ticker-set';
    firstSet.append(template.cloneNode(true));
    track.replaceChildren(firstSet);
    const unitWidth = firstSet.firstElementChild.getBoundingClientRect().width;
    if (!unitWidth) return;
    const copies = Math.ceil(ticker.clientWidth / unitWidth) + 1;
    for (let index = 1; index < copies; index += 1) firstSet.append(template.cloneNode(true));
    track.append(firstSet.cloneNode(true));
    track.classList.add('is-ready');
  };

  rebuild();
  if (window.ResizeObserver) new ResizeObserver(rebuild).observe(ticker);
  if (document.fonts?.ready) document.fonts.ready.then(rebuild);
}

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function persistCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function persistFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
}

function showToast(text) {
  const toast = $('#toast');
  toast.textContent = text;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2300);
}

function filteredProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase('es-AR');
  let items = products.filter((product) => {
    const matchesCategory = activeCategory === 'todos' || categoryForProduct(product) === activeCategory;
    const matchesFavorite = !showFavorites || favorites.has(String(product.id));
    const text = [product.nombre, product.descripcion, categoryLabel(product)].join(' ').toLocaleLowerCase('es-AR');
    return matchesCategory && matchesFavorite && (!query || text.includes(query));
  });
  const sort = sortSelect.value;
  if (sort === 'price-asc') items.sort((a, b) => Number(a.precio) - Number(b.precio));
  else if (sort === 'price-desc') items.sort((a, b) => Number(b.precio) - Number(a.precio));
  else if (sort === 'name') items.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return items;
}

function renderCatalog() {
  const items = filteredProducts();
  renderProducts(grid, items, {
    isFavorite: (id) => favorites.has(String(id)),
    onToggleFavorite: toggleFavorite,
    onQuickView: openProduct,
    onAddToCart: addToCart,
  });
  resultsCount.textContent = products.length
    ? items.length + (items.length === 1 ? ' pieza encontrada' : ' piezas encontradas')
    : '';
  message.textContent = products.length
    ? (items.length ? '' : (showFavorites ? 'Todavía no guardaste favoritos que coincidan con esta selección.' : 'No encontramos productos con esos filtros.'))
    : 'Todavía no hay productos publicados.';
  clearFiltersButton.hidden = !(activeCategory !== 'todos' || showFavorites || searchInput.value.trim());
  loadMoreButton.hidden = !nextCursor;
  favoritesFilter.setAttribute('aria-pressed', String(showFavorites));
  favoritesFilter.classList.toggle('is-active', showFavorites);
}

async function loadProducts({ append = false } = {}) {
  if (loading) return;
  loading = true;
  grid.setAttribute('aria-busy', 'true');
  if (!append) message.textContent = 'Cargando la colección…';
  const params = new URLSearchParams({ limit: '100' });
  if (append && nextCursor) params.set('cursor', nextCursor);
  try {
    const response = await fetch('/api/productos?' + params.toString(), { headers: { Accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'No pudimos cargar la colección.');
    const incoming = Array.isArray(data.items) ? data.items : [];
    products = append ? [...products, ...incoming] : incoming;
    nextCursor = data.nextCursor || null;
    const currentIds = new Set(products.map((product) => String(product.id)));
    for (const id of Object.keys(cart)) if (!currentIds.has(id)) delete cart[id];

    for (const item of products) {
      if (cart[String(item.id)]) cart[String(item.id)].product = item;
    }
    persistCart();
    persistFavorites();
    renderCatalog();
    renderCart();
  } catch (error) {
    message.textContent = error.message || 'No pudimos cargar la colección.';
  } finally {
    loading = false;
    grid.setAttribute('aria-busy', 'false');
  }
}

function toggleFavorite(product) {
  const id = String(product.id);
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  persistFavorites();
  renderCatalog();
}

function addToCart(product, amount = 1) {
  const id = String(product.id);
  const existing = cart[id]?.quantity || 0;
  const available = Math.max(0, Number(product.stock) || 0);
  if (existing >= available) {
    showToast(available ? 'Ya agregaste todas las unidades disponibles.' : 'Esta pieza no tiene stock disponible.');
    return;
  }
  cart[id] = { product, quantity: Math.min(available, existing + amount) };
  persistCart();
  renderCart();
  if (currentDetail && String(currentDetail.id) === id) updateProductDialog(product);
  showToast('Sumamos ' + product.nombre + ' a tu bolsa.');
}

function changeQuantity(id, delta) {
  const entry = cart[id];
  if (!entry) return;
  const available = Math.max(0, Number(entry.product.stock) || 0);
  const next = entry.quantity + delta;
  if (next <= 0) delete cart[id];
  else if (next <= available) entry.quantity = next;
  else showToast('Llegaste al máximo disponible.');
  persistCart();
  renderCart();
  if (currentDetail && String(currentDetail.id) === id) updateProductDialog(entry.product);
}

function renderCart() {
  const itemsNode = $('#cartItems');
  const entries = Object.entries(cart).filter(([, entry]) => entry?.product && entry.quantity > 0);
  itemsNode.replaceChildren();
  $('#cartEmpty').hidden = entries.length > 0;
  let subtotal = 0;
  let totalItems = 0;
  for (const [id, entry] of entries) {
    const product = entry.product;
    const quantity = Number(entry.quantity) || 0;
    subtotal += Number(product.precio) * quantity;
    totalItems += quantity;
    const row = document.createElement('article');
    row.className = 'cart-item';
    const image = document.createElement('img');
    image.src = '/assets/images/' + encodeURIComponent(product.imagen);
    image.alt = product.nombre;
    const info = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = product.nombre;
    const price = document.createElement('p');
    price.className = 'cart-item-price';
    price.textContent = currency.format(Number(product.precio));
    const controls = document.createElement('div');
    controls.className = 'cart-item-controls';
    const decrease = document.createElement('button');
    decrease.type = 'button'; decrease.textContent = '−'; decrease.setAttribute('aria-label', 'Quitar una unidad de ' + product.nombre);
    decrease.addEventListener('click', () => changeQuantity(id, -1));
    const count = document.createElement('span'); count.textContent = String(quantity);
    const increase = document.createElement('button');
    increase.type = 'button'; increase.textContent = '+'; increase.setAttribute('aria-label', 'Agregar una unidad de ' + product.nombre);
    increase.disabled = quantity >= Number(product.stock);
    increase.addEventListener('click', () => changeQuantity(id, 1));
    controls.append(decrease, count, increase);
    info.append(title, price, controls);
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'cart-remove'; remove.textContent = 'Quitar';
    remove.addEventListener('click', () => { delete cart[id]; persistCart(); renderCart(); });
    row.append(image, info, remove);
    itemsNode.append(row);
  }
  $('#cartSubtotal').textContent = currency.format(subtotal || 0);
  const countNode = $('#cartCount');
  countNode.textContent = String(totalItems);
  countNode.setAttribute('aria-label', totalItems + (totalItems === 1 ? ' producto' : ' productos') + ' en la bolsa');
}

function updateProductDialog(product) {
  currentDetail = product;
  $('#dialogProductImage').src = '/assets/images/' + encodeURIComponent(product.imagen);
  $('#dialogProductImage').alt = product.nombre;
  $('#dialogProductCategory').textContent = categoryLabel(product).toUpperCase();
  $('#dialogProductName').textContent = product.nombre;
  $('#dialogProductPrice').textContent = currency.format(Number(product.precio));
  $('#dialogProductDescription').textContent = product.descripcion || 'Una pieza seleccionada para acompañarte todos los días.';
  const stock = Math.max(0, Number(product.stock) || 0);
  const inCart = cart[String(product.id)]?.quantity || 0;
  $('#dialogProductStock').textContent = stock ? (stock - inCart) + (stock - inCart === 1 ? ' unidad disponible' : ' unidades disponibles') : 'Sin stock disponible';
  const button = $('#dialogAddButton');
  button.disabled = stock <= inCart;
  button.firstChild.textContent = stock <= inCart ? 'Sin stock disponible ' : 'Sumar a la bolsa ';
}

function openProduct(product) {
  updateProductDialog(product);
  productDialog.showModal();
}

function setCategory(category) {
  activeCategory = category;
  document.querySelectorAll('.filter-chip[data-category]').forEach((button) => {
    const active = button.dataset.category === category;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderCatalog();
  $('#coleccion').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('.filter-chip[data-category]').forEach((button) => button.addEventListener('click', () => setCategory(button.dataset.category)));
document.querySelectorAll('.category-tile[data-category]').forEach((button) => button.addEventListener('click', () => setCategory(button.dataset.category)));
favoritesFilter.addEventListener('click', () => { showFavorites = !showFavorites; renderCatalog(); });
searchInput.addEventListener('input', renderCatalog);
sortSelect.addEventListener('change', renderCatalog);
const searchForm = $("#searchForm");
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (window.matchMedia("(max-width: 760px)").matches && !searchInput.value.trim()) {
    searchForm.classList.add("is-open");
    searchInput.focus();
    return;
  }
  searchForm.classList.remove("is-open");
  $("#coleccion").scrollIntoView({ behavior: "smooth" });
  renderCatalog();
});
clearFiltersButton.addEventListener('click', () => {
  activeCategory = 'todos'; showFavorites = false; searchInput.value = ''; sortSelect.value = 'featured';
  document.querySelectorAll('.filter-chip[data-category]').forEach((button) => {
    const active = button.dataset.category === 'todos'; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active));
  });
  renderCatalog();
});
loadMoreButton.addEventListener('click', () => loadProducts({ append: true }));
$('#cartButton').addEventListener('click', () => cartDialog.showModal());
$('#closeCartDialog').addEventListener('click', () => cartDialog.close());
$('#continueShopping').addEventListener('click', () => cartDialog.close());
$('#closeProductDialog').addEventListener('click', () => productDialog.close());
$('#dialogAddButton').addEventListener('click', () => { if (currentDetail) addToCart(currentDetail); });
for (const dialog of [cartDialog, productDialog]) dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

const menuToggle = $('#menuToggle');
const siteNav = $('#siteNav');
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!expanded));
  menuToggle.setAttribute('aria-label', expanded ? 'Abrir navegación' : 'Cerrar navegación');
  siteNav.classList.toggle('is-open', !expanded);
});
siteNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menuToggle.setAttribute('aria-expanded', 'false'); siteNav.classList.remove('is-open');
}));

$('#year').textContent = String(new Date().getFullYear());
$('#logoutButton').addEventListener('click', async () => {
  try { await fetch('/api/auth/logout', { method: 'POST' }); }
  finally { window.location.assign('/'); }
});

setupTicker();
try {
  const response = await fetch('/api/auth/me', { headers: { Accept: 'application/json' } });
  if (response.ok) {
    const data = await response.json();
    const isAdmin = data.user?.rol === 'admin';
    $('#adminLink').hidden = !isAdmin;
    $('#accountLink').hidden = true;
    $('#logoutButton').hidden = false;
  }
} catch { /* El catálogo público no depende de una sesión. */ }

renderCart();
loadProducts();



