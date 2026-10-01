import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!})});
async function main(){ const password=process.env.SEED_ADMIN_PASSWORD; if(!password) throw new Error('SEED_ADMIN_PASSWORD is required'); await prisma.user.upsert({where:{email:'admin@example.com'},update:{},create:{email:'admin@example.com',fullName:'Admin',role:'ADMIN',passwordHash:await argon2.hash(password)}}); }
main().finally(()=>prisma.$disconnect());
