/**
 * Script para crear API Key en Postiz
 * 
 * Este script:
 * 1. Busca una organización existente por email o crea una nueva
 * 2. Genera una API key usando la misma lógica que Postiz
 * 3. La guarda en la base de datos
 * 4. Muestra la API key encriptada (que es la que se usa en los headers)
 * 
 * Uso:
 * DATABASE_URL="postgresql://..." JWT_SECRET="tu-secret" pnpm tsx scripts/create-api-key.ts [email]
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

function makeId(length: number) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  for (let i = 0; i < length; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function main() {
  const email = process.argv[2] || 'admin@example.com';
  const orgName = process.argv[3] || 'MarketingOS Organization';
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL no está configurado');
    process.exit(1);
  }
  
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET no está configurado');
    process.exit(1);
  }

  // Configurar Prisma para usar el schema correcto
  process.env.DATABASE_URL = process.env.DATABASE_URL!;
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    console.log('🔍 Buscando organización...');
    
    // Buscar usuario por email
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });

    let organization;
    
    if (user && user.organizations.length > 0) {
      // Usar la primera organización del usuario
      organization = user.organizations[0].organization;
      console.log(`✅ Organización encontrada: ${organization.name} (ID: ${organization.id})`);
    } else {
      // Crear nueva organización y usuario
      console.log('📝 Creando nueva organización y usuario...');
      
      const randomId = makeId(20);
      const encryptedApiKey = encrypt_legacy_using_IV(randomId);
      
      organization = await prisma.organization.create({
        data: {
          name: orgName,
          apiKey: encryptedApiKey,
          allowTrial: true,
          isTrailing: true,
          users: {
            create: {
              role: 'SUPERADMIN',
              user: {
                create: {
                  email,
                  password: '', // Sin contraseña (puedes cambiarlo después)
                  providerName: 'LOCAL',
                  timezone: 0,
                  activated: true,
                },
              },
            },
          },
        },
      });
      
      console.log(`✅ Organización creada: ${organization.name} (ID: ${organization.id})`);
      console.log(`✅ Usuario creado: ${email}`);
    }

    // Generar nueva API key
    console.log('\n🔑 Generando nueva API key...');
    const newApiKey = makeId(20);
    const encryptedApiKey = encrypt_legacy_using_IV(newApiKey);
    
    // Actualizar en la base de datos
    await prisma.organization.update({
      where: { id: organization.id },
      data: { apiKey: encryptedApiKey },
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ API KEY CREADA EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n📋 INFORMACIÓN:');
    console.log(`   Organización ID: ${organization.id}`);
    console.log(`   Organización: ${organization.name}`);
    console.log(`   Email: ${email}`);
    console.log('\n🔑 API KEY (usar en header Authorization):');
    console.log(`   ${encryptedApiKey}`);
    console.log('\n📝 Para usar en MarketingOS:');
    console.log(`   POSTIZ_API_KEY=${encryptedApiKey}`);
    console.log(`   POSTIZ_URL=https://postiz-app-production-b46f.up.railway.app`);
    console.log(`   ORGANIZATION_ID=${organization.id}`);
    console.log('\n' + '='.repeat(60));
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

