import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Tag, Popconfirm, message, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { usersAPI } from '../../api';
import type { User } from '../../types';

export default function Users() {
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await usersAPI.list({ page, pageSize, keyword });
      setData(data.list); setTotal(data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, pageSize, keyword]);

  const onFinish = async (values: any) => {
    if (editing) {
      await usersAPI.update(editing.id, values);
    } else {
      await usersAPI.create(values);
    }
    message.success(editing ? '更新成功' : '创建成功');
    setModalOpen(false); setEditing(null); form.resetFields();
    fetchData();
  };

  const onDelete = async (id: number) => {
    await usersAPI.delete(id);
    message.success('删除成功');
    fetchData();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username' },
    { title: '邮箱', dataIndex: 'email' },
    {
      title: '角色', dataIndex: 'role',
      render: (v: string) => <Tag color={v === 'admin' ? 'red' : v === 'seller' ? 'blue' : 'green'}>{v === 'admin' ? '管理员' : v === 'seller' ? '商家' : '用户'}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status',
      render: (v: string) => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? '正常' : '禁用'}</Tag>,
    },
    {
      title: '操作', width: 200,
      render: (_: any, record: User) => (
        <Space>
          <Button size="small" onClick={() => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); }}>编辑</Button>
          <Button size="small" onClick={() => usersAPI.updateStatus(record.id, record.status === 'active' ? 'disabled' : 'active').then(fetchData)}>
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => onDelete(record.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="用户管理" extra={
      <Space>
        <Input.Search placeholder="搜索用户" onSearch={setKeyword} style={{ width: 200 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>新增用户</Button>
      </Space>
    }>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }} />
      <Modal title={editing ? '编辑用户' : '新增用户'} open={modalOpen} onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="password" label={editing ? '密码（留空不修改）' : '密码'} rules={editing ? [] : [{ required: true, min: 6 }]}><Input.Password /></Form.Item>
          <Form.Item name="role" label="角色"><Select options={[{ label: '用户', value: 'user' }, { label: '商家', value: 'seller' }, { label: '管理员', value: 'admin' }]} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
