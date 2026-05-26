import { useState, useRef } from 'react';
import { Modal, Button, Radio, Space, Spin, message, Result, Alert } from 'antd';
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
  const [method, setMethod] = useState('simulated');
  const [status, setStatus] = useState<'select' | 'paying' | 'paid' | 'failed'>('select');
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval>>();

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
    setErrMsg('');
    try {
      const { data } = await api.post('/payment/pay', { orderNo, method });
      if (data.success) {
        setStatus('paying');
        if (method !== 'simulated') {
          message.info('模拟环境：请使用「模拟支付」，支付宝/微信需配置真实密钥');
        }
        startPoll();
      } else {
        setErrMsg(data.message || '支付失败');
        setStatus('failed');
      }
    } catch (err: any) {
      setErrMsg(err.response?.data?.message || '支付请求失败');
      setStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setStatus('select');
    setErrMsg('');
    onClose();
  };

  return (
    <Modal title="订单支付" open={open} onCancel={handleClose} footer={null} width={460} destroyOnClose>
      {status === 'select' && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#f5222d' }}>¥{amount.toFixed(2)}</h2>
            <p style={{ color: '#999' }}>订单号：{orderNo}</p>
          </div>

          <Alert type="info" showIcon message="当前为测试环境，请使用「模拟支付」。支付宝/微信需配置真实商户密钥后才能使用。" style={{ fontSize: 13 }} />

          <Radio.Group value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="simulated" style={{ padding: '12px 16px', border: '2px solid #1677ff', borderRadius: 8, width: '100%' }}>
                <ExperimentOutlined style={{ color: '#1677ff', fontSize: 24, marginRight: 8 }} />
                <strong>模拟支付</strong> <span style={{ color: '#999', fontSize: 12 }}>— 即时确认，测试用</span>
              </Radio>
              <Radio value="alipay" style={{ padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: 8, width: '100%' }}>
                <AlipayCircleOutlined style={{ color: '#1677ff', fontSize: 24, marginRight: 8 }} />支付宝
                <span style={{ color: '#faad14', fontSize: 11, marginLeft: 8 }}>需配置密钥</span>
              </Radio>
              <Radio value="wechat" style={{ padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: 8, width: '100%' }}>
                <WechatOutlined style={{ color: '#07c160', fontSize: 24, marginRight: 8 }} />微信支付
                <span style={{ color: '#faad14', fontSize: 11, marginLeft: 8 }}>需配置密钥</span>
              </Radio>
            </Space>
          </Radio.Group>
          <Button type="primary" size="large" block loading={loading} onClick={handlePay}>
            确认支付 ¥{amount.toFixed(2)}
          </Button>
        </Space>
      )}

      {status === 'paying' && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <Spin size="large" />
          <h3 style={{ marginTop: 20 }}>支付处理中...</h3>
          <p style={{ color: '#999' }}>
            {method === 'simulated' ? '模拟支付确认中，请稍候' : '正在等待支付确认'}
          </p>
          <p style={{ fontSize: 18, color: '#f5222d' }}>¥{amount.toFixed(2)}</p>
        </div>
      )}

      {status === 'paid' && (
        <Result status="success" title="支付成功"
          subTitle={`订单 ${orderNo} 已支付 ¥${amount.toFixed(2)}`}
          extra={<Button type="primary" onClick={handleClose}>完成</Button>}
        />
      )}

      {status === 'failed' && (
        <Result status="error" title="支付失败" subTitle={errMsg}
          extra={
            <Space>
              <Button onClick={() => setStatus('select')}>换种方式</Button>
              <Button onClick={handleClose}>稍后再付</Button>
            </Space>
          }
        />
      )}
    </Modal>
  );
}
