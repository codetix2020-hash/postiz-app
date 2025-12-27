# ✅ SOLUCIÓN: Problema de Login en Postiz

## 🔍 PROBLEMA IDENTIFICADO

El login se queda cargando porque **las cookies no se están estableciendo correctamente** entre frontend y backend en dominios diferentes.

### Causa Raíz:

1. **CORS con credentials:** El backend solo habilita `credentials: true` si `NOT_SECURED` NO está definido
2. **Cookies cross-domain:** Requieren `sameSite: 'none'` + `secure: true` + CORS con credentials
3. **Dominio de cookies:** Puede estar incorrecto si `getCookieUrlFromDomain` no funciona bien

## ✅ SOLUCIÓN 1: Configurar Variables de Entorno Correctamente

### En Railway Backend (postiz-app-production-b46f):

**MANTENER:**
```
FRONTEND_URL=https://motivated-blessing-production.up.railway.app
BACKEND_INTERNAL_URL=https://postiz-app-production-b46f.up.railway.app
JWT_SECRET=A7xK9mP2qR5tY8wE3vN6bC1fH4jL0sD9
```

**ELIMINAR (si existen):**
```
NEXTAUTH_URL (no se usa)
NEXTAUTH_SECRET (no se usa)
NOT_SECURED (solo si quieres cookies sin secure)
```

**AGREGAR (si no existe):**
```
NOT_SECURED=false
```

### En Railway Frontend (motivated-blessing):

**MANTENER:**
```
NEXT_PUBLIC_BACKEND_URL=https://postiz-app-production-b46f.up.railway.app
PORT=4200
```

**ELIMINAR (si existen):**
```
NEXTAUTH_URL (no se usa)
NEXTAUTH_SECRET (no se usa)
JWT_SECRET (no necesario en frontend)
```

## ✅ SOLUCIÓN 2: Verificar CORS en Backend

El código en `apps/backend/src/main.ts` línea 23 tiene:

```typescript
cors: {
  ...(!process.env.NOT_SECURED ? { credentials: true } : {}),
  // ...
}
```

**Esto significa:**
- Si `NOT_SECURED` NO está definido → `credentials: true` ✅
- Si `NOT_SECURED=true` → NO hay `credentials: true` ❌

**Solución:** Asegúrate de que `NOT_SECURED` NO esté definido o sea `false` en el backend.

## ✅ SOLUCIÓN 3: Verificar Frontend usa credentials

El código en `libraries/helpers/src/utils/custom.fetch.func.ts` línea 47:

```typescript
...(secured ? { credentials: 'include' } : {}),
```

Y en `apps/frontend/src/app/(app)/layout.tsx` línea 34:

```typescript
customFetch(params, undefined, undefined, isSecured)
```

**Verificar:** `isSecured` debe ser `true` (viene de `useVariables()`).

## ✅ SOLUCIÓN 4: Agregar Logs para Debug

Agregar en `apps/backend/src/api/routes/auth.controller.ts` después de línea 134:

```typescript
console.log('Login attempt:', {
  email: body.email,
  frontendUrl: process.env.FRONTEND_URL,
  cookieDomain: getCookieUrlFromDomain(process.env.FRONTEND_URL!),
  notSecured: process.env.NOT_SECURED,
});
```

## ✅ SOLUCIÓN 5: Script SQL Directo (ALTERNATIVA)

Si el login no funciona, puedes crear usuarios directamente:

### Opción A: Usar bcrypt para generar hash

```bash
# Instalar bcrypt-cli
npm install -g bcrypt-cli

# Generar hash de password
bcrypt-cli hash "tu_password" 10
```

### Opción B: Script TypeScript

Crear `scripts/create-user-direct.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      email,
      password: hashedPassword,
      activated: true,
      // ... otros campos requeridos
    },
  });

  console.log('User created:', user);
}

main();
```

## 🚀 PASOS PARA IMPLEMENTAR

1. **Verificar variables en Railway:**
   - Backend: `NOT_SECURED` NO debe estar definido o debe ser `false`
   - Frontend: Solo `NEXT_PUBLIC_BACKEND_URL` necesario

2. **Reiniciar servicios en Railway:**
   - Reiniciar backend
   - Reiniciar frontend

3. **Probar login:**
   - Ir a https://motivated-blessing-production.up.railway.app/auth/login
   - Intentar login
   - Abrir DevTools → Network → Verificar request a `/auth/login`
   - Verificar que response tenga `Set-Cookie: auth=...`

4. **Si no funciona:**
   - Verificar logs del backend en Railway
   - Verificar que CORS permita el origen del frontend
   - Verificar que cookies se establezcan con dominio correcto

## 🔧 SOLUCIÓN RÁPIDA: NOT_SECURED=true (TEMPORAL)

Si necesitas una solución rápida para testing:

**Backend Railway:**
```
NOT_SECURED=true
```

Esto:
- ✅ Permite cookies sin `secure: true`
- ✅ Envía `auth` en headers en lugar de cookies
- ⚠️ Menos seguro (solo para testing)

**Luego el frontend leerá `auth` de headers en lugar de cookies.**

## 📝 CHECKLIST FINAL

- [ ] `NOT_SECURED` NO está definido en backend (o es `false`)
- [ ] `FRONTEND_URL` correcto en backend
- [ ] `NEXT_PUBLIC_BACKEND_URL` correcto en frontend
- [ ] Backend reiniciado
- [ ] Frontend reiniciado
- [ ] Probar login
- [ ] Verificar cookies en DevTools
- [ ] Si falla, usar script SQL directo

## 🎯 RESULTADO ESPERADO

Después de aplicar las soluciones:
1. Login funciona correctamente
2. Cookies se establecen con dominio `.up.railway.app`
3. Frontend puede leer cookies y hacer requests autenticados
4. Usuario puede conectar cuentas sociales




