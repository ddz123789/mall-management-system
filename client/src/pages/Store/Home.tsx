import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Spin, Tag, Input, Carousel, Typography } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { productsAPI, categoriesAPI } from '../../api';
import type { Product, Category } from '../../types';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const keyword = searchParams.get('keyword') || '';

  useEffect(() => {
    Promise.all([productsAPI.list({ pageSize: 100, keyword }), categoriesAPI.list()])
      .then(([p, c]) => { setProducts(p.data.list); setCategories(c.data); })
      .finally(() => setLoading(false));
  }, [keyword]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Tag color="blue" style={{ cursor: 'pointer', padding: '4px 12px' }} onClick={() => navigate('/')}>全部</Tag>
          {categories.map((c) => (
            <Tag key={c.id} style={{ cursor: 'pointer', padding: '4px 12px' }} onClick={() => navigate(`/?keyword=${c.name}`)}>{c.name}</Tag>
          ))}
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {products.filter((p) => p.status === 'on').map((p) => (
          <Col xs={24} sm={12} md={8} lg={6} key={p.id}>
            <Card
              hoverable
              cover={(() => {
                try {
                  const imgs = JSON.parse(p.images || '[]');
                  if (imgs[0]) return <img src={imgs[0]} alt={p.name} style={{ height: 200, objectFit: 'cover' }} />;
                } catch { /* ignore */ }
                return <div style={{ height: 200, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCartOutlined style={{ fontSize: 48, color: '#ddd' }} />
                </div>;
              })()}
              onClick={() => navigate(`/product/${p.id}`)}
            >
              <Card.Meta
                title={<Typography.Text ellipsis>{p.name}</Typography.Text>}
                description={
                  <div>
                    <Typography.Text type="danger" strong style={{ fontSize: 18 }}>¥{p.price.toFixed(2)}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary">已售 {p.sales}</Typography.Text>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
