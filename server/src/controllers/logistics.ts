import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function list(_req: Request, res: Response): Promise<void> {
  const list = await prisma.logistics.findMany({
    include: { order: { select: { id: true, orderNo: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(list);
}

export async function getByOrderId(req: Request, res: Response): Promise<void> {
  const logistics = await prisma.logistics.findUnique({
    where: { orderId: Number(req.params.orderId) },
  });
  if (!logistics) { res.status(404).json({ message: '物流信息不存在' }); return; }
  res.json(logistics);
}

export async function create(req: Request, res: Response): Promise<void> {
  const { orderId, company, trackingNo, status, records } = req.body;
  const existing = await prisma.logistics.findUnique({ where: { orderId: Number(orderId) } });
  if (existing) {
    res.status(400).json({ message: '该订单已有物流信息' });
    return;
  }
  const logistics = await prisma.logistics.create({
    data: {
      orderId: Number(orderId),
      company,
      trackingNo,
      status: status || 'pending',
      records: records || '[]',
    },
  });
  res.status(201).json(logistics);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { company, trackingNo, status, records } = req.body;
  const data: any = {};
  if (company) data.company = company;
  if (trackingNo) data.trackingNo = trackingNo;
  if (status) data.status = status;
  if (records) data.records = records;
  const logistics = await prisma.logistics.update({
    where: { id: Number(req.params.id) },
    data,
  });
  res.json(logistics);
}
