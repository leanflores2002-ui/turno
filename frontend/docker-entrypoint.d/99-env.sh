#!/bin/sh
set -e

# Create env.js dynamically from container env var API_BASE_URL
cat > /usr/share/nginx/html/env.js << EOF
window.__env = window.__env || {};
window.__env.API_BASE_URL = "${API_BASE_URL}";
EOF
