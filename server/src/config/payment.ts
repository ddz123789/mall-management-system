// 支付宝沙箱配置 — 在 https://open.alipay.com/ 申请沙箱账号获取
export const alipayConfig = {
  appId: process.env.ALIPAY_APP_ID || '',
  privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
  gateway: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
  notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'http://localhost:3002/api/payment/alipay/notify',
  returnUrl: process.env.ALIPAY_RETURN_URL || 'http://localhost:5173/orders',
};

// 微信支付配置（模拟模式 — 生产环境替换为真实配置）
export const wechatConfig = {
  appId: process.env.WECHAT_APP_ID || '',
  mchId: process.env.WECHAT_MCH_ID || '',
  apiKey: process.env.WECHAT_API_KEY || '',
  notifyUrl: process.env.WECHAT_NOTIFY_URL || 'http://localhost:3002/api/payment/wechat/notify',
};
