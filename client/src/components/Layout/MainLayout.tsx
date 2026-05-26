import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, theme } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  AppstoreOutlined,
  UserOutlined,
  OrderedListOutlined,
  StarOutlined,
  GiftOutlined,
  CarOutlined,
  BarChartOutlined,
  InboxOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/admin/products', icon: <ShopOutlined />, label: '商品管理' },
  { key: '/admin/categories', icon: <AppstoreOutlined />, label: '分类管理', roles: ['admin'] },
  { key: '/admin/users', icon: <UserOutlined />, label: '用户管理', roles: ['admin'] },
  { key: '/admin/orders', icon: <OrderedListOutlined />, label: '订单管理' },
  { key: '/admin/inventory', icon: <InboxOutlined />, label: '库存管理', roles: ['admin', 'seller'] },
  { key: '/admin/reviews', icon: <StarOutlined />, label: '评价管理' },
  { key: '/admin/coupons', icon: <GiftOutlined />, label: '优惠券', roles: ['admin'] },
  { key: '/admin/logistics', icon: <CarOutlined />, label: '物流追踪', roles: ['admin', 'seller'] },
  { key: '/admin/reports', icon: <BarChartOutlined />, label: '报表', roles: ['admin'] },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: { colorBgContainer } } = theme.useToken();

  const filteredMenu = menuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || '');
  });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: 48, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShopOutlined style={{ fontSize: collapsed ? 20 : 28, color: '#1890ff' }} />
          {!collapsed && <span style={{ color: '#fff', marginLeft: 10, fontSize: 18, fontWeight: 600 }}>商城管理</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname === '/admin' ? '/admin' : location.pathname]}
          items={filteredMenu}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
            <Button type="link" icon={<HomeOutlined />} onClick={() => navigate('/')}>返回商城</Button>
          </div>
          <Dropdown
            menu={{
              items: [
                { key: 'role', label: `角色: ${user?.role === 'admin' ? '管理员' : user?.role === 'seller' ? '商家' : '用户'}`, disabled: true },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
              ],
              onClick: ({ key }) => key === 'logout' && (logout(), navigate('/login')),
            }}
          >
            <Button type="text" icon={<UserOutlined />}>{user?.username}</Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: colorBgContainer, borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
