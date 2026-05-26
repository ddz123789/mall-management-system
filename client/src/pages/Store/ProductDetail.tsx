import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, InputNumber, Typography, Tag, Spin, message, List, Image, Modal, Input, Space } from 'antd';
import { ShoppingCartOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { productsAPI, cartAPI, ordersAPI } from '../../api';
import { useAuthStore } from '../../store';
import PaymentModal from '../../components/common/PaymentModal';
import type { Product } from '../../types';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [buyOpen, setBuyOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [buying, setBuying] = useState(false);
  const [payOrder, setPayOrder] = useState<{ orderNo: string; amount: number } | null>(null);

  useEffect(() => {
    if (id) productsAPI.get(Number(id)).then(({ data }) => setProduct(data)).finally(() => setLoading(false));
  }, [id]);

  const checkLogin = () => {
    if (!user) { message.warning('请先登录'); navigate('/login'); return false; }
    return true;
  };

  const addToCart = async () => {
    if (!checkLogin()) return;
    await cartAPI.add({ productId: Number(id), quantity: qty });
    message.success('已加入购物车');
  };

  const buyNow = () => {
    if (!checkLogin()) return;
    setAddress('');
    setBuyOpen(true);
  };

  const confirmBuy = async () => {
    if (!address.trim()) { message.error('请输入收货地址'); return; }
    setBuying(true);
    try {
      const items = [{ productId: Number(id), quantity: qty }];
      const { data } = await ordersAPI.create({ items, address: address.trim() });
      message.success('下单成功，请支付');
      setBuyOpen(false);
      setPayOrder({ orderNo: data.orderNo, amount: data.totalAmount });
    } catch (err: any) {
      message.error(err.response?.data?.message || '下单失败');
    } finally { setBuying(false); }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!product) return <div style={{ textAlign: 'center', padding: 100, color: '#999' }}>商品不存在</div>;

  let images: string[] = [];
  try { images = JSON.parse(product.images || '[]'); } catch { /* ignore */ }

  return (
    <Card>
      <Row gutter={[32, 24]}>
        <Col xs={24} md={10}>
          {images.length > 0 ? (
            <Image.PreviewGroup><Image src={images[0]} alt={product.name} style={{ width: '100%', borderRadius: 8 }} /></Image.PreviewGroup>
          ) : (
            <div style={{ width: '100%', height: 360, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
              <ShoppingCartOutlined style={{ fontSize: 64, color: '#ddd' }} />
            </div>
          )}
        </Col>
        <Col xs={24} md={14}>
          <Typography.Title level={3}>{product.name}</Typography.Title>
          <Typography.Text type="danger" strong style={{ fontSize: 28, display: 'block', marginBottom: 16 }}>¥{product.price.toFixed(2)}</Typography.Text>
          <div style={{ marginBottom: 16 }}>库存: {product.stock > 0 ? <Tag color="green">有货 ({product.stock})</Tag> : <Tag color="red">缺货</Tag>} | 已售: {product.sales}</div>
          {product.description && <Typography.Paragraph style={{ color: '#666', marginBottom: 24 }}>{product.description}</Typography.Paragraph>}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
            <span>数量:</span>
            <InputNumber min={1} max={product.stock} value={qty} onChange={(v) => setQty(v || 1)} />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Button type="primary" size="large" icon={<ThunderboltOutlined />} onClick={buyNow} disabled={product.stock < 1}>立即购买</Button>
            <Button size="large" icon={<ShoppingCartOutlined />} onClick={addToCart} disabled={product.stock < 1}>加入购物车</Button>
          </div>
        </Col>
      </Row>

      <Modal title="确认订单" open={buyOpen} onCancel={() => setBuyOpen(false)} onOk={confirmBuy} okText="提交订单" confirmLoading={buying}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{product.name} × {qty}</span>
            <strong style={{ color: '#f5222d', fontSize: 18 }}>¥{(product.price * qty).toFixed(2)}</strong>
          </div>
          <div><div style={{ marginBottom: 8 }}>收货地址：</div>
            <Input.TextArea placeholder="请输入收货人、电话和详细地址" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </Space>
      </Modal>

      {payOrder && (
        <PaymentModal open={!!payOrder} orderNo={payOrder.orderNo} amount={payOrder.amount}
          onClose={() => setPayOrder(null)} onPaid={() => { message.success('支付成功！可在「我的订单」查看物流'); setPayOrder(null); }} />
      )}

      {product.reviews && product.reviews.length > 0 && (
        <Card title="用户评价" style={{ marginTop: 32 }}>
          <List dataSource={product.reviews} renderItem={(r) => (
            <List.Item><List.Item.Meta title={r.user?.username || '匿名'} description={r.content} /></List.Item>
          )} />
        </Card>
      )}
    </Card>
  );
}
