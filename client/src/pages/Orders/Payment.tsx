import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Radio, Space, QRCode, Spin, message, Result } from 'antd';
import { AlipayCircleOutlined, WechatOutlined, ExperimentOutlined } from '@ant-design/icons';
import api from '../../api';

interface Props {
  open: boolean;
  orderNo: string;
  amount: number;
  onClose: () => void;
  onPaid: () => void;
}

export default function PaymentModal({ open, orderNo, amount, onClose, onPaid }: Props) {
  const [method, setMethod] = useState('alipay');
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState<'select' | 'paying' | 'paid' | 'failed'>('select');
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const startPoll = () => {
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/payment/query/${orderNo}`);
        if (data.paymentStatus === 'paid') {
          clearInterval(pollingRef.current);
          setStatus('paid');
          onPaid();
        }
      } catch { /* ignore */ }
    }, 2000);
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/payment/pay', { orderNo, method });
      if (data.success) {
        setStatus('paying');
        if (data.qrCode) setQrCode(data.qrCode);
        if (method === 'simulated') {
          message.info('模拟支付中，2秒后自动确认');
        }
        startPoll();
      } else {
        message.error(data.message || '支付失败');
        setStatus('failed');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '支付请求失败');
      setStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setStatus('select');
    setQrCode('');
    onClose();
  };

  return (
    <Modal title="订单支付" open={open} onCancel={handleClose} footer={null} width={480} destroyOnClose>
      {status === 'select' && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ textAlign: 'center' }}>
            <h2>¥{amount.toFixed(2)}</h2>
            <p>订单号：{orderNo}</p>
          </div>
          <Radio.Group value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="alipay" style={{ padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: 8, width: '100%' }}>
                <AlipayCircleOutlined style={{ color: '#1677ff', fontSize: 24, marginRight: 8 }} />支付宝
              </Radio>
              <Radio value="wechat" style={{ padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: 8, width: '100%' }}>
                <WechatOutlined style={{ color: '#07c160', fontSize: 24, marginRight: 8 }} />微信支付
              </Radio>
              <Radio value="simulated" style={{ padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: 8, width: '100%' }}>
                <ExperimentOutlined style={{ color: '#faad14', fontSize: 24, marginRight: 8 }} />模拟支付（测试用）
              </Radio>
            </Space>
          </Radio.Group>
          <Button type="primary" size="large" block loading={loading} onClick={handlePay}>
            确认支付
          </Button>
        </Space>
      )}

      {status === 'paying' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <h3>请扫码支付</h3>
          {method === 'simulated' ? (
            <div style={{ padding: 40 }}>
              <Spin size="large" />
              <p style={{ marginTop: 16, color: '#999' }}>模拟支付进行中，请稍候...</p>
            </div>
          ) : qrCode ? (
            <QRCode value={qrCode} size={200} style={{ margin: '20px auto' }} />
          ) : (
            <div style={{ padding: 40 }}>
              <Spin size="large" />
              <p style={{ marginTop: 16, color: '#999' }}>生成支付二维码中...</p>
            </div>
          )}
          <p style={{ color: '#999', marginTop: 12 }}>
            {method === 'alipay' ? '请使用支付宝扫码支付' : '请使用微信扫码支付'}
          </p>
          <p style={{ color: '#1677ff' }}>支付 ¥{amount.toFixed(2)}</p>
          <Button type="link" onClick={handleClose}>取消支付</Button>
        </div>
      )}

      {status === 'paid' && (
        <Result status="success" title="支付成功" subTitle={`订单 ${orderNo} 已支付 ¥${amount.toFixed(2)}`}
          extra={<Button type="primary" onClick={handleClose}>查看订单</Button>}
        />
      )}

      {status === 'failed' && (
        <Result status="error" title="支付失败" extra={
          <Space>
            <Button onClick={() => setStatus('select')}>重新支付</Button>
            <Button onClick={handleClose}>取消</Button>
          </Space>
        } />
      )}
    </Modal>
  );
}
