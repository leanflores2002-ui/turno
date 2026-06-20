(function () {
  const config = window.JAZMIN_CONFIG;
  const seed = window.JAZMIN_SEED;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function sortCategories(categories) {
    return categories.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
  }

  function sortProducts(products) {
    return products
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
  }

  function normalizeCategory(category) {
    return {
      id: category.id,
      name: category.name.trim(),
      description: category.description?.trim() || "",
      order: Number(category.order) || 0,
    };
  }

  function normalizeProduct(product) {
    return {
      id: product.id,
      name: product.name.trim(),
      categoryId: product.categoryId,
      price: Number(product.price) || 0,
      description: product.description?.trim() || "",
      image: product.image?.trim() || "",
      gallery: Array.isArray(product.gallery) ? product.gallery.filter(Boolean) : [],
      colors: Array.isArray(product.colors) ? product.colors.filter(Boolean) : [],
      sizes: Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [],
      tags: Array.isArray(product.tags) ? product.tags.filter(Boolean) : [],
      status: product.status === "out_of_stock" ? "out_of_stock" : "available",
      active: product.active !== false,
      order: Number(product.order) || 0,
    };
  }

  function emitChange() {
    window.dispatchEvent(new CustomEvent("jazmin-store-updated"));
  }

  function ensureStore() {
    const existing = localStorage.getItem(config.STORAGE_KEY);
    if (!existing) {
      const initial = {
        categories: sortCategories(seed.categories).map(normalizeCategory),
        products: sortProducts(seed.products).map(normalizeProduct),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(config.STORAGE_KEY, JSON.stringify(initial));
    }
  }

  function getStore() {
    ensureStore();
    const parsed = JSON.parse(localStorage.getItem(config.STORAGE_KEY));
    return {
      categories: sortCategories((parsed.categories || []).map(normalizeCategory)),
      products: sortProducts((parsed.products || []).map(normalizeProduct)),
      updatedAt: parsed.updatedAt || null,
    };
  }

  function saveStore(nextStore) {
    const payload = {
      categories: sortCategories((nextStore.categories || []).map(normalizeCategory)),
      products: sortProducts((nextStore.products || []).map(normalizeProduct)),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(config.STORAGE_KEY, JSON.stringify(payload));
    emitChange();
    return payload;
  }

  function saveCategories(categories) {
    const store = getStore();
    return saveStore({ ...store, categories });
  }

  function saveProducts(products) {
    const store = getStore();
    return saveStore({ ...store, products });
  }

  function upsertCategory(category) {
    const store = getStore();
    const next = normalizeCategory(category);
    const exists = store.categories.some((item) => item.id === next.id);
    const categories = exists
      ? store.categories.map((item) => (item.id === next.id ? next : item))
      : store.categories.concat(next);
    return saveStore({ ...store, categories });
  }

  function deleteCategory(categoryId) {
    const store = getStore();
    if (store.products.some((product) => product.categoryId === categoryId)) {
      throw new Error("No se puede eliminar una categoria con productos asociados.");
    }
    return saveStore({
      ...store,
      categories: store.categories.filter((category) => category.id !== categoryId),
    });
  }

  function upsertProduct(product) {
    const store = getStore();
    const next = normalizeProduct(product);
    const exists = store.products.some((item) => item.id === next.id);
    const products = exists
      ? store.products.map((item) => (item.id === next.id ? next : item))
      : store.products.concat(next);
    return saveStore({ ...store, products });
  }

  function deleteProduct(productId) {
    const store = getStore();
    return saveStore({
      ...store,
      products: store.products.filter((product) => product.id !== productId),
    });
  }

  function subscribe(callback) {
    const handler = () => callback(getStore());
    const storageHandler = (event) => {
      if (event.key === config.STORAGE_KEY) {
        handler();
      }
    };
    window.addEventListener("storage", storageHandler);
    window.addEventListener("jazmin-store-updated", handler);
    return function unsubscribe() {
      window.removeEventListener("storage", storageHandler);
      window.removeEventListener("jazmin-store-updated", handler);
    };
  }

  function resetStore() {
    localStorage.removeItem(config.STORAGE_KEY);
    ensureStore();
    emitChange();
    return getStore();
  }

  window.JAZMIN_DB = {
    clone,
    getStore,
    saveStore,
    saveCategories,
    saveProducts,
    upsertCategory,
    deleteCategory,
    upsertProduct,
    deleteProduct,
    subscribe,
    resetStore,
  };
})();
