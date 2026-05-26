import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

export async function list(req: Request, res: Response): Promise<void> {
  const { page = '1', pageSize = '10', keyword = '' } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);
  const where = keyword
    ? { OR: [{ username: { contains: String(keyword) } }, { email: { contains: String(keyword) } }] }
    : {};
  const [list, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(pageSize),
      select: { id: true, username: true, email: true, role: true, avatar: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: Number(req.params.id) },
    select: { id: true, username: true, email: true, role: true, avatar: true, status: true, createdAt: true },
  });
  if (!user) { res.status(404).json({ message: '用户不存在' }); return; }
  res.json(user);
}

export async function create(req: Request, res: Response): Promise<void> {
  const { username, email, password, role = 'user' } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, password: hashed, role },
    select: { id: true, username: true, email: true, role: true, avatar: true, status: true, createdAt: true },
  });
  res.status(201).json(user);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { username, email, role, password } = req.body;
  const data: any = {};
  if (username) data.username = username;
  if (email) data.email = email;
  if (role) data.role = role;
  if (password) data.password = await bcrypt.hash(password, 10);
  const user = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data,
    select: { id: true, username: true, email: true, role: true, avatar: true, status: true, createdAt: true },
  });
  res.json(user);
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body;
  const user = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data: { status },
    select: { id: true, username: true, email: true, role: true, avatar: true, status: true },
  });
  res.json(user);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: '删除成功' });
}
