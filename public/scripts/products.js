const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 });

export function categoryForProduct(product) {
  const text = (String(product.nombre || '') + ' ' + String(product.imagen || '')).toLocaleLowerCase('es-AR');
  if (/short|jort|bermuda/.test(text)) return 'shorts';
  if (/camisa|shirt/.test(text)) return 'camisas';
  if (/remera|camiseta|tee/.test(text)) return 'remeras';
  if (/pantal[oó]n|jean|denim|cargo|jogger|pant\b/.test(text)) return 'pantalones';
  if (/campera|abrigo|jacket|buzo|sweater/.test(text)) return 'camperas';
  return 'accesorios';
}

export function categoryLabel(product) {
  const labels = { remeras: 'Remeras', pantalones: 'Pantalones', camperas: 'Capas', shorts: 'Shorts / Jorts', camisas: 'Camisas', accesorios: 'Accesorios' };
  return labels[categoryForProduct(product)];
}

function makeButton(label, className, handler, accessibleLabel) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  if (accessibleLabel) button.setAttribute('aria-label', accessibleLabel);
  if (handler) button.addEventListener('click', handler);
  return button;
}

export function createProductCard(product, options = {}) {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.productId = String(product.id);

  const imageWrap = document.createElement('div');
  imageWrap.className = 'product-image-wrap';
  const image = document.createElement('img');
  image.src = '/assets/images/' + encodeURIComponent(product.imagen);
  image.alt = product.nombre;
  image.loading = 'lazy';
  image.decoding = 'async';
  imageWrap.append(image);

  const stock = Number(product.stock) || 0;
  if (!options.admin && (product.etiqueta || stock <= 3)) {
    const badge = document.createElement('span');
    badge.className = 'product-badge';
    badge.textContent = product.etiqueta || (stock > 0 ? 'Últimas unidades' : 'Agotado');
    imageWrap.append(badge);
  }

  const details = document.createElement('div');
  details.className = 'product-details';
  const category = document.createElement('p');
  category.className = 'product-category';
  category.textContent = categoryLabel(product);
  const title = document.createElement('h3');
  title.textContent = product.nombre;

  const price = document.createElement('p');
  const amount = Number(product.precio);
  price.textContent = Number.isFinite(amount) ? currency.format(amount) : 'Precio a consultar';
  price.className = 'product-price';
  details.append(category, title, price);

  if (product.descripcion) {
    const description = document.createElement('p');
    description.textContent = product.descripcion;
    description.className = 'product-description';
    details.append(description);
  }

  if (options.admin) {
    const actions = document.createElement('div');
    actions.className = 'product-actions';
    const id = String(product.id);
    if (options.archived) {
      actions.append(makeButton('Restaurar producto', 'button button-outline button-small', () => options.onRestore?.(id), 'Restaurar ' + product.nombre));
    } else {
      actions.append(
        makeButton('Editar', 'button button-outline button-small', () => options.onEdit?.(product), 'Editar ' + product.nombre),
        makeButton('Archivar', 'button button-danger button-small', () => options.onDelete?.(id), 'Archivar ' + product.nombre),
      );
    }
    const stockLabel = document.createElement('p');
    const stockValue = Number(product.stock) || 0;
    stockLabel.className = 'product-stock' + (stockValue <= 3 ? ' is-low' : '');
    stockLabel.textContent = stockValue + (stockValue === 1 ? ' unidad disponible' : ' unidades disponibles');
    details.append(stockLabel);
    details.append(actions);
  } else {
    const favorite = makeButton(options.isFavorite?.(product.id) ? '♥' : '♡', 'product-favorite', () => options.onToggleFavorite?.(product), (options.isFavorite?.(product.id) ? 'Quitar de' : 'Agregar a') + ' favoritos: ' + product.nombre);
    favorite.setAttribute('aria-pressed', String(Boolean(options.isFavorite?.(product.id))));
    if (options.isFavorite?.(product.id)) favorite.classList.add('is-favorite');
    imageWrap.append(favorite);

    const quickView = makeButton('Vista rápida  ↗', 'quick-view-button', () => options.onQuickView?.(product), 'Ver detalles de ' + product.nombre);
    imageWrap.append(quickView);

    const addButton = makeButton(stock > 0 ? 'Sumar a la bolsa' : 'Sin stock', 'add-to-bag', () => options.onAddToCart?.(product), 'Sumar ' + product.nombre + ' a la bolsa');
    addButton.disabled = stock <= 0;
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = stock > 0 ? '↗' : '—';
    addButton.append(arrow);
    details.append(addButton);
  }

  card.append(imageWrap, details);
  return card;
}

export function renderProducts(container, items, options = {}) {
  if (!options.append) container.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (const item of items) fragment.append(createProductCard(item, options));
  container.append(fragment);
}
