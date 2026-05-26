import { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Layout, Menu, Button, Badge, Dropdown, Input, Space, message } from 'antd';
import {
  ShopOutlined, ShoppingCartOutlined, UserOutlined, OrderedListOutlined,
  LogoutOutlined, HomeOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store';
import { cartAPI } from '../../api';
import { useEffect } from 'react';

const { Header, Content, Footer } = Layout;

export default function StoreLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [keyword, setKeyword] = useState('');

  const fetchCartCount = async () => {
    if (!user) return;
    try {
      const { data } = await cartAPI.list();
      setCartCount((data || []).length);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchCartCount(); }, [user]);

  const doLogout = () => { logout(); navigate('/login'); };

  return (
    <Layout>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 50px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShopOutlined style={{ fontSize: 24, color: '#1677ff' }} />
            <span style={{ fontSize: 18, fontWeight: 600 }}>商城</span>
          </Link>
          <Input.Search placeholder="搜索商品" style={{ width: 300 }} value={keyword} onChange={(e) => setKeyword(e.target.value)}
            onSearch={(v) => { if (v) navigate(`/?keyword=${v}`); else navigate('/'); }} />
        </div>
        <Space size="large">
          <Badge count={cartCount} size="small">
            <ShoppingCartOutlined style={{ fontSize: 20, cursor: 'pointer' }} onClick={() => navigate('/cart')} />
          </Badge>
          {user ? (
            <Dropdown menu={{
              items: [
                { key: 'orders', icon: <OrderedListOutlined />, label: '我的订单' },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: '退出', danger: true },
              ],
              onClick: ({ key }) => {
                if (key === 'orders') navigate('/orders');
                if (key === 'logout') doLogout();
              },
            }}>
              <Button type="text" icon={<UserOutlined />}>{user.username}</Button>
            </Dropdown>
          ) : (
            <Button type="primary" onClick={() => navigate('/login')}>登录</Button>
          )}
        </Space>
      </Header>
      <Content style={{ minHeight: 'calc(100vh - 134px)', background: '#f5f5f5', padding: '24px 50px' }}>
        <Outlet context={{ fetchCartCount }} />
      </Content>
      <Footer style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
        商城系统 &copy; {new Date().getFullYear()}
      </Footer>
    </Layout>
  );
}
