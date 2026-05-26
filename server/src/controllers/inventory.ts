import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function list(req: Request, res: Response): Promise<void> {
  const { page = '1', pageSize = '10', keyword = '' } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);
  const where: any = {};
  if (keyword) where.name = { contains: String(keyword) };
  const [list, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: Number(pageSize),
      select: { id: true, name: true, price: true, stock: true, sales: true, status: true, images: true },
      orderBy: { stock: 'asc' },
    }),
    prisma.product.count({ where }),
  ]);
  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
}

export async function adjustStock(req: Request, res: Response): Promise<void> {
  const { productId, quantity, remark } = req.body;
  const product = await prisma.product.update({
    where: { id: Number(productId) },
    data: { stock: { increment: Number(quantity) } },
  });
  await prisma.inventoryLog.create({
    data: {
      productId: Number(productId),
      quantity: Number(quantity),
      type: Number(quantity) > 0 ? 'in' : 'out',
      remark: remark || '手动调整',
    },
  });
  res.json(product);
}

export async function logs(req: Request, res: Response): Promise<void> {
  const { page = '1', pageSize = '10', productId } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);
  const where: any = {};
  if (productId) where.productId = Number(productId);
  const [list, total] = await Promise.all([
    prisma.inventoryLog.findMany({
      where,
      skip,
      take: Number(pageSize),
      include: { product: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.inventoryLog.count({ where }),
  ]);
  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
}
