# 🔍 DIAGNÓSTICO COMPLETO DEL FRONTEND POSTIZ

**Fecha:** 29 de Diciembre, 2025  
**Proyecto:** postiz-app (motivated-blessing en Railway)  
**Problema:** Pantalla en blanco en producción

---

## 📋 HALLAZGOS PRINCIPALES

### 1. ✅ CONFIGURACIÓN DE NEXT.JS

**Archivo:** `apps/frontend/next.config.js`

#### Configuración encontrada:
```javascript
- Next.js con Sentry integration
- productionBrowserSourceMaps: true
- reactStrictMode: false
- proxyTimeout: 90_000ms
- transpilePackages: ['crypto-hash']
- Images: permite todos los dominios (http/https)
- Redirects: /api/uploads → /uploads (si STORAGE_PROVIDER=local)
- Rewrites: /uploads → /api/uploads
```

#### ⚠️ PROBLEMAS DETECTADOS:

1. **NO hay basePath ni assetPrefix configurado**
   - ✅ Esto está bien si el frontend está en el root
   - ⚠️ Problema si Railway espera un path diferente

2. **Sentry puede estar fallando el build**
   - Requiere: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`
   - Si faltan, usa config sin Sentry (correcto)
   - ⚠️ Pero puede estar causando warnings que rompen el build

3. **Muchas dependencias de variables de entorno**
   - `NEXT_PUBLIC_BACKEND_URL` - CRÍTICO
   - `FRONTEND_URL` - CRÍTICO
   - `STORAGE_PROVIDER` - Afecta uploads
   - `STRIPE_PUBLISHABLE_KEY` - Afecta Plausible
   - Y 20+ más...

---

### 2. 🔍 MIDDLEWARE ANALYSIS

**Archivo:** `apps/frontend/src/middleware.ts`

#### Comportamiento:
```typescript
1. Excluye: /api/, /uploads/, /p/, /icons/
2. Requiere cookie 'auth' para todas las rutas excepto /auth
3. Si NO hay auth → redirect a /auth
4. Si hay auth en /auth → redirect a /
5. Si path = '/' → redirect a /launches o /analytics
```

#### ⚠️ PROBLEMA CRÍTICO:
**El middleware redirige TODO a /auth si no hay cookie**

Esto significa:
- Primera visita → redirect a /auth/login
- Si /auth/login falla → loop infinito
- Si backend no responde → pantalla en blanco

---

### 3. 📁 ESTRUCTURA DE RUTAS

```
apps/frontend/src/app/
├── (app)/
│   ├── (site)/
│   │   ├── analytics/page.tsx
│   │   ├── launches/page.tsx
│   │   ├── third-party/page.tsx
│   │   ├── integrations/social/[provider]/page.tsx
│   │   ├── media/page.tsx
│   │   ├── settings/page.tsx
│   │   └── billing/page.tsx
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── forgot/[token]/page.tsx
│   │   └── activate/[code]/page.tsx
│   └── api/uploads/[[...path]]/route.ts
├── (extension)/
│   └── modal/[style]/[platform]/page.tsx
└── health/page.tsx (✅ RECIÉN CREADO)
```

#### ✅ Rutas disponibles:
- `/auth/login` - Login page
- `/launches` - Main app (requiere auth)
- `/analytics` - Analytics (requiere auth)
- `/third-party` - Integrations (requiere auth)
- `/health` - Health check (✅ NO requiere auth)

---

### 4. 🔑 VARIABLES DE ENTORNO CRÍTICAS

#### Backend Connection:
```env
NEXT_PUBLIC_BACKEND_URL=https://postiz-app-production-b46f.up.railway.app
```
**Estado:** ⚠️ DEBE ESTAR CONFIGURADA

#### Frontend URL:
```env
FRONTEND_URL=https://motivated-blessing-production.up.railway.app
```
**Estado:** ⚠️ DEBE ESTAR CONFIGURADA (para cookies)

#### Storage:
```env
STORAGE_PROVIDER=local | cloudflare
NEXT_PUBLIC_UPLOAD_STATIC_DIRECTORY=/uploads
```

#### Auth:
```env
NOT_SECURED=true (para desarrollo local)
```

#### Sentry (Opcional):
```env
SENTRY_ORG=xxx
SENTRY_PROJECT=xxx
SENTRY_AUTH_TOKEN=xxx
NEXT_PUBLIC_SENTRY_DSN=xxx
```

#### Otras (Opcionales):
```env
STRIPE_PUBLISHABLE_KEY=xxx
NEXT_PUBLIC_DISCORD_SUPPORT=xxx
IS_GENERAL=true (para Postiz vs Gitroom)
POSTIZ_GENERIC_OAUTH=true
NEXT_PUBLIC_TOLT=xxx
NEXT_PUBLIC_FACEBOOK_PIXEL=xxx
```

---

## 🔥 CAUSAS PROBABLES DEL PROBLEMA

### Causa #1: Backend URL no configurada (CRÍTICO)
**Síntoma:** Pantalla en blanco
**Razón:** 
- Middleware intenta validar auth con backend
- Si `NEXT_PUBLIC_BACKEND_URL` no está configurada → fetch falla
- Error en middleware → Next.js no renderiza nada

**Solución:**
```bash
# En Railway (motivated-blessing)
NEXT_PUBLIC_BACKEND_URL=https://postiz-app-production-b46f.up.railway.app
```

---

### Causa #2: Build de Next.js falló
**Síntoma:** Pantalla en blanco
**Razón:**
- Error en build → `.next/` incompleto
- Railway sirve archivos corruptos
- Browser recibe HTML vacío

**Verificación:**
```bash
# En logs de Railway, buscar:
Error: Build failed
Error: Cannot find module
Error: Unexpected token
```

**Solución:**
```bash
# Rebuild desde cero
cd postiz-app/apps/frontend
rm -rf .next node_modules
pnpm install
pnpm build
```

---

### Causa #3: Sentry bloqueando el build
**Síntoma:** Build falla o tarda mucho
**Razón:**
- Sentry intenta subir sourcemaps
- Si faltan tokens → timeout
- Build se cancela

**Solución:**
```bash
# Opción 1: Configurar Sentry completo
SENTRY_ORG=xxx
SENTRY_PROJECT=xxx
SENTRY_AUTH_TOKEN=xxx

# Opción 2: Deshabilitar Sentry (más rápido)
# Eliminar estas variables de Railway
```

---

### Causa #4: Middleware loop infinito
**Síntoma:** Pantalla en blanco, muchos redirects
**Razón:**
- Usuario sin auth → redirect a /auth
- /auth no carga → redirect a /auth
- Loop infinito

**Verificación:**
```bash
# En browser console:
# Ver si hay muchos redirects (Network tab)
```

**Solución:**
```bash
# Verificar que /auth/login carga correctamente
curl https://motivated-blessing-production.up.railway.app/auth/login
```

---

### Causa #5: CORS o Cookie issues
**Síntoma:** Auth no funciona
**Razón:**
- Frontend en motivated-blessing.up.railway.app
- Backend en postiz-app-production.up.railway.app
- Cookies no se comparten entre dominios

**Solución:**
```bash
# Backend debe permitir CORS desde frontend
# En backend .env:
CORS_ORIGIN=https://motivated-blessing-production.up.railway.app
```

---

## 🧪 PLAN DE TESTING

### Test #1: Health Check (PRIORITARIO)

```bash
# Visitar la página de health que acabamos de crear:
https://motivated-blessing-production.up.railway.app/health

# ✅ Si carga → Frontend funciona, problema es de auth/middleware
# ❌ Si NO carga → Problema de build o deployment
```

---

### Test #2: Verificar Build Logs

```bash
# En Railway → motivated-blessing → Deployments → Latest
# Buscar:
1. "Build succeeded" o "Build failed"
2. Errores de TypeScript
3. Warnings de Sentry
4. "Error: Cannot find module"
5. Tiempo de build (>10min = problema)
```

---

### Test #3: Verificar Variables de Entorno

```bash
# En Railway → motivated-blessing → Variables
# Verificar que existan:

✅ NEXT_PUBLIC_BACKEND_URL=https://postiz-app-production-b46f.up.railway.app
✅ FRONTEND_URL=https://motivated-blessing-production.up.railway.app
✅ NODE_ENV=production
⚠️ STORAGE_PROVIDER=local (o cloudflare)
⚠️ DATABASE_URL=postgresql://... (si el frontend la necesita)
```

---

### Test #4: Inspeccionar HTML

```bash
# Desde tu terminal:
curl https://motivated-blessing-production.up.railway.app > output.html

# Buscar en output.html:
1. ¿Hay contenido en <body>?
2. ¿Hay <script src="/_next/static/...">?
3. ¿Hay errores inline?
4. ¿El <title> es correcto?
```

---

### Test #5: Test Local

```bash
# En tu máquina:
cd postiz-app/apps/frontend

# Crear .env local:
cat > .env.local << EOF
NEXT_PUBLIC_BACKEND_URL=https://postiz-app-production-b46f.up.railway.app
FRONTEND_URL=http://localhost:4200
NODE_ENV=development
NOT_SECURED=true
EOF

# Build y start:
pnpm build
pnpm start

# Visitar:
http://localhost:4200/health
http://localhost:4200/auth/login

# ✅ Si funciona local → problema de config en Railway
# ❌ Si NO funciona local → problema de código
```

---

### Test #6: Verificar Backend Connection

```bash
# Verificar que el backend responde:
curl https://postiz-app-production-b46f.up.railway.app/api

# Debería devolver algo (JSON o HTML)
# Si devuelve 404 o timeout → backend no está correcto
```

---

### Test #7: Browser DevTools

```bash
# Abrir https://motivated-blessing-production.up.railway.app
# Abrir DevTools (F12)

# Console tab:
# - ¿Hay errores de JavaScript?
# - ¿Hay errores de CORS?
# - ¿Hay errores de fetch?

# Network tab:
# - ¿Los archivos .js se cargan?
# - ¿Hay 404s?
# - ¿Hay redirects infinitos?

# Application tab → Cookies:
# - ¿Se crea la cookie 'auth'?
```

---

## 🔧 SOLUCIONES PROPUESTAS

### Solución #1: Configurar Variables de Entorno (PRIORITARIO)

```bash
# En Railway → motivated-blessing → Variables → Add Variable

# CRÍTICAS:
NEXT_PUBLIC_BACKEND_URL=https://postiz-app-production-b46f.up.railway.app
FRONTEND_URL=https://motivated-blessing-production.up.railway.app

# RECOMENDADAS:
NODE_ENV=production
STORAGE_PROVIDER=local
IS_GENERAL=true

# Después de agregar → Redeploy
```

---

### Solución #2: Rebuild Limpio

```bash
# En Railway → motivated-blessing → Settings
# Scroll down → "Clear Build Cache"
# Después → "Redeploy"

# O desde CLI:
railway up --service motivated-blessing
```

---

### Solución #3: Deshabilitar Sentry Temporalmente

```bash
# En Railway → motivated-blessing → Variables
# Eliminar (si existen):
- SENTRY_ORG
- SENTRY_PROJECT
- SENTRY_AUTH_TOKEN
- NEXT_PUBLIC_SENTRY_DSN

# Redeploy
```

---

### Solución #4: Simplificar Middleware

**Archivo:** `apps/frontend/src/middleware.ts`

```typescript
// TEMPORAL: Bypass auth check para debugging
export async function middleware(request: NextRequest) {
  // Permitir /health sin auth
  if (request.nextUrl.pathname === '/health') {
    return NextResponse.next();
  }
  
  // Permitir /auth sin auth
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next();
  }
  
  // TODO: Resto del middleware...
}
```

---

### Solución #5: Configurar CORS en Backend

**Archivo:** `apps/backend/src/main.ts`

```typescript
app.enableCors({
  origin: [
    'https://motivated-blessing-production.up.railway.app',
    'http://localhost:4200'
  ],
  credentials: true
});
```

---

## 📊 CHECKLIST DE DIAGNÓSTICO

### Railway Deployment
- [ ] Build logs no muestran errores
- [ ] Build time < 5 minutos
- [ ] Deploy status = "Success"
- [ ] Service está "Running"

### Variables de Entorno
- [ ] `NEXT_PUBLIC_BACKEND_URL` configurada
- [ ] `FRONTEND_URL` configurada
- [ ] `NODE_ENV=production`
- [ ] No hay variables conflictivas

### Testing
- [ ] `/health` carga correctamente
- [ ] `/auth/login` carga correctamente
- [ ] HTML tiene contenido en `<body>`
- [ ] Scripts de Next.js están presentes
- [ ] No hay errores en browser console

### Backend Connection
- [ ] Backend responde en `/api`
- [ ] CORS configurado correctamente
- [ ] Cookies se pueden crear

---

## 🎯 PRÓXIMOS PASOS

### Paso 1: Verificar Health Check
```bash
# Visitar:
https://motivated-blessing-production.up.railway.app/health

# Si carga → ✅ Frontend funciona
# Si NO carga → ❌ Problema de build/deployment
```

### Paso 2: Revisar Logs de Railway
```bash
# Railway → motivated-blessing → Deployments → Latest → View Logs
# Copiar últimas 100 líneas
# Buscar errores
```

### Paso 3: Verificar Variables
```bash
# Railway → motivated-blessing → Variables
# Screenshot de todas las variables
# Comparar con las requeridas
```

### Paso 4: Test Local
```bash
cd postiz-app/apps/frontend
pnpm build
pnpm start
# Visitar http://localhost:4200/health
```

### Paso 5: Configurar Variables Faltantes
```bash
# Agregar las variables críticas
# Redeploy
# Verificar /health de nuevo
```

---

## 🚨 SI TODO FALLA

### Plan B: Desplegar Frontend en Vercel

```bash
# Vercel tiene mejor soporte para Next.js
cd postiz-app/apps/frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configurar variables en Vercel dashboard
# Apuntar al mismo backend de Railway
```

---

## 📝 COMANDOS ÚTILES

### Ver logs en tiempo real:
```bash
railway logs --service motivated-blessing
```

### Redeploy:
```bash
railway up --service motivated-blessing
```

### Ver variables:
```bash
railway variables --service motivated-blessing
```

### Agregar variable:
```bash
railway variables set NEXT_PUBLIC_BACKEND_URL=https://postiz-app-production-b46f.up.railway.app --service motivated-blessing
```

---

## ✅ HEALTH CHECK PAGE CREADA

**Archivo:** `apps/frontend/src/app/health/page.tsx`

**Ruta:** `/health`

**Características:**
- ✅ NO requiere autenticación (bypass middleware)
- ✅ Muestra estado del frontend
- ✅ Lista rutas disponibles
- ✅ Muestra variables de entorno
- ✅ HTML inline (no depende de CSS externo)

**Uso:**
```bash
# Después de deploy:
https://motivated-blessing-production.up.railway.app/health

# Debería mostrar:
✅ Frontend Working!
- Available Routes
- Environment Info
- BUILD_TIME
```

---

## 🎯 CONCLUSIÓN

**Problema más probable:** Variables de entorno faltantes

**Solución más rápida:**
1. Agregar `NEXT_PUBLIC_BACKEND_URL` en Railway
2. Agregar `FRONTEND_URL` en Railway
3. Redeploy
4. Verificar `/health`

**Si eso no funciona:**
1. Revisar logs de build
2. Verificar que backend responde
3. Test local para aislar el problema
4. Considerar Vercel como alternativa

---

**FIN DEL DIAGNÓSTICO** 🔍

