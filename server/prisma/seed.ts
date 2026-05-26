import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPwd = await bcrypt.hash('admin123', 10);
  const existing = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!existing) {
    await prisma.user.create({
      data: { username: 'admin', email: 'admin@mall.com', password: adminPwd, role: 'admin' },
    });
  }

  const c1 = await prisma.category.create({ data: { name: '电子产品', sort: 1 } });
  const c2 = await prisma.category.create({ data: { name: '服装鞋帽', sort: 2 } });
  const c3 = await prisma.category.create({ data: { name: '手机', parentId: c1.id, sort: 1 } });
  const c4 = await prisma.category.create({ data: { name: '电脑', parentId: c1.id, sort: 2 } });

  await prisma.product.createMany({
    data: [
      { name: 'iPhone 15', description: 'Apple 最新旗舰手机', price: 6999, categoryId: c3.id, stock: 100, images: '[]' },
      { name: 'MacBook Pro 14', description: 'M3 芯片笔记本电脑', price: 14999, categoryId: c4.id, stock: 50, images: '[]' },
      { name: 'AirPods Pro', description: '主动降噪耳机', price: 1899, categoryId: c1.id, stock: 200, images: '[]' },
      { name: 'iPad Air', description: 'M2 芯片平板', price: 4799, categoryId: c4.id, stock: 80, images: '[]' },
    ],
  });

  console.log('Seed data created successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
