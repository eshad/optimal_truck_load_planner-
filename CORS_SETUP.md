# CORS Configuration

This NestJS API is pre-configured with CORS enabled for common frontend frameworks.

## Pre-configured Origins

The API accepts requests from:
- `http://localhost:3000` - Next.js default port
- `http://localhost:5173` - Vite default port
- `http://localhost:5174` - Vite alternate port
- `http://localhost:4200` - Angular default port
- `http://localhost:8080` - Vue CLI default port

## Configuration Location

CORS is configured in `src/main.ts`:

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    // ... more origins
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  allowedHeaders: 'Content-Type, Accept, Authorization',
});
```

## Adding Custom Origins

To add your own origin (e.g., production URL):

1. Open `src/main.ts`
2. Add your URL to the `origin` array:

```typescript
origin: [
  'http://localhost:3000',
  'https://your-production-domain.com',  // Add this
],
```

## Testing CORS

### From Browser Console

```javascript
fetch('http://localhost:3000/items')
  .then(res => res.json())
  .then(data => console.log(data));
```

### With curl

```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3000/items
```

You should see `Access-Control-Allow-Origin` in the response headers.

## Environment-based CORS

For production, you may want to use environment variables:

```typescript
// src/main.ts
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
});
```

Then in your `.env`:
```
ALLOWED_ORIGINS=https://myapp.com,https://www.myapp.com
```

## Troubleshooting

### "CORS error" still appearing?

1. Make sure the NestJS app is running
2. Check that your frontend URL matches one in the `origin` array
3. Restart the NestJS server after changing CORS config
4. Clear browser cache

### Wildcard CORS (Not Recommended for Production)

For development only, you can allow all origins:

```typescript
app.enableCors();  // Allows all origins
```

⚠️ **Warning:** Never use this in production!

## Using with Next.js

If you created a Next.js project with create-project:

1. Your Next.js app runs on port 3000 (already allowed)
2. Your NestJS API runs on port 3000 (this project)
3. Update Next.js `.env.local`:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   ```
4. No additional CORS configuration needed!

## Learn More

- [NestJS CORS Documentation](https://docs.nestjs.com/security/cors)
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
