#!/bin/sh
set -e

# Ensure Nginx listens on the dynamic $PORT provided by Railway.
export PORT="${PORT:-80}"
envsubst '${PORT}' < /nginx.conf.template > /etc/nginx/conf.d/default.conf

