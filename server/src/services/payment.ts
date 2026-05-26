import AlipaySdk from 'alipay-sdk';
import crypto from 'crypto';
import { alipayConfig, wechatConfig } from '../config/payment';
import prisma from '../utils/prisma';

interface PaymentResult {
  success: boolean;
  qrCode?: string;
  paymentUrl?: string;
  message?: string;
}

interface PaymentCallbacks {
  onPaid: (orderNo: string, tradeNo: string, amount: number) => Promise<void>;
}

let paymentCallbacks: PaymentCallbacks | null = null;

export function setPaymentCallbacks(callbacks: PaymentCallbacks) {
  paymentCallbacks = callbacks;
}

function generateTradeNo(): string {
  const now = new Date();
  const ts = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 10);
  return `${ts}${rand}`;
}

export async function createAlipayPayment(orderNo: string, amount: number, subject: string): Promise<PaymentResult> {
  const tradeNo = generateTradeNo();

  const alipay = new AlipaySdk({
    appId: alipayConfig.appId,
    privateKey: alipayConfig.privateKey,
    alipayPublicKey: alipayConfig.alipayPublicKey,
    gateway: alipayConfig.gateway,
  });

  try {
    const result = await alipay.exec('alipay.trade.precreate', {
      notifyUrl: alipayConfig.notifyUrl,
      bizContent: {
        outTradeNo: tradeNo,
        totalAmount: amount.toFixed(2),
        subject,
        body: `订单 ${orderNo}`,
      },
    });

    if (result.code === '10000') {
      await prisma.order.update({
        where: { orderNo },
        data: { paymentMethod: 'alipay' },
      });
      return { success: true, qrCode: result.qrCode, paymentUrl: result.qrCode };
    }
    return { success: false, message: result.subMsg || '创建支付失败' };
  } catch {
    return { success: false, message: '支付宝服务暂不可用' };
  }
}

export async function createWechatPayment(orderNo: string, amount: number, subject: string): Promise<PaymentResult> {
  const tradeNo = generateTradeNo();

  await prisma.order.update({
    where: { orderNo },
    data: { paymentMethod: 'wechat' },
  });

  const params: Record<string, string> = {
    appid: wechatConfig.appId || 'wx_sandbox',
    mch_id: wechatConfig.mchId || 'sandbox_mch',
    nonce_str: crypto.randomBytes(16).toString('hex'),
    body: subject,
    out_trade_no: tradeNo,
    total_fee: Math.round(amount * 100).toString(),
    spbill_create_ip: '127.0.0.1',
    notify_url: wechatConfig.notifyUrl,
    trade_type: 'NATIVE',
  };

  const signStr = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&') + `&key=${wechatConfig.apiKey || 'sandbox'}`;
  params.sign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();

  const qrLink = `weixin://wxpay/bizpayurl?pr=${tradeNo}`;
  return { success: true, qrCode: qrLink, paymentUrl: qrLink };
}

export async function createSimulatedPayment(orderNo: string): Promise<PaymentResult> {
  const tradeNo = generateTradeNo();
  await prisma.order.update({
    where: { orderNo },
    data: { paymentMethod: 'simulated' },
  });
  // 模拟支付：2秒后自动完成
  setTimeout(async () => {
    await confirmPayment(orderNo, tradeNo);
  }, 2000);
  return { success: true, qrCode: '', paymentUrl: '', message: '模拟支付，2秒后自动到账' };
}

export async function confirmPayment(orderNo: string, tradeNo: string) {
  await prisma.order.update({
    where: { orderNo },
    data: { paymentStatus: 'paid', status: 'paid' },
  });
  if (paymentCallbacks) {
    const order = await prisma.order.findUnique({ where: { orderNo } });
    if (order) {
      await paymentCallbacks.onPaid(orderNo, tradeNo, order.totalAmount);
    }
  }
}

export async function verifyAlipayNotify(params: any): Promise<boolean> {
  const alipay = new AlipaySdk({
    appId: alipayConfig.appId,
    privateKey: alipayConfig.privateKey,
    alipayPublicKey: alipayConfig.alipayPublicKey,
    gateway: alipayConfig.gateway,
  });

  try {
    return alipay.checkNotifySign(params);
  } catch {
    return false;
  }
}
