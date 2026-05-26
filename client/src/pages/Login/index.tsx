import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ShopOutlined } from '@ant-design/icons';
import { authAPI } from '../../api';
import { useAuthStore } from '../../store';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('login');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const onLogin = async (values: any) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login(values);
      setAuth(data.user, data.token, data.refreshToken);
      message.success('登录成功');
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: any) => {
    setLoading(true);
    try {
      const { data } = await authAPI.register(values);
      setAuth(data.user, data.token, data.refreshToken);
      message.success('注册成功');
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <ShopOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <h2 style={{ marginTop: 12 }}>商城管理系统</h2>
        </div>
        <Tabs activeKey={tab} onChange={setTab} centered>
          <Tabs.TabPane tab="登录" key="login">
            <Form onFinish={onLogin} size="large">
              <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input prefix={<UserOutlined />} placeholder="用户名" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>登录</Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
          <Tabs.TabPane tab="注册" key="register">
            <Form onFinish={onRegister} size="large">
              <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input prefix={<UserOutlined />} placeholder="用户名" />
              </Form.Item>
              <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入有效的邮箱' }]}>
                <Input prefix={<MailOutlined />} placeholder="邮箱" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, min: 6, message: '密码至少6位' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>注册</Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
}
