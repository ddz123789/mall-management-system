import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { signToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

export async function register(req: Request, res: Response): Promise<void> {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ message: '用户名、邮箱和密码为必填项' });
    return;
  }
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    res.status(400).json({ message: '用户名或邮箱已存在' });
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, password: hashed },
  });
  const payload = { userId: user.id, role: user.role };
  res.status(201).json({
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
    token: signToken(payload),
    refreshToken: signRefreshToken(payload),
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.status !== 'active') {
    res.status(401).json({ message: '用户名或密码错误' });
    return;
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ message: '用户名或密码错误' });
    return;
  }
  const payload = { userId: user.id, role: user.role };
  res.json({
    user: { id: user.id, username: user.username, email: user.email, role: user.role, avatar: user.avatar },
    token: signToken(payload),
    refreshToken: signRefreshToken(payload),
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ message: '缺少刷新令牌' });
    return;
  }
  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.status !== 'active') {
      res.status(401).json({ message: '用户不存在或已禁用' });
      return;
    }
    const newPayload = { userId: user.id, role: user.role };
    res.json({
      token: signToken(newPayload),
      refreshToken: signRefreshToken(newPayload),
    });
  } catch {
    res.status(401).json({ message: '刷新令牌无效' });
  }
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, username: true, email: true, role: true, avatar: true, status: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ message: '用户不存在' });
    return;
  }
  res.json(user);
}
