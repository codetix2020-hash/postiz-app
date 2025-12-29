# POSTIZ OAUTH CONFIGURATION GUIDE

## 🚨 ERROR ACTUAL: 401 en `/integrations/social/instagram`

**Causa:** Faltan las variables de entorno de OAuth para los social providers.

**Solución:** Configurar las variables de entorno en Railway (backend) según este documento.

---

## 📋 VARIABLES DE ENTORNO OBLIGATORIAS

### ✅ REDIS (CRÍTICO PARA OAUTH)

```env
REDIS_URL=redis://default:password@host:port
```

**¿Por qué?** El flujo OAuth guarda `state`, `codeVerifier` y `refresh` tokens temporalmente en Redis durante 5 minutos (300 segundos).

**Código:**
```typescript
// apps/backend/src/api/routes/integrations.controller.ts:226-236
await ioRedis.set(`refresh:${state}`, refresh, 'EX', 300);
await ioRedis.set(`login:${state}`, codeVerifier, 'EX', 300);
await ioRedis.set(`external:${state}`, JSON.stringify(getExternalUrl), 'EX', 300);
```

**Si no está configurado:** Postiz usa un MockRedis en memoria, pero esto NO funciona en producción con múltiples instancias.

---

## 🔗 CONFIGURACIÓN POR PLATAFORMA

### 1️⃣ INSTAGRAM (vía Facebook Business)

**Variables necesarias:**
```env
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

**Redirect URI:**
```
https://postiz-app-production-b46f.up.railway.app/integrations/social/instagram
```

**Configuración en Meta:**

1. Ve a: https://developers.facebook.com/apps
2. Crea una app → Tipo: "Business"
3. Agrega producto: "Facebook Login"
4. **Permisos necesarios (Scopes):**
   - `instagram_basic`
   - `pages_show_list`
   - `pages_read_engagement`
   - `business_management`
   - `instagram_content_publish`
   - `instagram_manage_comments`
   - `instagram_manage_insights`
5. **Configuración OAuth:**
   - Valid OAuth Redirect URIs: `https://postiz-app-production-b46f.up.railway.app/integrations/social/instagram`
6. **Importante:**
   - La cuenta de Instagram debe ser una cuenta de **Business**
   - Debe estar conectada a una **página de Facebook**

**Archivo de código:** `libraries/nestjs-libraries/src/integrations/social/instagram.provider.ts:345-364`

---

### 2️⃣ INSTAGRAM STANDALONE

**Variables necesarias:**
```env
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
```

**Redirect URI:**
```
https://postiz-app-production-b46f.up.railway.app/integrations/social/instagram-standalone
```

**Configuración:**
1. Usa la misma app de Meta que Instagram normal
2. Este método es para cuentas de Instagram sin página de Facebook

**Archivo de código:** `libraries/nestjs-libraries/src/integrations/social/instagram.standalone.provider.ts:104-130`

---

### 3️⃣ TIKTOK

**Variables necesarias:**
```env
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

**Redirect URI:**
```
https://postiz-app-production-b46f.up.railway.app/integrations/social/tiktok
```

**Configuración en TikTok:**

1. Ve a: https://developers.tiktok.com/
2. Crea una app → Tipo: "Web App"
3. **Permisos necesarios (Scopes):**
   - `user.info.basic`
   - `video.publish`
   - `video.upload`
   - `user.info.profile`
4. **Configuración OAuth:**
   - Redirect URI: `https://postiz-app-production-b46f.up.railway.app/integrations/social/tiktok`
5. **Importante:**
   - TikTok tiene límites estrictos de subida de video (maxConcurrentJob = 1)

**Archivo de código:** `libraries/nestjs-libraries/src/integrations/social/tiktok.provider.ts:294-304`

---

### 4️⃣ LINKEDIN

**Variables necesarias:**
```env
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

**Redirect URI:**
```
https://postiz-app-production-b46f.up.railway.app/integrations/social/linkedin
```

**Configuración en LinkedIn:**

1. Ve a: https://www.linkedin.com/developers/apps
2. Crea una app → Tipo: "Marketing Developer Platform"
3. **Permisos necesarios (Scopes):**
   - `openid`
   - `profile`
   - `w_member_social`
   - `r_basicprofile`
   - `rw_organization_admin`
   - `w_organization_social`
   - `r_organization_social`
4. **Configuración OAuth:**
   - Authorized redirect URLs: `https://postiz-app-production-b46f.up.railway.app/integrations/social/linkedin`
5. **Importante:**
   - LinkedIn usa tokens de un solo uso (oneTimeToken = true)
   - Requiere espera de 10 segundos después de refresh (refreshWait = true)

**Archivo de código:** `libraries/nestjs-libraries/src/integrations/social/linkedin.provider.ts:57-100`

---

### 5️⃣ TWITTER / X

**Variables necesarias:**
```env
X_API_KEY=your_twitter_api_key
X_API_SECRET=your_twitter_api_secret
```

**Redirect URI:**
```
https://postiz-app-production-b46f.up.railway.app/integrations/social/x
```

**Configuración en Twitter:**

1. Ve a: https://developer.twitter.com/en/portal/dashboard
2. Crea una app → Tipo: "Standalone App"
3. **Permisos necesarios:**
   - Read and Write access
4. **Configuración OAuth:**
   - Callback URL: `https://postiz-app-production-b46f.up.railway.app/integrations/social/x`
5. **Importante:**
   - Usa OAuth 1.0a (no OAuth 2.0)
   - Copia API Key y API Secret (no confundir con Bearer Token)

**Archivo de código:** `libraries/nestjs-libraries/src/integrations/social/x.provider.ts:228-240`

---

### 6️⃣ FACEBOOK PAGE

**Variables necesarias:**
```env
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

**Redirect URI:**
```
https://postiz-app-production-b46f.up.railway.app/integrations/social/facebook
```

**Configuración en Meta:**

1. Usa la misma app que Instagram
2. **Permisos necesarios (Scopes):**
   - `pages_show_list`
   - `business_management`
   - `pages_manage_posts`
   - `pages_manage_engagement`
   - `pages_read_engagement`
   - `read_insights`
3. **Importante:**
   - Permite publicar en páginas de Facebook administradas

**Archivo de código:** `libraries/nestjs-libraries/src/integrations/social/facebook.provider.ts:170-223`

---

### 7️⃣ THREADS

**Variables necesarias:**
```env
THREADS_APP_ID=your_threads_app_id
THREADS_APP_SECRET=your_threads_app_secret
```

**Redirect URI:**
```
https://postiz-app-production-b46f.up.railway.app/integrations/social/threads
```

**Configuración:**
1. Usa la misma app de Meta (Facebook)
2. Agrega producto: "Threads"
3. Redirect URI en configuración de Threads

**Archivo de código:** `libraries/nestjs-libraries/src/integrations/social/threads.provider.ts:85-104`

---

### 8️⃣ YOUTUBE

**Variables necesarias:**
```env
YOUTUBE_CLIENT_ID=your_google_client_id
YOUTUBE_CLIENT_SECRET=your_google_client_secret
```

**Redirect URI:**
```
https://postiz-app-production-b46f.up.railway.app/integrations/social/youtube
```

**Configuración en Google Cloud:**

1. Ve a: https://console.cloud.google.com/
2. Crea proyecto → Habilita "YouTube Data API v3"
3. **Configuración OAuth:**
   - Authorized redirect URIs: `https://postiz-app-production-b46f.up.railway.app/integrations/social/youtube`
4. **Importante:**
   - Requiere verificación de app por Google si es producción

**Archivo de código:** `libraries/nestjs-libraries/src/integrations/social/youtube.provider.ts:25-26`

---

### 9️⃣ REDDIT

**Variables necesarias:**
```env
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
```

**Redirect URI:**
```
https://postiz-app-production-b46f.up.railway.app/integrations/social/reddit
```

**Configuración en Reddit:**

1. Ve a: https://www.reddit.com/prefs/apps
2. Crea una app → Tipo: "web app"
3. Redirect URI: usa el de arriba

**Archivo de código:** `libraries/nestjs-libraries/src/integrations/social/reddit.provider.ts:44-77`

---

## 🔧 OTRAS VARIABLES NECESARIAS

### FRONTEND_URL (CRÍTICO)
```env
FRONTEND_URL=https://motivated-blessing-production.up.railway.app
```

**¿Por qué?** Se usa para construir las redirect URIs en el flujo OAuth.

**Código:**
```typescript
// Ejemplo: tiktok.provider.ts:299-303
redirect_uri: `${process?.env?.FRONTEND_URL}/integrations/social/tiktok`
```

---

## ⚠️ TROUBLESHOOTING

### Error 401 en OAuth

**Posibles causas:**

1. **Redis no configurado:**
   ```
   Error: State no encontrado en Redis
   Solución: Configurar REDIS_URL
   ```

2. **Variables de entorno faltantes:**
   ```
   Error: process.env.FACEBOOK_APP_ID is undefined
   Solución: Agregar FACEBOOK_APP_ID y FACEBOOK_APP_SECRET
   ```

3. **Redirect URI no coincide:**
   ```
   Error: redirect_uri_mismatch
   Solución: Asegurarse que el redirect URI en la app coincida EXACTAMENTE
   ```

4. **Permisos (scopes) incorrectos:**
   ```
   Error: NotEnoughScopes
   Solución: Verificar que la app tenga todos los scopes listados
   ```

### Verificar logs en Railway

1. Railway → postiz-app (backend) → Deployments → Latest → Logs
2. Buscar:
   ```
   401
   instagram
   oauth
   redis
   ```

---

## 📝 CHECKLIST DE CONFIGURACIÓN

### Paso 1: Redis
- [ ] Crear base de datos Redis en Railway
- [ ] Copiar URL de conexión
- [ ] Agregar variable `REDIS_URL` en Railway (backend)

### Paso 2: Instagram
- [ ] Crear app en developers.facebook.com
- [ ] Agregar permisos de Instagram
- [ ] Configurar redirect URI
- [ ] Copiar App ID y App Secret
- [ ] Agregar variables en Railway:
  - `FACEBOOK_APP_ID`
  - `FACEBOOK_APP_SECRET`

### Paso 3: TikTok
- [ ] Crear app en developers.tiktok.com
- [ ] Agregar permisos de video
- [ ] Configurar redirect URI
- [ ] Copiar Client Key y Client Secret
- [ ] Agregar variables en Railway:
  - `TIKTOK_CLIENT_ID`
  - `TIKTOK_CLIENT_SECRET`

### Paso 4: LinkedIn
- [ ] Crear app en linkedin.com/developers
- [ ] Agregar permisos necesarios
- [ ] Configurar redirect URI
- [ ] Copiar Client ID y Client Secret
- [ ] Agregar variables en Railway:
  - `LINKEDIN_CLIENT_ID`
  - `LINKEDIN_CLIENT_SECRET`

### Paso 5: Twitter/X
- [ ] Crear app en developer.twitter.com
- [ ] Configurar permisos Read and Write
- [ ] Configurar callback URL
- [ ] Copiar API Key y API Secret
- [ ] Agregar variables en Railway:
  - `X_API_KEY`
  - `X_API_SECRET`

### Paso 6: Verificar
- [ ] `FRONTEND_URL` está configurado
- [ ] Todas las variables están en Railway
- [ ] Redeploy del backend
- [ ] Test OAuth desde el frontend

---

## 🚀 CONFIGURACIÓN RÁPIDA (MÍNIMO VIABLE)

Si solo quieres que funcione rápido, configura **SOLO ESTAS**:

```env
# CRÍTICO
REDIS_URL=redis://...
FRONTEND_URL=https://motivated-blessing-production.up.railway.app

# Instagram (lo más común)
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
```

Esto hará que al menos Instagram funcione. Las demás plataformas darán error hasta que se configuren.

---

## 📚 REFERENCIAS

### Código relevante:
- `apps/backend/src/api/routes/integrations.controller.ts` - Controlador OAuth
- `libraries/nestjs-libraries/src/redis/redis.service.ts` - Configuración Redis
- `libraries/nestjs-libraries/src/integrations/social/*.provider.ts` - Providers individuales

### Documentación oficial:
- Meta (Instagram/Facebook): https://developers.facebook.com/docs/
- TikTok: https://developers.tiktok.com/doc/
- LinkedIn: https://learn.microsoft.com/en-us/linkedin/
- Twitter: https://developer.twitter.com/en/docs

---

## ❓ FAQ

**P: ¿Por qué 401?**
R: El endpoint `/integrations/social/instagram` requiere autenticación. El 401 probablemente viene de que las variables de OAuth no están configuradas o Redis no funciona.

**P: ¿Necesito todas las plataformas?**
R: No. Solo configura las que quieras usar. Las no configuradas simplemente no aparecerán o darán error al intentar conectar.

**P: ¿Qué pasa si no configuro Redis?**
R: Postiz usará MockRedis (en memoria), pero el OAuth fallará porque el state no se guarda entre requests.

**P: ¿Cuánto cuesta cada app?**
R: Todas son gratis para desarrollo. En producción:
- Meta (Instagram/Facebook): Gratis
- TikTok: Gratis (límites estrictos)
- LinkedIn: Gratis
- Twitter: Gratis (Basic) o $100/mes (Pro)
- YouTube: Gratis

---

**Última actualización:** 2025-12-30

