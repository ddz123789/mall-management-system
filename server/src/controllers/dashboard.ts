import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function stats(_req: Request, res: Response): Promise<void> {
  const [userCount, productCount, orderCount, totalSales] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'paid' } }),
  ]);
  const pendingOrders = await prisma.order.count({ where: { status: 'pending' } });
  res.json({
    userCount,
    productCount,
    orderCount,
    pendingOrders,
    totalSales: totalSales._sum.totalAmount || 0,
  });
}

export async function salesTrend(req: Request, res: Response): Promise<void> {
  const { days = '7' } = req.query;
  const result: { date: string; amount: number; count: number }[] = [];
  for (let i = Number(days) - 1; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end }, paymentStatus: 'paid' },
    });
    const amount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    result.push({
      date: `${start.getMonth() + 1}/${start.getDate()}`,
      amount: Math.round(amount * 100) / 100,
      count: orders.length,
    });
  }
  res.json(result);
}

export async function topProducts(_req: Request, res: Response): Promise<void> {
  const products = await prisma.product.findMany({
    orderBy: { sales: 'desc' },
    take: 10,
    select: { id: true, name: true, sales: true, price: true, images: true },
  });
  res.json(products);
}
