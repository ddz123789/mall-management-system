import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function list(req: Request, res: Response): Promise<void> {
  const { page = '1', pageSize = '10', productId } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);
  const where: any = {};
  if (productId) where.productId = Number(productId);
  const [list, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: Number(pageSize),
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.count({ where }),
  ]);
  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { productId, orderId, rating, content, images } = req.body;
  const review = await prisma.review.create({
    data: {
      userId: req.user!.userId,
      productId: Number(productId),
      orderId: orderId ? Number(orderId) : null,
      rating: Number(rating),
      content,
      images: images || '[]',
    },
    include: { user: { select: { id: true, username: true, avatar: true } } },
  });
  res.status(201).json(review);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { rating, content } = req.body;
  const review = await prisma.review.update({
    where: { id: Number(req.params.id) },
    data: { rating: Number(rating), content },
  });
  res.json(review);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await prisma.review.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: '删除成功' });
}
