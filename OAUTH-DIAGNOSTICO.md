# DIAGNÓSTICO OAUTH - ERROR 401

## 🔴 PROBLEMA IDENTIFICADO

**Error:** `401 Unauthorized` en `/integrations/social/instagram`

**Endpoint:** 
```
GET https://postiz-app-production-b46f.up.railway.app/integrations/social/instagram
```

---

## 🔍 ANÁLISIS DE CÓDIGO

### 1. Flujo OAuth en Postiz

**Archivo:** `apps/backend/src/api/routes/integrations.controller.ts:193-242`

```typescript
@Get('/social/:integration')
@CheckPolicies([AuthorizationActions.Create, Sections.CHANNEL])
async getIntegrationUrl(
  @Param('integration') integration: string,
  @Query('refresh') refresh: string,
  @Query('externalUrl') externalUrl: string
) {
  // 1. Verifica que la integración está permitida
  if (!this._integrationManager.getAllowedSocialsIntegrations().includes(integration)) {
    throw new Error('Integration not allowed');
  }

  // 2. Obtiene el provider (InstagramProvider)
  const integrationProvider = this._integrationManager.getSocialIntegration(integration);

  // 3. Genera la URL de autorización
  const { codeVerifier, state, url } = await integrationProvider.generateAuthUrl();

  // 4. GUARDA EN REDIS (AQUÍ ES DONDE FALLA SI NO HAY REDIS)
  await ioRedis.set(`refresh:${state}`, refresh, 'EX', 300);
  await ioRedis.set(`login:${state}`, codeVerifier, 'EX', 300);
  await ioRedis.set(`external:${state}`, JSON.stringify(getExternalUrl), 'EX', 300);

  return { url };
}
```

**Problema:** El decorador `@CheckPolicies([AuthorizationActions.Create, Sections.CHANNEL])` requiere autenticación.

---

## ⚠️ CAUSAS DEL ERROR 401

### Causa #1: No hay autenticación en el request

**Tu frontend llama:**
```typescript
const url = `${BACKEND_URL}/integrations/social/${provider}`;
window.open(url, '_blank', 'width=600,height=700');
```

**Pero no envía:**
- Cookie `auth`
- Header `Authorization`

**Solución:** El frontend debe estar autenticado ANTES de intentar conectar integraciones.

---

### Causa #2: Variables de entorno faltantes

**Instagram Provider necesita:**
```typescript
// instagram.provider.ts:345-352
const getAccessToken = await fetch(
  'https://graph.facebook.com/v20.0/oauth/access_token' +
  `?client_id=${process.env.FACEBOOK_APP_ID}` +  // ❌ undefined
  `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +  // ❌ undefined
  `&code=${params.code}`
).json();
```

**Si estas variables no están configuradas:** El OAuth fallará más adelante (aunque pase el 401).

---

### Causa #3: Redis no configurado

**Redis es CRÍTICO para OAuth:**
```typescript
// integrations.controller.ts:230
await ioRedis.set(`login:${state}`, codeVerifier, 'EX', 300);
```

**Si `REDIS_URL` no está configurado:**
- Se usa MockRedis (en memoria)
- El `state` se pierde entre requests
- El callback OAuth fallará con "Invalid state"

---

## ✅ SOLUCIONES

### Solución #1: Arreglar el Frontend (TEMPORAL)

**Cambio en dashboard.tsx:**

```typescript
const handleConnectIntegration = async (provider: string) => {
  try {
    // Obtener URL de OAuth del backend CON autenticación
    const response = await fetch(`${BACKEND_URL}/integrations/social/${provider}`, {
      headers: {
        'Authorization': `Bearer ${POSTIZ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get OAuth URL: ${response.status}`);
    }
    
    const { url } = await response.json();
    
    // Abrir URL de OAuth
    window.open(url, '_blank', 'width=600,height=700');
  } catch (err) {
    console.error('Error connecting integration:', err);
    alert('Failed to connect. Please check backend logs.');
  }
};
```

**Problema de esta solución:** No es la forma correcta. El endpoint espera un usuario autenticado, no un API key.

---

### Solución #2: Usar el endpoint público (RECOMENDADO)

**Cambio en el backend:**

Crear un endpoint público que no requiera auth:

```typescript
// apps/backend/src/public-api/routes/v1/v1.controller.ts

@Get('/integrations/:provider/auth')
async getIntegrationAuthUrl(
  @GetOrgFromRequest() org: Organization,
  @Param('provider') provider: string
) {
  const integrationProvider = this._integrationManager.getSocialIntegration(provider);
  
  const { codeVerifier, state, url } = await integrationProvider.generateAuthUrl();
  
  await ioRedis.set(`refresh:${state}`, org.id, 'EX', 300);
  await ioRedis.set(`login:${state}`, codeVerifier, 'EX', 300);
  
  return { url };
}
```

**Frontend usa:**
```typescript
const response = await fetch(`${BACKEND_URL}/public/v1/integrations/${provider}/auth`, {
  headers: {
    'Authorization': `Bearer ${POSTIZ_API_KEY}`,
  },
});
```

---

### Solución #3: Bypass auth para testing (SOLO DESARROLLO)

**Modificar el decorador:**

```typescript
// apps/backend/src/api/routes/integrations.controller.ts:193
@Get('/social/:integration')
// @CheckPolicies([AuthorizationActions.Create, Sections.CHANNEL])  // ❌ Comentar esto
async getIntegrationUrl(...) {
  // ...
}
```

**⚠️ NO HACER ESTO EN PRODUCCIÓN**

---

## 🔧 CONFIGURACIÓN NECESARIA EN RAILWAY

### Backend (postiz-app)

```env
# CRÍTICO para OAuth
REDIS_URL=redis://default:password@host:port

# Necesario para construir redirect URIs
FRONTEND_URL=https://motivated-blessing-production.up.railway.app

# Instagram (vía Facebook)
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here

# TikTok
TIKTOK_CLIENT_ID=your_client_id_here
TIKTOK_CLIENT_SECRET=your_client_secret_here

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here

# Twitter/X
X_API_KEY=your_api_key_here
X_API_SECRET=your_api_secret_here
```

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### PASO 1: Configurar Redis (5 minutos)

1. Railway → New → Database → Redis
2. Copiar URL de conexión
3. Railway → postiz-app → Variables → Add:
   ```
   REDIS_URL=redis://...
   ```
4. Redeploy backend

### PASO 2: Configurar Instagram (15 minutos)

1. Ir a: https://developers.facebook.com/apps
2. Crear app → Tipo: Business
3. Agregar producto: Facebook Login
4. Configurar:
   - Valid OAuth Redirect URIs: `https://postiz-app-production-b46f.up.railway.app/integrations/social/instagram`
   - Permisos: `instagram_basic`, `pages_show_list`, `instagram_content_publish`, etc.
5. Copiar App ID y App Secret
6. Railway → postiz-app → Variables → Add:
   ```
   FACEBOOK_APP_ID=...
   FACEBOOK_APP_SECRET=...
   ```
7. Redeploy backend

### PASO 3: Arreglar Frontend (10 minutos)

Opción A: Usar la solución temporal del paso "Solución #1"

Opción B: Esperar a que el backend tenga un endpoint público

### PASO 4: Test

1. Abrir: https://motivated-blessing-production.up.railway.app
2. Click en "Conectar Instagram"
3. Debería abrir popup de OAuth de Facebook
4. Autorizar
5. Verificar que la integración aparece en "Integraciones Conectadas"

---

## 📊 VERIFICACIÓN DE LOGS

### Cómo ver el error exacto:

1. Railway → postiz-app (backend) → Deployments → Latest → Logs
2. Buscar líneas con:
   ```
   401
   instagram
   integrations
   ```

### Errores comunes:

**Error 1:**
```
Error: Integration not allowed
```
→ El provider no está en la lista de permitidos

**Error 2:**
```
TypeError: Cannot read property 'FACEBOOK_APP_ID' of undefined
```
→ Variables de entorno no configuradas

**Error 3:**
```
Error: Invalid state
```
→ Redis no configurado o el state expiró (300 segundos)

**Error 4:**
```
401 Unauthorized
```
→ Request sin autenticación (problema actual)

---

## 📝 RESUMEN

| Problema | Estado | Solución |
|----------|--------|----------|
| ❌ 401 en OAuth endpoint | **BLOQUEANTE** | Implementar endpoint público o arreglar autenticación |
| ❌ Redis no configurado | **CRÍTICO** | Configurar `REDIS_URL` en Railway |
| ❌ Variables OAuth faltantes | **BLOQUEANTE** | Configurar apps en Meta, TikTok, etc. |
| ⚠️ Frontend sin auth | **IMPORTANTE** | El frontend no tiene sistema de autenticación |

---

## 🚀 ACCIÓN INMEDIATA

**OPCIÓN RÁPIDA (30 minutos):**

1. Configurar Redis en Railway
2. Configurar Instagram OAuth (Meta app)
3. Crear endpoint público temporal:

```typescript
// apps/backend/src/public-api/routes/v1/public.integrations.controller.ts

@Get('/oauth/:provider/url')
async getOAuthUrl(
  @GetOrgFromRequest() org: Organization,
  @Param('provider') provider: string
) {
  const integrationProvider = this._integrationManager.getSocialIntegration(provider);
  const { url } = await integrationProvider.generateAuthUrl();
  return { url };
}
```

4. Frontend usa: `GET /public/v1/oauth/instagram/url`

**Esto bypasea el problema de auth y permite que el OAuth funcione.**

---

**Diagnóstico completado: 2025-12-30**

