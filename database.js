(function () {
  const config = window.JAZMIN_CONFIG;
  const seed = window.JAZMIN_SEED;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 64);
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
      name: String(category.name || "").trim(),
      description: category.description?.trim() || "",
      image: category.image?.trim() || "img/placeholder.svg",
      order: Number(category.order) || 0,
    };
  }

  function normalizeProduct(product) {
    const name = String(product.name || product.nombre || "").trim();
    const shortDescription =
      product.shortDescription?.trim() ||
      product.descripcionCorta?.trim() ||
      product.description?.trim() ||
      "";
    const fullDescription =
      product.fullDescription?.trim() ||
      product.descripcionCompleta?.trim() ||
      shortDescription;
    const image = product.image?.trim() || product.imagenPrincipal?.trim() || "img/placeholder.svg";
    const gallerySource = product.gallery || product.imagenes || [];
    const gallery = Array.isArray(gallerySource) ? gallerySource.filter(Boolean) : [];
    const tags = Array.isArray(product.tags)
      ? product.tags.filter(Boolean)
      : product.etiqueta
        ? [product.etiqueta]
        : [];
    const careSource = product.care || product.cuidados || [];

    return {
      id: product.id,
      slug: product.slug?.trim() || slugify(name || product.id),
      name,
      categoryId: product.categoryId || product.categoriaId,
      price: Number(product.price ?? product.precio) || 0,
      description: shortDescription,
      shortDescription,
      fullDescription,
      image,
      gallery: gallery.length ? gallery : [image],
      colors: Array.isArray(product.colors || product.colores)
        ? (product.colors || product.colores).filter(Boolean)
        : [],
      sizes: Array.isArray(product.sizes || product.tamanios)
        ? (product.sizes || product.tamanios).filter(Boolean)
        : [],
      tags,
      material: product.material?.trim() || "Yeso ceramico",
      finish: product.finish?.trim() || product.terminacion?.trim() || "Pintado y sellado con barniz",
      style: product.style?.trim() || product.estilo?.trim() || "Minimalista artesanal",
      use: product.use?.trim() || product.uso?.trim() || "Decorativo / funcional",
      personalization:
        product.personalization?.trim() ||
        product.personalizacion?.trim() ||
        "Consultar colores disponibles",
      idealFor:
        product.idealFor?.trim() ||
        product.idealPara?.trim() ||
        "Hogar, regalos, souvenirs y emprendimientos",
      care: Array.isArray(careSource) ? careSource.filter(Boolean) : [],
      featured: product.featured === true || product.destacado === true,
      status: product.status === "out_of_stock" || product.disponible === false ? "out_of_stock" : "available",
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
      ? store.products.map((item) => (item.id === next.id ? { ...item, ...next } : item))
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
    slugify,
  };
})();
