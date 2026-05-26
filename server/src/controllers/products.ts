import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function list(req: Request, res: Response): Promise<void> {
  const { page = '1', pageSize = '10', keyword = '', categoryId, status } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);
  const where: any = {};
  if (keyword) where.name = { contains: String(keyword) };
  if (categoryId) where.categoryId = Number(categoryId);
  if (status) where.status = status;
  const [list, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: Number(pageSize),
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);
  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: Number(req.params.id) },
    include: { category: true, reviews: { include: { user: { select: { id: true, username: true, avatar: true } } } } },
  });
  if (!product) { res.status(404).json({ message: '商品不存在' }); return; }
  res.json(product);
}

export async function create(req: Request, res: Response): Promise<void> {
  const { name, description, price, categoryId, stock, images } = req.body;
  const product = await prisma.product.create({
    data: {
      name,
      description,
      price: Number(price),
      categoryId: Number(categoryId),
      stock: Number(stock) || 0,
      images: images || '[]',
    },
    include: { category: { select: { id: true, name: true } } },
  });
  res.status(201).json(product);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { name, description, price, categoryId, stock, images, status } = req.body;
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (price !== undefined) data.price = Number(price);
  if (categoryId !== undefined) data.categoryId = Number(categoryId);
  if (stock !== undefined) data.stock = Number(stock);
  if (images !== undefined) data.images = images;
  if (status !== undefined) data.status = status;
  const product = await prisma.product.update({
    where: { id: Number(req.params.id) },
    data,
    include: { category: { select: { id: true, name: true } } },
  });
  res.json(product);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await prisma.product.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: '删除成功' });
}

export async function uploadImages(req: Request, res: Response): Promise<void> {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ message: '请选择图片' });
    return;
  }
  const urls = files.map((f) => `/uploads/${f.filename}`);
  const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) } });
  if (!product) { res.status(404).json({ message: '商品不存在' }); return; }
  const existing: string[] = JSON.parse(product.images || '[]');
  const updated = [...existing, ...urls];
  await prisma.product.update({
    where: { id: Number(req.params.id) },
    data: { images: JSON.stringify(updated) },
  });
  res.json({ urls: updated });
}
