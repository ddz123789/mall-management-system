import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Tag, Popconfirm, Upload, message, Card } from 'antd';
import { PlusOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons';
import { productsAPI, categoriesAPI } from '../../api';
import type { Product, Category } from '../../types';

export default function Products() {
  const [data, setData] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await productsAPI.list({ page, pageSize, keyword });
      setData(data.list);
      setTotal(data.total);
    } finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    const { data } = await categoriesAPI.list();
    const flat: Category[] = [];
    const walk = (cats: Category[]) => {
      cats.forEach((c) => { flat.push(c); if (c.children) walk(c.children); });
    };
    walk(data); setCategories(flat);
  };

  useEffect(() => { fetchData(); }, [page, pageSize, keyword]);

  const onFinish = async (values: any) => {
    if (editing) {
      await productsAPI.update(editing.id, values);
    } else {
      await productsAPI.create(values);
    }
    message.success(editing ? '更新成功' : '创建成功');
    setModalOpen(false);
    setEditing(null);
    form.resetFields();
    fetchData();
  };

  const onDelete = async (id: number) => {
    await productsAPI.delete(id);
    message.success('删除成功');
    fetchData();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: 'name' },
    { title: '分类', dataIndex: ['category', 'name'] },
    {
      title: '价格', dataIndex: 'price', render: (v: number) => `¥${v.toFixed(2)}`,
    },
    { title: '库存', dataIndex: 'stock' },
    { title: '销量', dataIndex: 'sales' },
    {
      title: '状态', dataIndex: 'status',
      render: (v: string) => <Tag color={v === 'on' ? 'green' : 'red'}>{v === 'on' ? '上架' : '下架'}</Tag>,
    },
    {
      title: '操作', width: 220,
      render: (_: any, record: Product) => (
        <Space>
          <Button size="small" onClick={() => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); fetchCategories(); }}>编辑</Button>
          <Button size="small" onClick={() => productsAPI.update(record.id, { status: record.status === 'on' ? 'off' : 'on' }).then(() => fetchData())}>
            {record.status === 'on' ? '下架' : '上架'}
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => onDelete(record.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="商品管理" extra={
      <Space>
        <Input.Search placeholder="搜索商品" onSearch={setKeyword} style={{ width: 200 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); fetchCategories(); }}>
          新增商品
        </Button>
      </Space>
    }>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }} />
      <Modal title={editing ? '编辑商品' : '新增商品'} open={modalOpen} onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="商品名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="price" label="价格" rules={[{ required: true }]}><InputNumber min={0} step={0.01} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="categoryId" label="分类" rules={[{ required: true }]}>
            <Select options={categories.map((c) => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Form.Item name="stock" label="库存"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
