# Deployment Guide

This guide covers different ways to deploy the Restrain Yourself habit tracking application.

## Vercel (Recommended)

Vercel is the easiest way to deploy a Next.js application:

1. Push your code to GitHub, GitLab, or Bitbucket
2. Go to [vercel.com](https://vercel.com) and sign up
3. Import your repository
4. Vercel will automatically detect it's a Next.js app
5. Deploy with one click!

### Environment Variables

No environment variables are required for this application as it uses local storage.

## Netlify

1. Build the application:

   ```bash
   npm run build
   npm run export  # Note: You may need to add this script to package.json
   ```

2. Upload the `out` directory to Netlify

Or connect your Git repository to Netlify for automatic deployments.

## Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t restrain-yourself .
docker run -p 3000:3000 restrain-yourself
```

## Static Export

For static hosting (GitHub Pages, etc.):

1. Add to `next.config.ts`:

   ```typescript
   const nextConfig = {
      output: "export",
      trailingSlash: true,
      images: {
         unoptimized: true,
      },
   };
   ```

2. Build and export:

   ```bash
   npm run build
   ```

3. Deploy the `out` directory to your static host

## Self-Hosting

1. Build the application:

   ```bash
   npm run build
   ```

2. Start the production server:

   ```bash
   npm start
   ```

3. Set up a reverse proxy (nginx, Apache) if needed

## Performance Tips

-  Enable gzip compression
-  Set proper cache headers for static assets
-  Use a CDN for better global performance
-  Monitor Core Web Vitals

## Security Considerations

-  This app uses local storage only - no server-side data
-  No authentication required
-  No sensitive data transmitted
-  HTTPS recommended for production
