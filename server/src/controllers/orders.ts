import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { generateOrderNo } from '../utils/jwt';

export async function list(req: Request, res: Response): Promise<void> {
  const { page = '1', pageSize = '10', status, paymentStatus } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);
  const where: any = {};
  if (status) where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  const [list, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: Number(pageSize),
      include: {
        user: { select: { id: true, username: true } },
        items: { include: { product: { select: { id: true, name: true, images: true } } } },
        logistics: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);
  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      user: { select: { id: true, username: true } },
      items: { include: { product: true } },
      logistics: true,
      reviews: true,
    },
  });
  if (!order) { res.status(404).json({ message: '订单不存在' }); return; }
  res.json(order);
}

export async function create(req: Request, res: Response): Promise<void> {
  const { items, address, paymentMethod = 'alipay', couponId } = req.body;
  if (!items || items.length === 0) {
    res.status(400).json({ message: '请选择商品' });
    return;
  }
  const orderNo = generateOrderNo();
  let totalAmount = 0;
  const orderItems: { productId: number; quantity: number; price: number }[] = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: Number(item.productId) } });
    if (!product || product.status !== 'on') {
      res.status(400).json({ message: `商品 ${item.productId} 不存在或已下架` });
      return;
    }
    if (product.stock < Number(item.quantity)) {
      res.status(400).json({ message: `商品 ${product.name} 库存不足` });
      return;
    }
    totalAmount += product.price * Number(item.quantity);
    orderItems.push({ productId: product.id, quantity: Number(item.quantity), price: product.price });
  }

  if (couponId) {
    const coupon = await prisma.coupon.findUnique({ where: { id: Number(couponId) } });
    if (coupon && coupon.status === 'active' && totalAmount >= coupon.minAmount) {
      if (coupon.type === 'fixed') {
        totalAmount = Math.max(0, totalAmount - coupon.value);
      } else {
        totalAmount = totalAmount * (1 - coupon.value / 100);
      }
    }
  }

  for (const item of orderItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity }, sales: { increment: item.quantity } },
    });
    await prisma.inventoryLog.create({
      data: { productId: item.productId, quantity: -item.quantity, type: 'order', remark: `订单 ${orderNo}` },
    });
  }

  const order = await prisma.order.create({
    data: {
      orderNo,
      userId: req.user!.userId,
      totalAmount,
      address: address || '',
      paymentMethod,
      items: { create: orderItems },
    },
    include: { items: true },
  });

  if (couponId) {
    await prisma.userCoupon.updateMany({
      where: { userId: req.user!.userId, couponId: Number(couponId), status: 'unused' },
      data: { status: 'used', usedAt: new Date() },
    });
  }

  await prisma.cartItem.deleteMany({ where: { userId: req.user!.userId } });
  res.status(201).json(order);
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body;
  const order = await prisma.order.update({
    where: { id: Number(req.params.id) },
    data: { status },
  });
  res.json(order);
}

export async function updatePayment(req: Request, res: Response): Promise<void> {
  const order = await prisma.order.update({
    where: { id: Number(req.params.id) },
    data: { paymentStatus: 'paid', status: 'paid' },
  });
  res.json(order);
}
