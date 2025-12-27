# Scripts de Postiz

## create-api-key.ts

Script para crear o actualizar API keys en Postiz.

### Requisitos

1. **Variables de entorno:**
   - `DATABASE_URL`: URL de conexión a PostgreSQL
   - `JWT_SECRET`: Secret key usado para encriptar las API keys (debe ser el mismo que usa el backend)

2. **Dependencias:**
   - Node.js >= 22.12.0
   - pnpm
   - Prisma Client generado

### Uso

#### Opción 1: Usar organización existente

```bash
cd postiz-app
DATABASE_URL="postgresql://..." JWT_SECRET="tu-secret" pnpm tsx scripts/create-api-key.ts email@example.com
```

#### Opción 2: Crear nueva organización

```bash
cd postiz-app
DATABASE_URL="postgresql://..." JWT_SECRET="tu-secret" pnpm tsx scripts/create-api-key.ts email@example.com "Nombre Organización"
```

### Ejemplo completo

```bash
cd postiz-app

# Primero generar Prisma Client
pnpm run prisma-generate

# Luego ejecutar el script
DATABASE_URL="postgresql://neondb_owner:npg_6baOIu3gVYFo@ep-red-bush-ah8rov5p-pooler.c-3.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require" \
JWT_SECRET="tu-jwt-secret-aqui" \
pnpm tsx scripts/create-api-key.ts admin@example.com
```

### Notas importantes

- El script busca una organización existente asociada al email proporcionado
- Si no existe, crea una nueva organización y usuario
- La API key se genera usando la misma lógica que Postiz (`makeId(20)` + encriptación)
- La API key mostrada es la **versión encriptada** que debes usar en el header `Authorization`

### Obtener JWT_SECRET

El `JWT_SECRET` debe ser el mismo que está configurado en Railway para el backend de Postiz. Puedes encontrarlo en:
- Variables de entorno de Railway
- O configurarlo si no existe

### Alternativa: SQL directo

Si prefieres usar SQL directamente, ver `create-api-key.sql`, pero **necesitarás generar la API key encriptada primero** usando el script TypeScript.

---

## create-test-integrations.ts

Script para crear integraciones de prueba (Instagram y TikTok) con tokens placeholder.

### Uso

```bash
cd postiz-app

# Primero generar Prisma Client
pnpm run prisma-generate

# Ejecutar script
DATABASE_URL="postgresql://..." \
JWT_SECRET="tu-secret" \
ORGANIZATION_ID="b0a57f66-6cae-4f6f-8e8d-c8dfd5d9b08d" \
pnpm tsx scripts/create-test-integrations.ts
```

### Qué hace

- Crea 2 integraciones de prueba:
  - **Instagram**: Nombre "Reservaya", provider "instagram"
  - **TikTok**: Nombre "reservafacil_1", provider "tiktok"
- Usa tokens placeholder (encriptados) que pueden ser reemplazados después
- Permite probar la API inmediatamente sin OAuth flow completo

### Notas

- Los tokens son placeholders y **no funcionarán para publicar posts reales**
- Para tokens reales, necesitas conectar las cuentas mediante OAuth flow
- Las integraciones aparecerán en `/public/v1/integrations` inmediatamente

