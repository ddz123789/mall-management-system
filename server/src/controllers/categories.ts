import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function list(_req: Request, res: Response): Promise<void> {
  const categories = await prisma.category.findMany({
    include: { children: true },
    orderBy: { sort: 'asc' },
  });
  const roots = categories.filter((c) => !c.parentId);
  res.json(roots);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id: Number(req.params.id) },
    include: { children: true, products: { select: { id: true, name: true, price: true, stock: true, status: true } } },
  });
  if (!category) { res.status(404).json({ message: '分类不存在' }); return; }
  res.json(category);
}

export async function create(req: Request, res: Response): Promise<void> {
  const { name, description, parentId, sort } = req.body;
  const category = await prisma.category.create({
    data: {
      name,
      description,
      parentId: parentId ? Number(parentId) : null,
      sort: Number(sort) || 0,
    },
  });
  res.status(201).json(category);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { name, description, parentId, sort } = req.body;
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (parentId !== undefined) data.parentId = parentId ? Number(parentId) : null;
  if (sort !== undefined) data.sort = Number(sort);
  const category = await prisma.category.update({
    where: { id: Number(req.params.id) },
    data,
  });
  res.json(category);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  await prisma.category.updateMany({ where: { parentId: id }, data: { parentId: null } });
  await prisma.category.delete({ where: { id } });
  res.json({ message: '删除成功' });
}
