// Runtime environment for the Angular app (overrides API base URL in production)
// Railway: set container env var API_BASE_URL to override at runtime via nginx entrypoint script.
// Local dev: this file stays empty or you can set a value here.
window.__env = window.__env || {};
window.__env.API_BASE_URL = window.__env.API_BASE_URL || '';

