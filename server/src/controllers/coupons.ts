import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function list(_req: Request, res: Response): Promise<void> {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(coupons);
}

export async function create(req: Request, res: Response): Promise<void> {
  const { name, type, value, minAmount, startDate, endDate } = req.body;
  const coupon = await prisma.coupon.create({
    data: {
      name,
      type: type || 'fixed',
      value: Number(value),
      minAmount: Number(minAmount) || 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });
  res.status(201).json(coupon);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { name, type, value, minAmount, startDate, endDate, status } = req.body;
  const data: any = {};
  if (name) data.name = name;
  if (type) data.type = type;
  if (value !== undefined) data.value = Number(value);
  if (minAmount !== undefined) data.minAmount = Number(minAmount);
  if (startDate) data.startDate = new Date(startDate);
  if (endDate) data.endDate = new Date(endDate);
  if (status) data.status = status;
  const coupon = await prisma.coupon.update({ where: { id: Number(req.params.id) }, data });
  res.json(coupon);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await prisma.coupon.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: '删除成功' });
}

export async function claim(req: Request, res: Response): Promise<void> {
  const { couponId } = req.body;
  const coupon = await prisma.coupon.findUnique({ where: { id: Number(couponId) } });
  if (!coupon || coupon.status !== 'active') {
    res.status(400).json({ message: '优惠券不可用' });
    return;
  }
  const existing = await prisma.userCoupon.findFirst({
    where: { userId: req.user!.userId, couponId: Number(couponId) },
  });
  if (existing) {
    res.status(400).json({ message: '已领取过该优惠券' });
    return;
  }
  const uc = await prisma.userCoupon.create({
    data: { userId: req.user!.userId, couponId: Number(couponId) },
    include: { coupon: true },
  });
  res.status(201).json(uc);
}

export async function myCoupons(req: Request, res: Response): Promise<void> {
  const coupons = await prisma.userCoupon.findMany({
    where: { userId: req.user!.userId },
    include: { coupon: true },
  });
  res.json(coupons);
}
