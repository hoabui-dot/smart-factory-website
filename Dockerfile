# Stage 1: Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Install pnpm matching package.json version
RUN npm install -g pnpm@11.13.0

# Copy dependency files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Set placeholder variables as default values during build.
# This ensures Vite replaces process.env references with these strings,
# which our docker-entrypoint.sh will dynamically substitute at startup.
ARG VITE_API_BASE_URL=PLACEHOLDER_VITE_API_BASE_URL
ARG VITE_SUPABASE_URL=PLACEHOLDER_VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY=PLACEHOLDER_VITE_SUPABASE_ANON_KEY
ARG VITE_ONESIGNAL_APP_ID=PLACEHOLDER_VITE_ONESIGNAL_APP_ID
ARG VITE_SENTRY_DSN=PLACEHOLDER_VITE_SENTRY_DSN

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_ONESIGNAL_APP_ID=$VITE_ONESIGNAL_APP_ID
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

# Build the application
RUN pnpm build

# Stage 2: Serve stage
FROM nginx:alpine

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to nginx public folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
