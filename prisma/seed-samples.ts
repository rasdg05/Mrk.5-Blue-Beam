import { PrismaClient } from '@prisma/client';
import { insertSampleCars } from '../src/lib/sample-cars';

const prisma = new PrismaClient();

insertSampleCars(prisma)
  .then((r) => {
    console.log(`✅ Autos de muestra: ${r.created} agregados, ${r.skipped} ya existían.`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
