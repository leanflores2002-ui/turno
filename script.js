(function () {
  const config = window.JAZMIN_CONFIG;
  const db = window.JAZMIN_DB;

  const state = {
    activeFilter: "all",
    cart: loadCart(),
    store: db.getStore(),
  };

  const refs = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    refs.heroStats = document.getElementById("hero-stats");
    refs.filters = document.getElementById("category-filters");
    refs.productGrid = document.getElementById("product-grid");
    refs.catalogMeta = document.getElementById("catalog-meta");
    refs.orderItems = document.getElementById("order-items");
    refs.orderTotal = document.getElementById("order-total");
    refs.clearCart = document.getElementById("clear-cart");
    refs.customerForm = document.getElementById("customer-form");
    refs.whatsappLink = document.getElementById("whatsapp-link");

    bindStaticEvents();
    renderAll();
    db.subscribe((nextStore) => {
      state.store = nextStore;
      syncCartWithStore();
      renderAll();
    });
  }

  function bindStaticEvents() {
    refs.clearCart.addEventListener("click", clearCart);
    refs.customerForm.addEventListener("submit", finalizeOrder);

    document.querySelectorAll("[data-scroll-order]").forEach((button) => {
      button.addEventListener("click", () => {
        document.getElementById("pedido").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeFilter = button.dataset.filter;
        renderFilters();
        renderProducts();
        document.getElementById("catalogo").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.getElementById("open-order-mobile").addEventListener("click", () => {
      document.getElementById("pedido").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    refs.whatsappLink.href = `https://wa.me/${config.WHATSAPP_NUMBER}`;
  }

  function renderAll() {
    renderHeroStats();
    renderFilters();
    renderProducts();
    renderOrder();
  }

  function renderHeroStats() {
    const visibleProducts = getVisibleProducts();
    const available = visibleProducts.filter((product) => product.status === "available");
    refs.heroStats.innerHTML = [
      metricCard("Productos", visibleProducts.length),
      metricCard("Disponibles", available.length),
      metricCard("Categorias", state.store.categories.length),
    ].join("");
  }

  function metricCard(label, value) {
    return `<article><span>${label}</span><strong>${value}</strong></article>`;
  }

  function renderFilters() {
    const categories = state.store.categories;
    const chips = [
      { id: "all", name: "Todo el catalogo" },
      ...categories.map((category) => ({ id: category.id, name: category.name })),
    ];

    refs.filters.innerHTML = chips
      .map(
        (chip) => `
          <button class="filter-chip ${chip.id === state.activeFilter ? "active" : ""}" type="button" data-chip="${chip.id}">
            ${chip.name}
          </button>
        `
      )
      .join("");

    refs.filters.querySelectorAll("[data-chip]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeFilter = button.dataset.chip;
        renderFilters();
        renderProducts();
      });
    });
  }

  function getVisibleProducts() {
    return state.store.products.filter((product) => product.active);
  }

  function getFilteredProducts() {
    const products = getVisibleProducts();
    if (state.activeFilter === "all") {
      return products;
    }
    return products.filter((product) => product.categoryId === state.activeFilter);
  }

  function renderProducts() {
    const products = getFilteredProducts();
    refs.catalogMeta.textContent =
      products.length === 1 ? "1 producto visible" : `${products.length} productos visibles`;

    if (!products.length) {
      refs.productGrid.innerHTML = `
        <article class="empty-state">
          <div class="product-body">
            <p class="eyebrow">Sin resultados</p>
            <h3 class="product-title">No hay productos para esta categoria</h3>
            <p class="product-description">Prueba con otro filtro o vuelve a "Todo el catalogo".</p>
          </div>
        </article>
      `;
      return;
    }

    refs.productGrid.innerHTML = products.map(renderProductCard).join("");

    refs.productGrid.querySelectorAll("[data-add-product]").forEach((button) => {
      button.addEventListener("click", () => addToCart(button.dataset.addProduct));
    });
  }

  function renderProductCard(product) {
    const category = state.store.categories.find((item) => item.id === product.categoryId);
    const colorOptions = product.colors.length
      ? product.colors.map((color) => `<option value="${escapeHtml(color)}">${escapeHtml(color)}</option>`).join("")
      : '<option value="Sin definir">Sin definir</option>';
    const sizeOptions = product.sizes.length
      ? product.sizes.map((size) => `<option value="${escapeHtml(size)}">${escapeHtml(size)}</option>`).join("")
      : '<option value="Unico">Unico</option>';
    const tags = product.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
    const disabled = product.status === "out_of_stock";

    return `
      <article class="product-card">
        <div class="product-image">
          <img src="${escapeAttribute(product.image || "img/placeholder.svg")}" alt="${escapeAttribute(product.name)}">
        </div>
        <div class="product-body">
          <div class="product-header">
            <div>
              <p class="eyebrow">${escapeHtml(category?.name || "Categoria")}</p>
              <h3 class="product-title">${escapeHtml(product.name)}</h3>
            </div>
            <span class="badge ${product.status}">${product.status === "available" ? "Disponible" : "Sin stock"}</span>
          </div>

          <p class="product-description">${escapeHtml(product.description)}</p>

          <div class="product-price-row">
            <div class="tag-wrap">${tags || '<span class="tag">Hecho a mano</span>'}</div>
            <strong class="product-price">${formatCurrency(product.price)}</strong>
          </div>

          <div class="product-options">
            <label>
              Color
              <select id="color-${product.id}">
                ${colorOptions}
              </select>
            </label>
            <label>
              Tamano
              <select id="size-${product.id}">
                ${sizeOptions}
              </select>
            </label>
            <label>
              Cantidad
              <input type="number" id="qty-${product.id}" min="1" max="99" value="1">
            </label>
            <p class="option-note">Colores disponibles: ${escapeHtml(product.colors.join(", ") || "A coordinar")}</p>
            <button
              class="primary-button block"
              type="button"
              data-add-product="${product.id}"
              ${disabled ? "disabled" : ""}
            >
              ${disabled ? "Sin stock" : "Agregar al pedido"}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function addToCart(productId) {
    const product = state.store.products.find((item) => item.id === productId);
    if (!product || product.status !== "available") {
      return;
    }

    const color = document.getElementById(`color-${productId}`)?.value || "Sin definir";
    const size = document.getElementById(`size-${productId}`)?.value || "Unico";
    const quantity = clamp(Number(document.getElementById(`qty-${productId}`)?.value || 1), 1, 99);
    const key = `${productId}__${color}__${size}`;
    const existing = state.cart.find((item) => item.key === key);

    if (existing) {
      existing.quantity += quantity;
    } else {
      state.cart.push({
        key,
        productId,
        color,
        size,
        quantity,
      });
    }

    persistCart();
    renderOrder();
    document.getElementById("pedido").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderOrder() {
    syncCartWithStore();

    if (!state.cart.length) {
      refs.orderItems.innerHTML = `
        <div class="order-empty">
          <h4>Tu pedido esta vacio</h4>
          <p>Agrega productos desde el catalogo para preparar el mensaje de WhatsApp.</p>
        </div>
      `;
      refs.orderTotal.textContent = formatCurrency(0);
      return;
    }

    refs.orderItems.innerHTML = state.cart.map(renderOrderItem).join("");
    refs.orderTotal.textContent = formatCurrency(getCartTotal());

    refs.orderItems.querySelectorAll("[data-cart-action]").forEach((button) => {
      button.addEventListener("click", () => handleCartAction(button.dataset.cartAction, button.dataset.cartKey));
    });
  }

  function renderOrderItem(item) {
    const product = state.store.products.find((entry) => entry.id === item.productId);
    if (!product) {
      return "";
    }
    const lineTotal = item.quantity * product.price;
    return `
      <article class="order-item">
        <h4>${escapeHtml(product.name)}</h4>
        <p>Color: ${escapeHtml(item.color)} · Tamano: ${escapeHtml(item.size)}</p>
        <p>${formatCurrency(product.price)} c/u</p>
        <footer>
          <div class="quantity-controls">
            <button type="button" data-cart-action="decrease" data-cart-key="${escapeAttribute(item.key)}">-</button>
            <span class="quantity-value">${item.quantity}</span>
            <button type="button" data-cart-action="increase" data-cart-key="${escapeAttribute(item.key)}">+</button>
          </div>
          <div>
            <strong>${formatCurrency(lineTotal)}</strong>
            <button class="tiny-button" type="button" data-cart-action="remove" data-cart-key="${escapeAttribute(item.key)}">
              Eliminar
            </button>
          </div>
        </footer>
      </article>
    `;
  }

  function handleCartAction(action, key) {
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
    renderOrder();
  }

  function clearCart() {
    state.cart = [];
    persistCart();
    renderOrder();
  }

  function finalizeOrder(event) {
    event.preventDefault();
    syncCartWithStore();

    if (!state.cart.length) {
      alert("Agrega al menos un producto antes de finalizar el pedido.");
      return;
    }

    const name = document.getElementById("customer-name").value.trim();
    const location = document.getElementById("customer-location").value.trim();
    const payment = document.getElementById("customer-payment").value.trim();
    const comments = document.getElementById("customer-comments").value.trim();

    if (!name || !location || !payment) {
      alert("Completa nombre, localidad y forma de pago antes de continuar.");
      return;
    }

    const lines = [
      "Hola Jazmin Macetas, quiero hacer este pedido:",
      "",
      ...state.cart.flatMap((item, index) => {
        const product = state.store.products.find((entry) => entry.id === item.productId);
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

    const url = `https://wa.me/${config.WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function syncCartWithStore() {
    const validProducts = new Set(
      state.store.products.filter((product) => product.active && product.status === "available").map((product) => product.id)
    );
    state.cart = state.cart.filter((item) => validProducts.has(item.productId));
    persistCart();
  }

  function getCartTotal() {
    return state.cart.reduce((total, item) => {
      const product = state.store.products.find((entry) => entry.id === item.productId);
      return product ? total + product.price * item.quantity : total;
    }, 0);
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
