import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import {
  createAlipayPayment,
  createWechatPayment,
  createSimulatedPayment,
  confirmPayment,
  verifyAlipayNotify,
} from '../services/payment';

export async function pay(req: Request, res: Response): Promise<void> {
  const { orderNo, method } = req.body;
  if (!orderNo || !method) {
    res.status(400).json({ message: '缺少订单号或支付方式' });
    return;
  }

  const order = await prisma.order.findUnique({ where: { orderNo } });
  if (!order) {
    res.status(404).json({ message: '订单不存在' });
    return;
  }
  if (order.paymentStatus === 'paid') {
    res.status(400).json({ message: '订单已支付' });
    return;
  }

  let result;
  const subject = `商城订单-${orderNo}`;

  switch (method) {
    case 'alipay':
      result = await createAlipayPayment(orderNo, order.totalAmount, subject);
      break;
    case 'wechat':
      result = await createWechatPayment(orderNo, order.totalAmount, subject);
      break;
    case 'simulated':
      result = await createSimulatedPayment(orderNo);
      break;
    default:
      res.status(400).json({ message: '不支持的支付方式' });
      return;
  }

  res.json(result);
}

export async function queryPayment(req: Request, res: Response): Promise<void> {
  const { orderNo } = req.params;
  const order = await prisma.order.findUnique({
    where: { orderNo },
    select: { orderNo: true, paymentStatus: true, totalAmount: true, status: true },
  });
  if (!order) {
    res.status(404).json({ message: '订单不存在' });
    return;
  }
  res.json(order);
}

export async function alipayNotify(req: Request, res: Response): Promise<void> {
  const valid = await verifyAlipayNotify(req.body);
  if (!valid) {
    res.send('fail');
    return;
  }

  const { out_trade_no, trade_no } = req.body;
  if (req.body.trade_status === 'TRADE_SUCCESS' || req.body.trade_status === 'TRADE_FINISHED') {
    const order = await prisma.order.findFirst({ where: { orderNo: out_trade_no } });
    if (order) {
      await confirmPayment(out_trade_no, trade_no);
    }
  }
  res.send('success');
}

export async function wechatNotify(req: Request, res: Response): Promise<void> {
  const { out_trade_no, transaction_id } = req.body.xml || req.body;
  if (out_trade_no && transaction_id) {
    await confirmPayment(out_trade_no, transaction_id);
  }
  res.type('xml').send('<xml><return_code>SUCCESS</return_code></xml>');
}

export async function alipayReturn(_req: Request, res: Response): Promise<void> {
  res.redirect('/orders');
}
