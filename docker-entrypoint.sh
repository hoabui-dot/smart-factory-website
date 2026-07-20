#!/bin/sh
set -e

echo "Substituting environment variables in JavaScript bundles..."

# Replace placeholders in all js files
for file in /usr/share/nginx/html/assets/*.js; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    sed -i "s|PLACEHOLDER_VITE_API_BASE_URL|${VITE_API_BASE_URL}|g" "$file"
    sed -i "s|PLACEHOLDER_VITE_SUPABASE_URL|${VITE_SUPABASE_URL}|g" "$file"
    sed -i "s|PLACEHOLDER_VITE_SUPABASE_ANON_KEY|${VITE_SUPABASE_ANON_KEY}|g" "$file"
    sed -i "s|PLACEHOLDER_VITE_ONESIGNAL_APP_ID|${VITE_ONESIGNAL_APP_ID}|g" "$file"
    sed -i "s|PLACEHOLDER_VITE_SENTRY_DSN|${VITE_SENTRY_DSN}|g" "$file"
  fi
done

echo "Environment substitution complete. Starting Nginx..."
exec "$@"
