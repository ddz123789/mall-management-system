import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function list(req: Request, res: Response): Promise<void> {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user!.userId },
    include: { product: { include: { category: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(items);
}

export async function add(req: Request, res: Response): Promise<void> {
  const { productId, quantity = 1 } = req.body;
  const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
  if (!product) { res.status(404).json({ message: '商品不存在' }); return; }
  const existing = await prisma.cartItem.findFirst({
    where: { userId: req.user!.userId, productId: Number(productId) },
  });
  if (existing) {
    const item = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + Number(quantity) },
      include: { product: true },
    });
    res.json(item);
  } else {
    const item = await prisma.cartItem.create({
      data: { userId: req.user!.userId, productId: Number(productId), quantity: Number(quantity) },
      include: { product: true },
    });
    res.status(201).json(item);
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  const { quantity } = req.body;
  const item = await prisma.cartItem.update({
    where: { id: Number(req.params.id) },
    data: { quantity: Number(quantity) },
    include: { product: true },
  });
  res.json(item);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await prisma.cartItem.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: '已移除' });
}

export async function clear(req: Request, res: Response): Promise<void> {
  await prisma.cartItem.deleteMany({ where: { userId: req.user!.userId } });
  res.json({ message: '购物车已清空' });
}
