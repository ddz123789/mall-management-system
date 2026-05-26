import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, InputNumber, Rate, Typography, Tag, Spin, message, List, Image } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { productsAPI, cartAPI } from '../../api';
import type { Product } from '../../types';
import { useAuthStore } from '../../store';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (id) productsAPI.get(Number(id)).then(({ data }) => setProduct(data)).finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    if (!user) { message.warning('请先登录'); navigate('/login'); return; }
    await cartAPI.add({ productId: Number(id), quantity: qty });
    message.success('已加入购物车');
  };

  const buyNow = async () => {
    if (!user) { message.warning('请先登录'); navigate('/login'); return; }
    navigate('/cart');
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!product) return <div style={{ textAlign: 'center', padding: 100 }}>商品不存在</div>;

  let images: string[] = [];
  try { images = JSON.parse(product.images || '[]'); } catch { /* ignore */ }

  return (
    <Card>
      <Row gutter={[32, 24]}>
        <Col xs={24} md={10}>
          {images.length > 0 ? (
            <Image.PreviewGroup>
              <Image src={images[0]} alt={product.name} style={{ width: '100%', borderRadius: 8 }} />
            </Image.PreviewGroup>
          ) : (
            <div style={{ width: '100%', height: 360, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
              <ShoppingCartOutlined style={{ fontSize: 64, color: '#ddd' }} />
            </div>
          )}
        </Col>
        <Col xs={24} md={14}>
          <Typography.Title level={3}>{product.name}</Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 16, lineHeight: 2 }}>¥{product.price.toFixed(2)}</Typography.Text>
          <Typography.Text type="danger" strong style={{ fontSize: 28, display: 'block', marginBottom: 16 }}>¥{product.price.toFixed(2)}</Typography.Text>
          <div style={{ marginBottom: 16 }}>库存: {product.stock > 0 ? <Tag color="green">有货 ({product.stock})</Tag> : <Tag color="red">缺货</Tag>} | 已售: {product.sales}</div>
          {product.description && <Typography.Paragraph style={{ marginBottom: 24 }}>{product.description}</Typography.Paragraph>}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
            <span>数量:</span>
            <InputNumber min={1} max={product.stock} value={qty} onChange={(v) => setQty(v || 1)} />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Button type="primary" size="large" icon={<ShoppingCartOutlined />} onClick={addToCart}>加入购物车</Button>
            <Button size="large" onClick={buyNow}>立即购买</Button>
          </div>
        </Col>
      </Row>
      {product.reviews && product.reviews.length > 0 && (
        <Card title="用户评价" style={{ marginTop: 32 }}>
          <List dataSource={product.reviews} renderItem={(r) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Rate disabled value={r.rating} style={{ fontSize: 14 }} />}
                title={r.user?.username || '匿名'}
                description={r.content}
              />
            </List.Item>
          )} />
        </Card>
      )}
    </Card>
  );
}
