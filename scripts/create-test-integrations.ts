/**
 * Script para crear integraciones de prueba (Instagram y TikTok)
 * 
 * Este script crea integraciones fake con tokens placeholder para testing.
 * Los tokens reales se pueden actualizar después mediante OAuth flow.
 * 
 * Uso:
 * DATABASE_URL="postgresql://..." JWT_SECRET="tu-secret" pnpm tsx scripts/create-test-integrations.ts
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
// @ts-ignore
import EVP_BytesToKey from 'evp_bytestokey';

const algorithm = 'aes-256-cbc';
const { keyLength, ivLength } = crypto.getCipherInfo(algorithm);

function deriveLegacyKeyIv(secret: string) {
  const pass = Buffer.isBuffer(secret) ? secret : Buffer.from(secret ?? '', 'utf8');
  const { key, iv } = EVP_BytesToKey(pass, null, keyLength * 8, ivLength, 'md5');
  
  if (key.length !== keyLength || iv.length !== ivLength) {
    throw new Error(`Derived wrong sizes (key=${key.length}, iv=${iv.length})`);
  }
  return { key, iv };
}

function encrypt_legacy_using_IV(utf8Plaintext: string) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET no está configurado');
  }
  
  const { key, iv } = deriveLegacyKeyIv(jwtSecret);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const out = Buffer.concat([cipher.update(utf8Plaintext, 'utf8'), cipher.final()]);
  return out.toString('hex');
}

async function main() {
  const ORGANIZATION_ID = process.env.ORGANIZATION_ID || 'b0a57f66-6cae-4f6f-8e8d-c8dfd5d9b08d';
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL no está configurado');
    process.exit(1);
  }
  
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET no está configurado');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    console.log('🔍 Verificando organización...');
    const org = await prisma.organization.findUnique({
      where: { id: ORGANIZATION_ID },
    });

    if (!org) {
      console.error(`❌ Organización no encontrada: ${ORGANIZATION_ID}`);
      process.exit(1);
    }

    console.log(`✅ Organización encontrada: ${org.name}\n`);

    // Token placeholder (será reemplazado con tokens reales después)
    const placeholderToken = 'placeholder_token_for_testing';
    const encryptedToken = encrypt_legacy_using_IV(placeholderToken);
    const encryptedRefreshToken = encrypt_legacy_using_IV('placeholder_refresh_token');

    // 1. Instagram Integration
    console.log('📱 Creando integración de Instagram...');
    const instagramInternalId = `instagram_${Date.now()}_reservaya`;
    const instagramIntegration = await prisma.integration.upsert({
      where: {
        organizationId_internalId: {
          organizationId: ORGANIZATION_ID,
          internalId: instagramInternalId,
        },
      },
      create: {
        organizationId: ORGANIZATION_ID,
        internalId: instagramInternalId,
        name: 'Reservaya',
        providerIdentifier: 'instagram',
        type: 'social',
        token: encryptedToken,
        refreshToken: encryptedRefreshToken,
        profile: 'reservaya',
        postingTimes: JSON.stringify([
          { time: 120 },
          { time: 400 },
          { time: 700 }
        ]),
        additionalSettings: '[]',
        rootInternalId: instagramInternalId.split('_').pop() || '',
        tokenExpiration: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 días
        disabled: false,
        refreshNeeded: false,
        inBetweenSteps: false,
      },
      update: {
        name: 'Reservaya',
        token: encryptedToken,
        refreshToken: encryptedRefreshToken,
        profile: 'reservaya',
        deletedAt: null,
        disabled: false,
        refreshNeeded: false,
      },
    });

    console.log(`✅ Instagram creada: ${instagramIntegration.id}`);
    console.log(`   - Nombre: Reservaya`);
    console.log(`   - Provider: instagram`);
    console.log(`   - Internal ID: ${instagramInternalId}\n`);

    // 2. TikTok Integration
    console.log('📱 Creando integración de TikTok...');
    const tiktokInternalId = `tiktok_${Date.now()}_reservafacil`;
    const tiktokIntegration = await prisma.integration.upsert({
      where: {
        organizationId_internalId: {
          organizationId: ORGANIZATION_ID,
          internalId: tiktokInternalId,
        },
      },
      create: {
        organizationId: ORGANIZATION_ID,
        internalId: tiktokInternalId,
        name: 'reservafacil_1',
        providerIdentifier: 'tiktok',
        type: 'social',
        token: encryptedToken,
        refreshToken: encryptedRefreshToken,
        profile: 'reservafacil_1',
        postingTimes: JSON.stringify([
          { time: 120 },
          { time: 400 },
          { time: 700 }
        ]),
        additionalSettings: '[]',
        rootInternalId: tiktokInternalId.split('_').pop() || '',
        tokenExpiration: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 días
        disabled: false,
        refreshNeeded: false,
        inBetweenSteps: false,
      },
      update: {
        name: 'reservafacil_1',
        token: encryptedToken,
        refreshToken: encryptedRefreshToken,
        profile: 'reservafacil_1',
        deletedAt: null,
        disabled: false,
        refreshNeeded: false,
      },
    });

    console.log(`✅ TikTok creada: ${tiktokIntegration.id}`);
    console.log(`   - Nombre: reservafacil_1`);
    console.log(`   - Provider: tiktok`);
    console.log(`   - Internal ID: ${tiktokInternalId}\n`);

    console.log('='.repeat(60));
    console.log('✅ INTEGRACIONES CREADAS EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n📋 RESUMEN:');
    console.log(`   Organización: ${org.name} (${ORGANIZATION_ID})`);
    console.log(`   Instagram: ${instagramIntegration.id}`);
    console.log(`   TikTok: ${tiktokIntegration.id}`);
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   Estas integraciones tienen tokens placeholder.');
    console.log('   Para usar tokens reales, necesitas:');
    console.log('   1. Conectar las cuentas mediante OAuth flow');
    console.log('   2. O actualizar los tokens manualmente en la DB');
    console.log('\n🧪 Para probar la API:');
    console.log('   GET /public/v1/integrations');
    console.log('   Deberías ver 2 integraciones ahora.');
    console.log('='.repeat(60));
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();




