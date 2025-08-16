import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

async function main() {
  await prisma.$connect();
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
