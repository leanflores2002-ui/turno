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
    catalog: {
      category: "all",
      search: "",
      color: "all",
      sort: "featured",
    },
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
    hydratePageState();
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

  function hydratePageState() {
    if (state.page !== "catalog") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const defaultCategory = document.body.dataset.defaultCategory || "all";
    const queryCategory = params.get("categoria");
    const nextCategory = isValidCategory(queryCategory) ? queryCategory : defaultCategory;

    state.catalog.category = isValidCategory(nextCategory) ? nextCategory : "all";
    state.catalog.search = params.get("q")?.trim() || "";
    state.catalog.color = params.get("color")?.trim() || "all";
    state.catalog.sort = params.get("orden")?.trim() || "featured";
  }

  function cacheRefs() {
    refs.menuToggle = document.getElementById("menu-toggle");
    refs.mainNav = document.getElementById("main-nav");
    refs.orderFab = document.getElementById("order-fab");
    refs.orderCount = document.getElementById("order-count");
    refs.inlineOrderCounts = Array.from(document.querySelectorAll("[data-order-count-inline]"));
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
    refs.catalogSearch = document.getElementById("catalog-search");
    refs.catalogColor = document.getElementById("catalog-color");
    refs.catalogSort = document.getElementById("catalog-sort");
    refs.catalogReset = document.getElementById("catalog-reset");
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

    refs.catalogSearch?.addEventListener("input", () => {
      state.catalog.search = refs.catalogSearch.value.trim();
      applyCatalogStateToLocation();
      renderCatalogPage();
    });

    refs.catalogColor?.addEventListener("change", () => {
      state.catalog.color = refs.catalogColor.value || "all";
      applyCatalogStateToLocation();
      renderCatalogPage();
    });

    refs.catalogSort?.addEventListener("change", () => {
      state.catalog.sort = refs.catalogSort.value || "featured";
      applyCatalogStateToLocation();
      renderCatalogPage();
    });

    refs.catalogReset?.addEventListener("click", () => {
      state.catalog.search = "";
      state.catalog.color = "all";
      state.catalog.sort = "featured";
      const defaultCategory = document.body.dataset.defaultCategory || "all";
      state.catalog.category = isValidCategory(defaultCategory) ? defaultCategory : "all";
      applyCatalogStateToLocation();
      renderCatalogPage();
    });

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
    document.querySelectorAll("[data-whatsapp-message]").forEach((link) => {
      const message = link.getAttribute("data-whatsapp-message") || "";
      if (link.tagName === "A") {
        link.setAttribute("href", createWhatsAppUrl(message));
      }
    });
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
    renderProductCollection(refs.featuredGrid, getFeaturedProducts().slice(0, 4), { showCategory: true });
  }

  function renderCatalogPage() {
    renderCatalogControls();
    renderCatalogFilters();

    const products = getFilteredCatalogProducts();
    if (refs.catalogCount) {
      refs.catalogCount.textContent =
        products.length === 1 ? "1 producto visible" : `${products.length} productos visibles`;
    }

    renderProductCollection(refs.catalogGrid, products, { showCategory: true });
  }

  function renderCatalogControls() {
    if (refs.catalogSearch) {
      refs.catalogSearch.value = state.catalog.search;
    }

    const relevantProducts = getProductsForCurrentCategory();
    const colors = Array.from(new Set(relevantProducts.flatMap((product) => product.colors))).sort((a, b) =>
      a.localeCompare(b)
    );

    if (refs.catalogColor) {
      refs.catalogColor.innerHTML = [`<option value="all">Todos los colores</option>`]
        .concat(
          colors.map((color) => {
            const selected = state.catalog.color === color ? " selected" : "";
            return `<option value="${escapeAttribute(color)}"${selected}>${escapeHtml(color)}</option>`;
          })
        )
        .join("");

      if (state.catalog.color !== "all" && !colors.includes(state.catalog.color)) {
        state.catalog.color = "all";
        refs.catalogColor.value = "all";
      }
    }

    if (refs.catalogSort) {
      refs.catalogSort.value = state.catalog.sort;
    }
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
          <h3>Esta pieza ya no esta disponible o la URL no es valida.</h3>
          <a class="primary-button" href="productos.html">Volver al catalogo</a>
        </article>
      `;
      if (refs.relatedGrid) {
        refs.relatedGrid.innerHTML = "";
      }
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
    renderProductCollection(refs.aboutFeaturedGrid, getFeaturedProducts().slice(0, 4), { showCategory: true });
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
          <a class="category-card" href="${escapeAttribute(createCategoryUrl(category.id))}">
            <div class="category-card-media">
              <img src="${escapeAttribute(category.image || "img/placeholder.svg")}" alt="${escapeAttribute(category.name)}">
            </div>
            <div class="category-card-body">
              <div>
                <p class="eyebrow">${escapeHtml(category.name)}</p>
                <h3>${escapeHtml(category.name)}</h3>
              </div>
              <p>${escapeHtml(category.description)}</p>
              <span class="section-link">Ver productos</span>
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
            class="filter-chip ${chip.id === state.catalog.category ? "active" : ""}"
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
        const nextCategory = button.dataset.filterChip || "all";
        const targetUrl = createCategoryUrl(nextCategory, {
          search: state.catalog.search,
          color: state.catalog.color,
          sort: state.catalog.sort,
        });

        if (!isSameCatalogDocument(targetUrl)) {
          window.location.assign(targetUrl);
          return;
        }

        state.catalog.category = nextCategory;
        applyCatalogStateToLocation();
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
          <h3>No hay productos para esta seleccion.</h3>
          <p>Prueba con otra categoria, color o palabra clave.</p>
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
    const swatches = product.colors
      .slice(0, 5)
      .map(
        (color) =>
          `<span class="swatch" title="${escapeAttribute(color)}" style="background:${escapeAttribute(
            getColorHex(color)
          )};"></span>`
      )
      .join("");

    const tags = product.tags
      .slice(0, 2)
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join("");

    const disabled = product.status !== "available";
    const categoryHtml =
      options.showCategory && category ? `<p class="eyebrow">${escapeHtml(category.name)}</p>` : `<p class="eyebrow">Pieza</p>`;

    return `
      <article class="product-preview-card">
        <a class="product-preview-link" href="${escapeAttribute(createProductUrl(product))}">
          <img
            class="product-preview-image"
            src="${escapeAttribute(product.image || "img/placeholder.svg")}"
            alt="${escapeAttribute(product.name)}"
          >
        </a>
        <div class="product-preview-body">
          <div class="product-topline">
            ${categoryHtml}
            <div class="product-badges">${tags}</div>
          </div>
          <a class="product-title-link" href="${escapeAttribute(createProductUrl(product))}">${escapeHtml(product.name)}</a>
          <p class="product-preview-copy">${escapeHtml(product.shortDescription || product.description)}</p>
          <div class="product-meta-row">
            <strong class="product-preview-price">${formatCurrency(product.price)}</strong>
            <div class="swatches">${swatches}</div>
          </div>
          <div class="product-actions">
            <a class="ghost-button" href="${escapeAttribute(createProductUrl(product))}">Ver producto</a>
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
    const tags = product.tags.length ? product.tags : [product.status === "available" ? "Disponible" : "Sin stock"];
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
            <div class="product-badges">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
          </div>
          <h1>${escapeHtml(product.name)}</h1>
          <strong class="product-preview-price">${formatCurrency(product.price)}</strong>
          <p class="product-short">${escapeHtml(product.shortDescription)}</p>
          <p class="product-long">${escapeHtml(product.fullDescription)}</p>

          <div class="product-options">
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

          <div class="detail-actions">
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
              href="${escapeAttribute(createWhatsAppUrl(`Hola Jazmin Macetas, quiero consultar por ${product.name}.`))}"
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
                    <h3>${escapeHtml(label)}</h3>
                    <p>${escapeHtml(value)}</p>
                  </article>
                `
              )
              .join("")}
          </div>

          <div class="care-panel">
            <h3>Cuidados del producto</h3>
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
    const count = getCartCount();
    refs.orderCount.textContent = String(count);
    refs.inlineOrderCounts.forEach((node) => {
      node.textContent = String(count);
    });
    refs.orderFab?.classList.toggle("has-items", count > 0);

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
        <div class="order-item-thumb">
          <img src="${escapeAttribute(product.image || "img/placeholder.svg")}" alt="${escapeAttribute(product.name)}">
        </div>
        <div class="order-item-details">
          <h4>${escapeHtml(product.name)}</h4>
          <p>Color: ${escapeHtml(item.color)} | Tamano: ${escapeHtml(item.size)}</p>
          <p>Unitario: ${formatCurrency(product.price)} | Subtotal: ${formatCurrency(subtotal)}</p>
          <div class="order-item-footer">
            <div class="quantity-controls">
              <button type="button" data-cart-action="decrease" data-cart-key="${escapeAttribute(item.key)}">-</button>
              <span class="quantity-value">${item.quantity}</span>
              <button type="button" data-cart-action="increase" data-cart-key="${escapeAttribute(item.key)}">+</button>
            </div>
            <button class="tiny-button" type="button" data-cart-action="remove" data-cart-key="${escapeAttribute(item.key)}">
              Eliminar
            </button>
          </div>
        </div>
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
          `- Precio unitario: ${formatCurrency(product.price)}`,
          `- Subtotal: ${formatCurrency(product.price * item.quantity)}`,
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

  function getProductsForCurrentCategory() {
    const products = getPublicProducts();
    if (state.catalog.category === "all") {
      return products;
    }
    return products.filter((product) => product.categoryId === state.catalog.category);
  }

  function getFilteredCatalogProducts() {
    let products = getPublicProducts().slice();

    if (state.catalog.category !== "all") {
      products = products.filter((product) => product.categoryId === state.catalog.category);
    }

    if (state.catalog.search) {
      const query = normalizeText(state.catalog.search);
      products = products.filter((product) => {
        const categoryName = getCategoryById(product.categoryId)?.name || "";
        const haystack = [
          product.name,
          product.shortDescription,
          product.fullDescription,
          categoryName,
          product.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return normalizeText(haystack).includes(query);
      });
    }

    if (state.catalog.color !== "all") {
      products = products.filter((product) => product.colors.includes(state.catalog.color));
    }

    const orderWeight = (product) => Number(product.order) || 0;
    const featuredWeight = (product) => (product.featured ? 0 : 1);

    if (state.catalog.sort === "price-asc") {
      products.sort((a, b) => a.price - b.price || orderWeight(a) - orderWeight(b));
      return products;
    }

    if (state.catalog.sort === "price-desc") {
      products.sort((a, b) => b.price - a.price || orderWeight(a) - orderWeight(b));
      return products;
    }

    if (state.catalog.sort === "name-asc") {
      products.sort((a, b) => a.name.localeCompare(b.name) || orderWeight(a) - orderWeight(b));
      return products;
    }

    products.sort(
      (a, b) =>
        featuredWeight(a) - featuredWeight(b) ||
        orderWeight(a) - orderWeight(b) ||
        a.name.localeCompare(b.name)
    );
    return products;
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
    return `<article class="stat-card"><span>${escapeHtml(label)}</span><strong>${value}</strong></article>`;
  }

  function renderOptions(values, fallback) {
    const list = values && values.length ? values : [fallback];
    return list.map((value) => `<option value="${escapeAttribute(value)}">${escapeHtml(value)}</option>`).join("");
  }

  function createProductUrl(product) {
    return `producto.html?slug=${encodeURIComponent(product.slug)}`;
  }

  function createCategoryUrl(categoryId, options = {}) {
    const nextCategory = categoryId || "all";
    let pathname = "productos.html";

    if (nextCategory === "combos") {
      pathname = "combos.html";
    }
    if (nextCategory === "por-mayor") {
      pathname = "por-mayor.html";
    }

    const url = new URL(pathname, window.location.href);
    if (pathname === "productos.html" && nextCategory !== "all") {
      url.searchParams.set("categoria", nextCategory);
    }
    if (options.search) {
      url.searchParams.set("q", options.search);
    }
    if (options.color && options.color !== "all") {
      url.searchParams.set("color", options.color);
    }
    if (options.sort && options.sort !== "featured") {
      url.searchParams.set("orden", options.sort);
    }
    return `${url.pathname.split("/").pop()}${url.search}`;
  }

  function applyCatalogStateToLocation() {
    if (state.page !== "catalog") {
      return;
    }

    const url = new URL(window.location.href);
    const defaultCategory = document.body.dataset.defaultCategory || "all";

    if (
      state.catalog.category &&
      state.catalog.category !== "all" &&
      state.catalog.category !== defaultCategory &&
      url.pathname.toLowerCase().endsWith("productos.html")
    ) {
      url.searchParams.set("categoria", state.catalog.category);
    } else {
      url.searchParams.delete("categoria");
    }

    if (state.catalog.search) {
      url.searchParams.set("q", state.catalog.search);
    } else {
      url.searchParams.delete("q");
    }

    if (state.catalog.color !== "all") {
      url.searchParams.set("color", state.catalog.color);
    } else {
      url.searchParams.delete("color");
    }

    if (state.catalog.sort !== "featured") {
      url.searchParams.set("orden", state.catalog.sort);
    } else {
      url.searchParams.delete("orden");
    }

    window.history.replaceState({}, "", `${url.pathname.split("/").pop()}${url.search}`);
  }

  function createWhatsAppUrl(text) {
    return `https://wa.me/${config.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }

  function getColorHex(colorName) {
    return colorMap[colorName] || "#d9d0c8";
  }

  function isValidCategory(categoryId) {
    if (!categoryId || categoryId === "all") {
      return true;
    }
    return state.store.categories.some((category) => category.id === categoryId);
  }

  function isSameCatalogDocument(targetUrl) {
    const currentName = window.location.pathname.split("/").pop().toLowerCase();
    const targetName = new URL(targetUrl, window.location.href).pathname.split("/").pop().toLowerCase();
    return currentName === targetName;
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
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
