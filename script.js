(function () {
  const config = window.JAZMIN_CONFIG;
  const db = window.JAZMIN_DB;

  if (!config || !db) {
    return;
  }

  const state = {
    page: document.body.dataset.page || "home",
    store: db.getStore(),
    cart: loadCart(),
    catalogFilter: "all",
  };

  const refs = {};
  const colorMap = {
    Blanco: "#f5f2ee",
    Beige: "#ddc7b7",
    Crema: "#efe2d4",
    Arena: "#ccb69f",
    "Rosa viejo": "#c79494",
    "Blanco roto": "#ebe5de",
    "Verde agua": "#a8c5bb",
    "Verde seco": "#87907a",
    "Amarillo pastel": "#ecd79f",
    "Gris claro": "#cfd2d2",
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheRefs();
    bindCommonEvents();
    setStaticLinks();
    syncCartWithStore();
    renderCurrentPage();
    renderOrderDrawer();

    db.subscribe((nextStore) => {
      state.store = nextStore;
      syncCartWithStore();
      renderCurrentPage();
      renderOrderDrawer();
    });
  }

  function cacheRefs() {
    refs.menuToggle = document.getElementById("menu-toggle");
    refs.mainNav = document.getElementById("main-nav");
    refs.orderFab = document.getElementById("order-fab");
    refs.orderCount = document.getElementById("order-count");
    refs.orderOverlay = document.getElementById("order-overlay");
    refs.orderDrawer = document.getElementById("order-drawer");
    refs.closeOrder = document.getElementById("close-order");
    refs.orderItems = document.getElementById("order-items");
    refs.orderTotal = document.getElementById("order-total");
    refs.clearCart = document.getElementById("clear-cart");
    refs.customerForm = document.getElementById("customer-form");
    refs.heroStats = document.getElementById("hero-stats");
    refs.homeCategoryGrid = document.getElementById("home-category-grid");
    refs.featuredGrid = document.getElementById("featured-grid");
    refs.catalogFilters = document.getElementById("catalog-filters");
    refs.catalogGrid = document.getElementById("catalog-grid");
    refs.catalogCount = document.getElementById("catalog-count");
    refs.productDetailPage = document.getElementById("product-detail-page");
    refs.relatedGrid = document.getElementById("related-grid");
    refs.aboutFeaturedGrid = document.getElementById("about-featured-grid");
  }

  function bindCommonEvents() {
    refs.menuToggle?.addEventListener("click", toggleNav);

    document.querySelectorAll("[data-open-order]").forEach((button) => {
      button.addEventListener("click", openOrderDrawer);
    });

    refs.closeOrder?.addEventListener("click", closeOrderDrawer);
    refs.orderOverlay?.addEventListener("click", closeOrderDrawer);
    refs.clearCart?.addEventListener("click", clearCart);
    refs.customerForm?.addEventListener("submit", finalizeOrder);
    refs.orderItems?.addEventListener("click", handleOrderActionClick);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeOrderDrawer();
      }
    });

    refs.mainNav?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        document.body.classList.remove("nav-open");
        refs.menuToggle?.setAttribute("aria-expanded", "false");
      });
    });
  }

  function setStaticLinks() {
    const wholesaleUrl = createWhatsAppUrl(
      "Hola Jazmin Macetas, quiero consultar por venta por mayor, modelos disponibles y precios por volumen."
    );
    document.getElementById("wholesale-link")?.setAttribute("href", wholesaleUrl);
    document.getElementById("about-wholesale-link")?.setAttribute("href", wholesaleUrl);
  }

  function renderCurrentPage() {
    if (state.page === "home") {
      renderHomePage();
      return;
    }
    if (state.page === "catalog") {
      renderCatalogPage();
      return;
    }
    if (state.page === "product") {
      renderProductPage();
      return;
    }
    if (state.page === "about") {
      renderAboutPage();
    }
  }

  function renderHomePage() {
    renderHeroStats();
    renderHomeCategories();
    renderProductCollection(refs.featuredGrid, getFeaturedProducts().slice(0, 4));
  }

  function renderCatalogPage() {
    const queryCategory = new URLSearchParams(window.location.search).get("categoria");
    const categoryExists = state.store.categories.some((category) => category.id === queryCategory);
    state.catalogFilter = categoryExists ? queryCategory : "all";
    renderCatalogFilters();
    const products = getFilteredCatalogProducts();
    if (refs.catalogCount) {
      refs.catalogCount.textContent =
        products.length === 1 ? "1 producto visible" : `${products.length} productos visibles`;
    }
    renderProductCollection(refs.catalogGrid, products, { showCategory: true });
  }

  function renderProductPage() {
    if (!refs.productDetailPage) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    const id = params.get("id");
    const product = getPublicProducts().find((item) => item.slug === slug || item.id === id);

    if (!product) {
      refs.productDetailPage.innerHTML = `
        <article class="not-found-card">
          <p class="eyebrow">Producto no encontrado</p>
          <h3>Esta pieza ya no esta disponible o la URL es invalida.</h3>
          <a class="primary-button" href="productos.html">Volver al catalogo</a>
        </article>
      `;
      refs.relatedGrid && (refs.relatedGrid.innerHTML = "");
      return;
    }

    document.title = `${product.name} | Jazmin Macetas`;
    refs.productDetailPage.innerHTML = renderProductDetail(product);
    bindProductDetailEvents(product);

    const related = getPublicProducts()
      .filter((item) => item.categoryId === product.categoryId && item.id !== product.id)
      .slice(0, 3);
    renderProductCollection(refs.relatedGrid, related, { showCategory: true });
  }

  function renderAboutPage() {
    renderProductCollection(refs.aboutFeaturedGrid, getFeaturedProducts().slice(0, 4));
  }

  function renderHeroStats() {
    if (!refs.heroStats) {
      return;
    }
    const visibleProducts = getPublicProducts();
    const available = visibleProducts.filter((product) => product.status === "available");
    refs.heroStats.innerHTML = [
      renderStat("Piezas", visibleProducts.length),
      renderStat("Disponibles", available.length),
      renderStat("Categorias", state.store.categories.length),
    ].join("");
  }

  function renderHomeCategories() {
    if (!refs.homeCategoryGrid) {
      return;
    }
    refs.homeCategoryGrid.innerHTML = state.store.categories
      .map(
        (category) => `
          <a class="category-card" href="${createCategoryUrl(category.id)}">
            <img src="${escapeAttribute(category.image || "img/placeholder.svg")}" alt="${escapeAttribute(category.name)}">
            <div class="category-card-content">
              <h3>${escapeHtml(category.name)}</h3>
              <p>${escapeHtml(category.description)}</p>
              <span class="text-link">Ver productos</span>
            </div>
          </a>
        `
      )
      .join("");
  }

  function renderCatalogFilters() {
    if (!refs.catalogFilters) {
      return;
    }
    const chips = [{ id: "all", name: "Todo el catalogo" }].concat(
      state.store.categories.map((category) => ({ id: category.id, name: category.name }))
    );
    refs.catalogFilters.innerHTML = chips
      .map(
        (chip) => `
          <button
            class="filter-chip ${chip.id === state.catalogFilter ? "active" : ""}"
            type="button"
            data-filter-chip="${escapeAttribute(chip.id)}"
          >
            ${escapeHtml(chip.name)}
          </button>
        `
      )
      .join("");

    refs.catalogFilters.querySelectorAll("[data-filter-chip]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextFilter = button.dataset.filterChip;
        state.catalogFilter = nextFilter;
        const url = new URL(window.location.href);
        if (nextFilter === "all") {
          url.searchParams.delete("categoria");
        } else {
          url.searchParams.set("categoria", nextFilter);
        }
        window.history.replaceState({}, "", url);
        renderCatalogPage();
      });
    });
  }

  function renderProductCollection(container, products, options = {}) {
    if (!container) {
      return;
    }

    if (!products.length) {
      container.innerHTML = `
        <article class="empty-state">
          <p class="eyebrow">Sin resultados</p>
          <h3>No hay productos visibles para esta seleccion.</h3>
        </article>
      `;
      return;
    }

    container.innerHTML = products.map((product) => renderProductCard(product, options)).join("");
    container.querySelectorAll("[data-add-product]").forEach((button) => {
      button.addEventListener("click", () => addDefaultProductToCart(button.dataset.addProduct));
    });
  }

  function renderProductCard(product, options = {}) {
    const category = getCategoryById(product.categoryId);
    const tag = product.tags[0];
    const disabled = product.status !== "available";
    const swatches = product.colors
      .slice(0, 5)
      .map(
        (color) =>
          `<span class="swatch" title="${escapeAttribute(color)}" style="background:${escapeAttribute(getColorHex(color))};"></span>`
      )
      .join("");

    return `
      <article class="product-preview-card">
        <a class="product-preview-link" href="${createProductUrl(product)}">
          <img
            class="product-preview-image"
            src="${escapeAttribute(product.image || "img/placeholder.svg")}"
            alt="${escapeAttribute(product.name)}"
          >
        </a>
        <div class="product-preview-body">
          <div class="product-topline">
            <p class="eyebrow">${escapeHtml(category?.name || "Categoria")}</p>
            ${tag ? `<span class="tag">${escapeHtml(tag)}</span>` : ""}
          </div>
          <a class="product-title-link" href="${createProductUrl(product)}">${escapeHtml(product.name)}</a>
          <p class="product-meta">${escapeHtml(product.shortDescription || product.description)}</p>
          <div class="product-meta">
            <strong class="product-preview-price">${formatCurrency(product.price)}</strong>
            <div class="swatches">${swatches}</div>
          </div>
          <div class="product-actions">
            <a class="ghost-button" href="${createProductUrl(product)}">Ver producto</a>
            <button
              class="primary-button"
              type="button"
              data-add-product="${escapeAttribute(product.id)}"
              ${disabled ? "disabled" : ""}
            >
              ${disabled ? "Sin stock" : "Agregar al pedido"}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderProductDetail(product) {
    const category = getCategoryById(product.categoryId);
    const tag = product.tags[0];
    const details = [
      ["Material", product.material],
      ["Terminacion", product.finish],
      ["Estilo", product.style],
      ["Uso", product.use],
      ["Personalizacion", product.personalization],
      ["Ideal para", product.idealFor],
    ];

    return `
      <div class="product-detail-layout">
        <div class="product-gallery-panel">
          <img
            class="product-main-image"
            id="product-main-image"
            src="${escapeAttribute(product.gallery[0] || product.image)}"
            alt="${escapeAttribute(product.name)}"
          >
          <div class="thumbnail-row" id="thumbnail-row">
            ${product.gallery
              .map(
                (image, index) => `
                  <button
                    class="thumbnail-button ${index === 0 ? "active" : ""}"
                    type="button"
                    data-gallery-image="${escapeAttribute(image)}"
                  >
                    <img src="${escapeAttribute(image)}" alt="${escapeAttribute(product.name)} vista ${index + 1}">
                  </button>
                `
              )
              .join("")}
          </div>
        </div>

        <div class="product-detail-copy">
          <div class="product-topline">
            <p class="eyebrow">${escapeHtml(category?.name || "Categoria")}</p>
            ${tag ? `<span class="tag">${escapeHtml(tag)}</span>` : ""}
          </div>
          <h2>${escapeHtml(product.name)}</h2>
          <strong class="product-preview-price">${formatCurrency(product.price)}</strong>
          <p class="product-short">${escapeHtml(product.shortDescription)}</p>
          <p class="product-long">${escapeHtml(product.fullDescription)}</p>

          <div class="product-options product-option-grid">
            <label>
              Color
              <select id="detail-color">
                ${renderOptions(product.colors, "Sin definir")}
              </select>
            </label>
            <label>
              Tamano
              <select id="detail-size">
                ${renderOptions(product.sizes, "Unico")}
              </select>
            </label>
            <label>
              Cantidad
              <input id="detail-quantity" type="number" min="1" max="99" value="1">
            </label>
          </div>

          <div class="detail-action-row">
            <button
              class="primary-button"
              type="button"
              id="detail-add-to-cart"
              ${product.status !== "available" ? "disabled" : ""}
            >
              ${product.status === "available" ? "Agregar al pedido" : "Sin stock"}
            </button>
            <a
              class="secondary-button"
              href="${createWhatsAppUrl(`Hola Jazmin Macetas, quiero consultar por ${product.name}.`)}"
              target="_blank"
              rel="noreferrer"
            >
              Consultar por WhatsApp
            </a>
            <a class="ghost-button" href="productos.html">Volver al catalogo</a>
          </div>

          <div class="info-card-grid">
            ${details
              .map(
                ([label, value]) => `
                  <article class="info-card">
                    <h4>${escapeHtml(label)}</h4>
                    <p>${escapeHtml(value)}</p>
                  </article>
                `
              )
              .join("")}
          </div>

          <div class="care-panel">
            <h3>Cuidados</h3>
            <ul class="care-list">
              ${product.care.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  function bindProductDetailEvents(product) {
    const mainImage = document.getElementById("product-main-image");
    const thumbnailRow = document.getElementById("thumbnail-row");
    const addButton = document.getElementById("detail-add-to-cart");

    thumbnailRow?.querySelectorAll("[data-gallery-image]").forEach((button) => {
      button.addEventListener("click", () => {
        const image = button.dataset.galleryImage;
        if (mainImage && image) {
          mainImage.src = image;
        }
        thumbnailRow.querySelectorAll("[data-gallery-image]").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
      });
    });

    addButton?.addEventListener("click", () => {
      const color = document.getElementById("detail-color")?.value || "Sin definir";
      const size = document.getElementById("detail-size")?.value || "Unico";
      const quantity = clamp(Number(document.getElementById("detail-quantity")?.value || 1), 1, 99);
      addToCart(product.id, { color, size, quantity });
    });
  }

  function addDefaultProductToCart(productId) {
    const product = getPublicProducts().find((item) => item.id === productId);
    if (!product) {
      return;
    }
    addToCart(product.id, {
      color: product.colors[0] || "Sin definir",
      size: product.sizes[0] || "Unico",
      quantity: 1,
    });
  }

  function addToCart(productId, options) {
    const product = getPublicProducts().find((item) => item.id === productId);
    if (!product || product.status !== "available") {
      return;
    }

    const color = options.color || "Sin definir";
    const size = options.size || "Unico";
    const quantity = clamp(Number(options.quantity || 1), 1, 99);
    const key = `${productId}__${color}__${size}`;
    const existing = state.cart.find((item) => item.key === key);

    if (existing) {
      existing.quantity += quantity;
    } else {
      state.cart.push({ key, productId, color, size, quantity });
    }

    persistCart();
    renderOrderDrawer();
    openOrderDrawer();
  }

  function renderOrderDrawer() {
    if (!refs.orderItems || !refs.orderTotal || !refs.orderCount) {
      return;
    }

    syncCartWithStore();
    refs.orderCount.textContent = String(getCartCount());
    refs.orderFab?.classList.toggle("has-items", getCartCount() > 0);

    if (!state.cart.length) {
      refs.orderItems.innerHTML = `
        <div class="order-empty">
          <h4>Tu pedido esta vacio</h4>
          <p>Agrega productos desde el catalogo o desde la ficha individual para preparar el mensaje.</p>
        </div>
      `;
      refs.orderTotal.textContent = formatCurrency(0);
      return;
    }

    refs.orderItems.innerHTML = state.cart.map(renderOrderItem).join("");
    refs.orderTotal.textContent = formatCurrency(getCartTotal());
  }

  function renderOrderItem(item) {
    const product = getPublicProducts().find((entry) => entry.id === item.productId);
    if (!product) {
      return "";
    }
    const subtotal = product.price * item.quantity;
    return `
      <article class="order-item">
        <h4>${escapeHtml(product.name)}</h4>
        <p>Color: ${escapeHtml(item.color)} · Tamano: ${escapeHtml(item.size)}</p>
        <p>Unitario: ${formatCurrency(product.price)} · Subtotal: ${formatCurrency(subtotal)}</p>
        <footer>
          <div class="quantity-controls">
            <button type="button" data-cart-action="decrease" data-cart-key="${escapeAttribute(item.key)}">-</button>
            <span class="quantity-value">${item.quantity}</span>
            <button type="button" data-cart-action="increase" data-cart-key="${escapeAttribute(item.key)}">+</button>
          </div>
          <button class="tiny-button" type="button" data-cart-action="remove" data-cart-key="${escapeAttribute(item.key)}">
            Eliminar
          </button>
        </footer>
      </article>
    `;
  }

  function handleOrderActionClick(event) {
    const button = event.target.closest("[data-cart-action]");
    if (!button) {
      return;
    }
    const action = button.dataset.cartAction;
    const key = button.dataset.cartKey;
    const item = state.cart.find((entry) => entry.key === key);
    if (!item) {
      return;
    }

    if (action === "increase") {
      item.quantity += 1;
    }
    if (action === "decrease") {
      item.quantity -= 1;
    }
    if (action === "remove" || item.quantity <= 0) {
      state.cart = state.cart.filter((entry) => entry.key !== key);
    }

    persistCart();
    renderOrderDrawer();
  }

  function clearCart() {
    state.cart = [];
    persistCart();
    renderOrderDrawer();
  }

  function finalizeOrder(event) {
    event.preventDefault();
    syncCartWithStore();

    if (!state.cart.length) {
      alert("Agrega al menos un producto antes de finalizar el pedido.");
      return;
    }

    const name = document.getElementById("customer-name")?.value.trim();
    const location = document.getElementById("customer-location")?.value.trim();
    const payment = document.getElementById("customer-payment")?.value.trim();
    const comments = document.getElementById("customer-comments")?.value.trim();

    if (!name || !location || !payment) {
      alert("Completa nombre, localidad y forma de pago antes de continuar.");
      return;
    }

    const lines = [
      "Hola Jazmin Macetas, quiero hacer este pedido:",
      "",
      ...state.cart.flatMap((item, index) => {
        const product = getPublicProducts().find((entry) => entry.id === item.productId);
        if (!product) {
          return [];
        }
        return [
          `Producto ${index + 1}:`,
          `- Modelo: ${product.name}`,
          `- Color: ${item.color}`,
          `- Tamano: ${item.size}`,
          `- Cantidad: ${item.quantity}`,
          `- Precio: ${formatCurrency(product.price * item.quantity)}`,
          "",
        ];
      }),
      `Total: ${formatCurrency(getCartTotal())}`,
      "",
      "Datos del cliente:",
      `- Nombre: ${name}`,
      `- Localidad: ${location}`,
      `- Pago: ${payment}`,
      `- Comentarios: ${comments || "Sin comentarios"}`,
      "",
      "Gracias.",
    ];

    window.open(createWhatsAppUrl(lines.join("\n")), "_blank", "noopener,noreferrer");
  }

  function toggleNav() {
    const isOpen = document.body.classList.toggle("nav-open");
    refs.menuToggle?.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  function openOrderDrawer() {
    refs.orderDrawer?.classList.add("open");
    refs.orderDrawer?.setAttribute("aria-hidden", "false");
    refs.orderOverlay?.classList.remove("hidden");
  }

  function closeOrderDrawer() {
    refs.orderDrawer?.classList.remove("open");
    refs.orderDrawer?.setAttribute("aria-hidden", "true");
    refs.orderOverlay?.classList.add("hidden");
  }

  function getPublicProducts() {
    return state.store.products.filter((product) => product.active);
  }

  function getFeaturedProducts() {
    return getPublicProducts().filter((product) => product.featured);
  }

  function getFilteredCatalogProducts() {
    const products = getPublicProducts();
    if (state.catalogFilter === "all") {
      return products;
    }
    return products.filter((product) => product.categoryId === state.catalogFilter);
  }

  function getCategoryById(categoryId) {
    return state.store.categories.find((category) => category.id === categoryId);
  }

  function syncCartWithStore() {
    const validProducts = new Set(
      getPublicProducts().filter((product) => product.status === "available").map((product) => product.id)
    );
    state.cart = state.cart.filter((item) => validProducts.has(item.productId));
    persistCart();
  }

  function getCartTotal() {
    return state.cart.reduce((total, item) => {
      const product = getPublicProducts().find((entry) => entry.id === item.productId);
      return product ? total + product.price * item.quantity : total;
    }, 0);
  }

  function getCartCount() {
    return state.cart.reduce((count, item) => count + item.quantity, 0);
  }

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(config.CART_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function persistCart() {
    localStorage.setItem(config.CART_KEY, JSON.stringify(state.cart));
  }

  function renderStat(label, value) {
    return `<article><span>${escapeHtml(label)}</span><strong>${value}</strong></article>`;
  }

  function renderOptions(values, fallback) {
    const list = values && values.length ? values : [fallback];
    return list.map((value) => `<option value="${escapeAttribute(value)}">${escapeHtml(value)}</option>`).join("");
  }

  function createProductUrl(product) {
    return `producto.html?slug=${encodeURIComponent(product.slug)}`;
  }

  function createCategoryUrl(categoryId) {
    return `productos.html?categoria=${encodeURIComponent(categoryId)}`;
  }

  function createWhatsAppUrl(text) {
    return `https://wa.me/${config.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }

  function getColorHex(colorName) {
    return colorMap[colorName] || "#d9d0c8";
  }

  function formatCurrency(value) {
    return config.CURRENCY_FORMATTER.format(Number(value) || 0);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
})();
