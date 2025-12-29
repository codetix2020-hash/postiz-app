-- Script SQL para crear API Key manualmente
-- 
-- IMPORTANTE: Este script requiere que conozcas el JWT_SECRET para encriptar la API key
-- Si no lo tienes, usa el script TypeScript: create-api-key.ts
--
-- Pasos:
-- 1. Conéctate a la base de datos PostgreSQL
-- 2. Ejecuta este script
-- 3. Reemplaza los valores marcados con <...>

-- Opción 1: Actualizar API key de una organización existente
-- Primero, busca el ID de tu organización:
-- SELECT id, name, "apiKey" FROM "Organization" LIMIT 10;

-- Luego actualiza con una API key encriptada (necesitas generarla con el script TypeScript):
-- UPDATE "Organization" 
-- SET "apiKey" = '<API_KEY_ENCRIPTADA_AQUI>'
-- WHERE id = '<ORGANIZATION_ID_AQUI>';

-- Opción 2: Crear nueva organización con usuario y API key
-- NOTA: Esto requiere generar la API key encriptada primero con el script TypeScript

-- INSERT INTO "Organization" (id, name, "apiKey", "allowTrial", "isTrailing", "createdAt", "updatedAt")
-- VALUES (
--   gen_random_uuid(),
--   'MarketingOS Organization',
--   '<API_KEY_ENCRIPTADA_AQUI>',  -- Generar con script TypeScript
--   true,
--   true,
--   NOW(),
--   NOW()
-- );

-- Luego crear el usuario:
-- INSERT INTO "User" (id, email, "providerName", timezone, activated, "createdAt", "updatedAt")
-- VALUES (
--   gen_random_uuid(),
--   'admin@example.com',
--   'LOCAL',
--   0,
--   true,
--   NOW(),
--   NOW()
-- );

-- Y asociar usuario con organización:
-- INSERT INTO "UserOrganization" (id, "userId", "organizationId", role, disabled, "createdAt", "updatedAt")
-- VALUES (
--   gen_random_uuid(),
--   '<USER_ID_AQUI>',
--   '<ORGANIZATION_ID_AQUI>',
--   'SUPERADMIN',
--   false,
--   NOW(),
--   NOW()
-- );

-- RECOMENDACIÓN: Usa el script TypeScript (create-api-key.ts) que maneja la encriptación automáticamente





