# 🔍 DIAGNÓSTICO: Problema de Login en Postiz

## 📋 ESTADO ACTUAL

- **Frontend:** https://motivated-blessing-production.up.railway.app
- **Backend:** https://postiz-app-production-b46f.up.railway.app
- **Problema:** Login se queda cargando sin entrar

## 🔍 ANÁLISIS DEL PROBLEMA

### 1. Sistema de Autenticación

Postiz **NO usa NextAuth**, usa un sistema JWT personalizado:
- Backend genera JWT y lo envía como cookie `auth`
- Frontend lee la cookie `auth` del middleware
- Las cookies se configuran con dominio específico

### 2. Problema Identificado: Cookies Cross-Domain

El problema principal es que **frontend y backend están en dominios diferentes**:
- Frontend: `motivated-blessing-production.up.railway.app`
- Backend: `postiz-app-production-b46f.up.railway.app`

**Las cookies NO se pueden compartir entre dominios diferentes** a menos que:
1. Se use `sameSite: 'none'` + `secure: true` (ya está configurado)
2. El frontend haga peticiones con `credentials: 'include'`
3. El backend tenga CORS configurado correctamente

### 3. Función `getCookieUrlFromDomain`

```typescript
export function getCookieUrlFromDomain(domain: string) {
  const url = parse(domain);
  return url.domain! ? '.' + url.domain! : url.hostname!;
}
```

Con `FRONTEND_URL=https://motivated-blessing-production.up.railway.app`:
- Extrae: `.up.railway.app` o `motivated-blessing-production.up.railway.app`
- Esto debería funcionar si ambos están en `*.up.railway.app`

### 4. Variables de Entorno Actuales

**Backend:**
- `FRONTEND_URL=https://motivated-blessing-production.up.railway.app` ✅
- `NEXTAUTH_URL` - NO se usa (sistema JWT personalizado)
- `JWT_SECRET` ✅
- `NEXTAUTH_SECRET` - NO se usa

**Frontend:**
- `NEXT_PUBLIC_BACKEND_URL=https://postiz-app-production-b46f.up.railway.app` ✅
- `NEXTAUTH_URL` - NO se usa
- `JWT_SECRET` - NO necesario en frontend
- `NEXTAUTH_SECRET` - NO se usa

## 🐛 PROBLEMAS POTENCIALES

### Problema 1: CORS no configurado

El backend debe permitir requests del frontend con cookies.

**Solución:** Verificar CORS en `apps/backend/src/main.ts`

### Problema 2: Cookies no se envían en fetch

El frontend debe hacer fetch con `credentials: 'include'`.

**Verificar:** `libraries/helpers/src/utils/custom.fetch.tsx`

### Problema 3: Dominio de cookies incorrecto

Si `getCookieUrlFromDomain` devuelve un dominio incorrecto, las cookies no se establecen.

**Solución:** Verificar que devuelva `.up.railway.app` o el dominio correcto

### Problema 4: `NOT_SECURED` no configurado

Si `NOT_SECURED` no está en `true`, las cookies requieren HTTPS y `sameSite: 'none'`.

**Solución:** Agregar `NOT_SECURED=true` en Railway (o configurar correctamente)

## ✅ SOLUCIONES

### Solución 1: Agregar CORS al Backend (RECOMENDADO)

Verificar/agregar en `apps/backend/src/main.ts`:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'auth', 'showorg'],
});
```

### Solución 2: Verificar `custom.fetch` incluye credentials

En `libraries/helpers/src/utils/custom.fetch.tsx` debe tener:

```typescript
fetch(url, {
  ...options,
  credentials: 'include', // IMPORTANTE
  headers: {
    ...headers,
  },
});
```

### Solución 3: Agregar variable `NOT_SECURED` (TEMPORAL)

En Railway Backend, agregar:
```
NOT_SECURED=true
```

Esto permite cookies sin `secure: true` (solo para testing).

### Solución 4: Verificar dominio de cookies

Agregar logs en backend para ver qué dominio se está usando:

```typescript
const cookieDomain = getCookieUrlFromDomain(process.env.FRONTEND_URL!);
console.log('Cookie domain:', cookieDomain);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
```

## 🔧 SOLUCIÓN ALTERNATIVA: Script SQL Directo

Si el login no funciona, puedes crear usuarios directamente en la BD:

```sql
-- Ver estructura de usuarios
SELECT * FROM users LIMIT 1;

-- Crear usuario (necesitas hash de password)
-- Usar bcrypt para generar hash de password
```

O usar el script TypeScript en `scripts/create-test-integrations.ts` como referencia.

## 📝 CHECKLIST DE VERIFICACIÓN

- [ ] CORS configurado en backend con `credentials: true`
- [ ] `custom.fetch` usa `credentials: 'include'`
- [ ] `FRONTEND_URL` correcto en backend
- [ ] `NEXT_PUBLIC_BACKEND_URL` correcto en frontend
- [ ] `NOT_SECURED=true` en backend (temporal) o cookies con `secure: true`
- [ ] Dominio de cookies correcto (`.up.railway.app`)
- [ ] Backend responde correctamente a `/auth/login`
- [ ] Frontend puede hacer requests al backend

## 🚀 PRÓXIMOS PASOS

1. Verificar CORS en backend
2. Verificar `custom.fetch` incluye credentials
3. Agregar logs para debug
4. Probar login nuevamente
5. Si no funciona, usar script SQL directo para crear usuarios

