(function () {
  const config = window.JAZMIN_CONFIG;
  const db = window.JAZMIN_DB;

  const state = {
    store: db.getStore(),
    editingProductId: null,
    editingCategoryId: null,
    search: "",
    filterCategory: "all",
  };

  const refs = {};
  const tagOptions = ["Nuevo", "Mas vendido", "Por mayor", "Combo"];

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    refs.loginScreen = document.getElementById("login-screen");
    refs.loginForm = document.getElementById("login-form");
    refs.loginPassword = document.getElementById("login-password");
    refs.loginError = document.getElementById("login-error");
    refs.app = document.getElementById("admin-app");
    refs.logoutButton = document.getElementById("logout-button");
    refs.resetButton = document.getElementById("reset-store");
    refs.stats = document.getElementById("admin-stats");
    refs.productList = document.getElementById("product-list");
    refs.productForm = document.getElementById("product-form");
    refs.categoryFilter = document.getElementById("filter-category");
    refs.searchInput = document.getElementById("search-products");
    refs.message = document.getElementById("admin-message");
    refs.preview = document.getElementById("product-preview");
    refs.previewImage = document.getElementById("preview-image");
    refs.previewTitle = document.getElementById("preview-title");
    refs.previewMeta = document.getElementById("preview-meta");
    refs.previewDesc = document.getElementById("preview-description");
    refs.productCategorySelect = refs.productForm.elements.categoryId;
    refs.productSubmit = document.getElementById("product-submit");
    refs.cancelProduct = document.getElementById("cancel-product");
    refs.newProduct = document.getElementById("new-product");
    refs.categoryList = document.getElementById("category-list");
    refs.categoryForm = document.getElementById("category-form");
    refs.cancelCategory = document.getElementById("cancel-category");

    bindEvents();
    syncAuthView();
    renderAll();
    db.subscribe((nextStore) => {
      state.store = nextStore;
      renderAll();
    });
  }

  function bindEvents() {
    refs.loginForm.addEventListener("submit", handleLogin);
    refs.logoutButton.addEventListener("click", logout);
    refs.resetButton.addEventListener("click", handleReset);
    refs.searchInput.addEventListener("input", (event) => {
      state.search = event.target.value.trim().toLowerCase();
      renderProducts();
    });
    refs.categoryFilter.addEventListener("change", (event) => {
      state.filterCategory = event.target.value;
      renderProducts();
    });
    refs.productForm.addEventListener("submit", saveProduct);
    refs.productForm.addEventListener("input", renderPreviewFromForm);
    refs.cancelProduct.addEventListener("click", resetProductForm);
    refs.newProduct.addEventListener("click", () => {
      resetProductForm();
      refs.productForm.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    refs.categoryForm.addEventListener("submit", saveCategory);
    refs.cancelCategory.addEventListener("click", resetCategoryForm);
  }

  function syncAuthView() {
    const authed = sessionStorage.getItem(config.ADMIN_SESSION_KEY) === "ok";
    refs.loginScreen.classList.toggle("hidden", authed);
    refs.app.classList.toggle("hidden", !authed);
  }

  async function handleLogin(event) {
    event.preventDefault();
    refs.loginError.classList.add("hidden");
    const password = refs.loginPassword.value;
    const digest = await sha256(password);

    if (digest !== config.ADMIN_PASSWORD_HASH) {
      refs.loginError.textContent = "Contrasena incorrecta.";
      refs.loginError.classList.remove("hidden");
      return;
    }

    sessionStorage.setItem(config.ADMIN_SESSION_KEY, "ok");
    refs.loginForm.reset();
    syncAuthView();
  }

  function logout() {
    sessionStorage.removeItem(config.ADMIN_SESSION_KEY);
    syncAuthView();
  }

  function handleReset() {
    const confirmed = window.confirm("Esto restaurara los datos iniciales del catalogo en este navegador. Continuar?");
    if (!confirmed) {
      return;
    }
    db.resetStore();
    showMessage("Catalogo restaurado con los datos iniciales.", "success");
  }

  function renderAll() {
    renderStats();
    renderFilters();
    renderProducts();
    renderCategories();
    renderPreviewFromForm();
  }

  function renderStats() {
    const total = state.store.products.length;
    const available = state.store.products.filter((product) => product.active && product.status === "available").length;
    const outOfStock = state.store.products.filter((product) => product.status === "out_of_stock").length;
    const categories = state.store.categories.length;

    refs.stats.innerHTML = `
      <article class="stat-card"><p class="eyebrow">Productos</p><strong>${total}</strong></article>
      <article class="stat-card"><p class="eyebrow">Disponibles</p><strong>${available}</strong></article>
      <article class="stat-card"><p class="eyebrow">Sin stock</p><strong>${outOfStock}</strong></article>
      <article class="stat-card"><p class="eyebrow">Categorias</p><strong>${categories}</strong></article>
    `;
  }

  function renderFilters() {
    const categoryOptions = state.store.categories
      .map((category) => `<option value="${escapeAttribute(category.id)}">${escapeHtml(category.name)}</option>`)
      .join("");

    refs.categoryFilter.innerHTML = `
      <option value="all">Todas las categorias</option>
      ${categoryOptions}
    `;
    refs.categoryFilter.value = state.filterCategory;

    const currentProductCategory = refs.productCategorySelect.value;
    refs.productCategorySelect.innerHTML = `
      <option value="">Selecciona una categoria</option>
      ${categoryOptions}
    `;
    refs.productCategorySelect.value = currentProductCategory;
  }

  function getFilteredProducts() {
    return state.store.products.filter((product) => {
      const matchesCategory = state.filterCategory === "all" || product.categoryId === state.filterCategory;
      const searchable = `${product.name} ${product.description} ${product.tags.join(" ")}`.toLowerCase();
      const matchesSearch = !state.search || searchable.includes(state.search);
      return matchesCategory && matchesSearch;
    });
  }

  function renderProducts() {
    const products = getFilteredProducts();

    if (!products.length) {
      refs.productList.innerHTML = `
        <article class="empty-state">
          <div class="product-body">
            <p class="eyebrow">Sin coincidencias</p>
            <h3 class="product-title">No hay productos con ese filtro</h3>
          </div>
        </article>
      `;
      return;
    }

    refs.productList.innerHTML = products
      .map((product) => {
        const category = state.store.categories.find((item) => item.id === product.categoryId);
        return `
          <article class="product-list-card admin-card">
            <header>
              <div>
                <p class="eyebrow">${escapeHtml(category?.name || "Categoria")}</p>
                <h3>${escapeHtml(product.name)}</h3>
                <p>${escapeHtml(product.description)}</p>
              </div>
              <span class="badge ${product.status}">
                ${product.status === "available" ? "Disponible" : "Sin stock"}
              </span>
            </header>

            <div class="category-meta">
              <span class="tag">${product.active ? "Activo" : "Oculto"}</span>
              <span class="tag">${formatCurrency(product.price)}</span>
              <span class="tag">Orden ${product.order}</span>
            </div>

            <footer>
              <div class="admin-actions">
                <button class="secondary-button" type="button" data-edit-product="${escapeAttribute(product.id)}">Editar</button>
                <button class="ghost-button" type="button" data-toggle-active="${escapeAttribute(product.id)}">
                  ${product.active ? "Desactivar" : "Activar"}
                </button>
                <button class="ghost-button" type="button" data-toggle-stock="${escapeAttribute(product.id)}">
                  ${product.status === "available" ? "Marcar sin stock" : "Marcar disponible"}
                </button>
              </div>
              <button class="tiny-button" type="button" data-delete-product="${escapeAttribute(product.id)}">Eliminar</button>
            </footer>
          </article>
        `;
      })
      .join("");

    refs.productList.querySelectorAll("[data-edit-product]").forEach((button) => {
      button.addEventListener("click", () => populateProductForm(button.dataset.editProduct));
    });
    refs.productList.querySelectorAll("[data-delete-product]").forEach((button) => {
      button.addEventListener("click", () => deleteProduct(button.dataset.deleteProduct));
    });
    refs.productList.querySelectorAll("[data-toggle-active]").forEach((button) => {
      button.addEventListener("click", () => toggleProductActive(button.dataset.toggleActive));
    });
    refs.productList.querySelectorAll("[data-toggle-stock]").forEach((button) => {
      button.addEventListener("click", () => toggleProductStock(button.dataset.toggleStock));
    });
  }

  function renderCategories() {
    if (!state.store.categories.length) {
      refs.categoryList.innerHTML = '<div class="empty-state"><div class="product-body"><h3 class="product-title">No hay categorias</h3></div></div>';
      return;
    }

    refs.categoryList.innerHTML = state.store.categories
      .map((category) => {
        const totalProducts = state.store.products.filter((product) => product.categoryId === category.id).length;
        return `
          <article class="category-item">
            <header>
              <div>
                <p class="eyebrow">Orden ${category.order}</p>
                <h3>${escapeHtml(category.name)}</h3>
              </div>
              <span class="tag">${totalProducts} productos</span>
            </header>
            <p>${escapeHtml(category.description || "Sin descripcion")}</p>
            <footer class="product-list-card footer">
              <div class="admin-actions">
                <button class="secondary-button" type="button" data-edit-category="${escapeAttribute(category.id)}">Editar</button>
              </div>
              <button class="tiny-button" type="button" data-delete-category="${escapeAttribute(category.id)}">Eliminar</button>
            </footer>
          </article>
        `;
      })
      .join("");

    refs.categoryList.querySelectorAll("[data-edit-category]").forEach((button) => {
      button.addEventListener("click", () => populateCategoryForm(button.dataset.editCategory));
    });
    refs.categoryList.querySelectorAll("[data-delete-category]").forEach((button) => {
      button.addEventListener("click", () => deleteCategory(button.dataset.deleteCategory));
    });
  }

  function populateProductForm(productId) {
    const product = state.store.products.find((item) => item.id === productId);
    if (!product) {
      return;
    }
    state.editingProductId = productId;
    refs.productForm.elements.productId.value = product.id;
    refs.productForm.elements.name.value = product.name;
    refs.productForm.elements.categoryId.value = product.categoryId;
    refs.productForm.elements.price.value = product.price;
    refs.productForm.elements.description.value = product.description;
    refs.productForm.elements.image.value = product.image;
    refs.productForm.elements.gallery.value = product.gallery.join("\n");
    refs.productForm.elements.colors.value = product.colors.join(", ");
    refs.productForm.elements.sizes.value = product.sizes.join(", ");
    refs.productForm.elements.order.value = product.order;
    refs.productForm.elements.status.value = product.status;
    refs.productForm.elements.active.checked = product.active;
    tagOptions.forEach((tag) => {
      refs.productForm.querySelector(`[data-tag-value="${cssEscape(tag)}"]`).checked = product.tags.includes(tag);
    });
    refs.productSubmit.textContent = "Guardar cambios";
    renderPreviewFromForm();
    refs.productForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetProductForm() {
    state.editingProductId = null;
    refs.productForm.reset();
    refs.productForm.elements.productId.value = "";
    refs.productForm.elements.active.checked = true;
    refs.productForm.elements.status.value = "available";
    refs.productSubmit.textContent = "Agregar producto";
    renderPreviewFromForm();
  }

  function saveProduct(event) {
    event.preventDefault();
    const form = event.currentTarget.elements;
    const name = form.name.value.trim();
    const categoryId = form.categoryId.value;
    const image = form.image.value.trim();

    if (!name || !categoryId || !image) {
      showMessage("Nombre, categoria e imagen principal son obligatorios.", "error");
      return;
    }

    const productId = form.productId.value || slugify(name);
    const product = {
      id: productId,
      name,
      categoryId,
      price: Number(form.price.value),
      description: form.description.value.trim(),
      image,
      gallery: splitLines(form.gallery.value),
      colors: splitList(form.colors.value),
      sizes: splitList(form.sizes.value),
      tags: getSelectedTags(),
      status: form.status.value,
      active: form.active.checked,
      order: Number(form.order.value) || state.store.products.length + 1,
    };

    db.upsertProduct(product);
    resetProductForm();
    showMessage("Producto guardado correctamente.", "success");
  }

  function deleteProduct(productId) {
    const product = state.store.products.find((item) => item.id === productId);
    const confirmed = window.confirm(`Eliminar "${product?.name || "este producto"}"?`);
    if (!confirmed) {
      return;
    }
    db.deleteProduct(productId);
    if (state.editingProductId === productId) {
      resetProductForm();
    }
    showMessage("Producto eliminado.", "success");
  }

  function toggleProductActive(productId) {
    const product = state.store.products.find((item) => item.id === productId);
    if (!product) {
      return;
    }
    db.upsertProduct({ ...product, active: !product.active });
    showMessage(product.active ? "Producto ocultado." : "Producto activado.", "success");
  }

  function toggleProductStock(productId) {
    const product = state.store.products.find((item) => item.id === productId);
    if (!product) {
      return;
    }
    db.upsertProduct({
      ...product,
      status: product.status === "available" ? "out_of_stock" : "available",
    });
    showMessage("Estado de stock actualizado.", "success");
  }

  function populateCategoryForm(categoryId) {
    const category = state.store.categories.find((item) => item.id === categoryId);
    if (!category) {
      return;
    }
    state.editingCategoryId = categoryId;
    refs.categoryForm.elements.categoryId.value = category.id;
    refs.categoryForm.elements.categoryName.value = category.name;
    refs.categoryForm.elements.categoryDescription.value = category.description;
    refs.categoryForm.elements.categoryOrder.value = category.order;
  }

  function resetCategoryForm() {
    state.editingCategoryId = null;
    refs.categoryForm.reset();
    refs.categoryForm.elements.categoryId.value = "";
  }

  function saveCategory(event) {
    event.preventDefault();
    const form = event.currentTarget.elements;
    const name = form.categoryName.value.trim();
    if (!name) {
      showMessage("La categoria necesita al menos un nombre.", "error");
      return;
    }
    const id = form.categoryId.value || slugify(name);
    db.upsertCategory({
      id,
      name,
      description: form.categoryDescription.value.trim(),
      order: Number(form.categoryOrder.value) || state.store.categories.length + 1,
    });
    resetCategoryForm();
    showMessage("Categoria guardada.", "success");
  }

  function deleteCategory(categoryId) {
    const category = state.store.categories.find((item) => item.id === categoryId);
    const confirmed = window.confirm(`Eliminar la categoria "${category?.name || ""}"?`);
    if (!confirmed) {
      return;
    }

    try {
      db.deleteCategory(categoryId);
      if (state.editingCategoryId === categoryId) {
        resetCategoryForm();
      }
      showMessage("Categoria eliminada.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  function renderPreviewFromForm() {
    if (!refs.previewTitle) {
      return;
    }

    const form = refs.productForm.elements;
    const colors = splitList(form.colors.value);
    const sizes = splitList(form.sizes.value);
    const category = state.store.categories.find((item) => item.id === form.categoryId.value);

    refs.previewImage.src = form.image.value.trim() || "img/placeholder.svg";
    refs.previewTitle.textContent = form.name.value.trim() || "Vista previa del producto";
    refs.previewMeta.textContent = `${category?.name || "Sin categoria"} · ${formatCurrency(Number(form.price.value) || 0)}`;
    refs.previewDesc.textContent =
      form.description.value.trim() ||
      `Colores: ${colors.join(", ") || "A definir"} · Tamanos: ${sizes.join(", ") || "A definir"}`;
  }

  function getSelectedTags() {
    return Array.from(refs.productForm.querySelectorAll("[data-tag-value]:checked")).map((input) => input.value);
  }

  function showMessage(text, type) {
    refs.message.textContent = text;
    refs.message.className = `message ${type}`;
    refs.message.classList.remove("hidden");
    window.clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = window.setTimeout(() => {
      refs.message.classList.add("hidden");
    }, 3200);
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hash))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function formatCurrency(value) {
    return config.CURRENCY_FORMATTER.format(Number(value) || 0);
  }

  function splitList(value) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function splitLines(value) {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function slugify(value) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48);
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

  function cssEscape(value) {
    return window.CSS && typeof window.CSS.escape === "function" ? window.CSS.escape(value) : value.replace(/"/g, '\\"');
  }
})();
