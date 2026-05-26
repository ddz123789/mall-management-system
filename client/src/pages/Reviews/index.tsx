import { useEffect, useState } from 'react';
import { Table, Button, Modal, Rate, Input, Space, Popconfirm, message, Card } from 'antd';
import { reviewsAPI, productsAPI, ordersAPI } from '../../api';
import type { Review, Product, Order } from '../../types';

export default function Reviews() {
  const [data, setData] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState({ productId: 0, orderId: 0, rating: 5, content: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await reviewsAPI.list({ page, pageSize });
      setData(data.list); setTotal(data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, pageSize]);

  const onSubmit = async () => {
    if (editing) {
      await reviewsAPI.update(editing.id, form);
    } else {
      await reviewsAPI.create(form);
    }
    message.success(editing ? '更新成功' : '发布成功');
    setModalOpen(false); setEditing(null);
    fetchData();
  };

  const onDelete = async (id: number) => {
    await reviewsAPI.delete(id);
    message.success('删除成功');
    fetchData();
  };

  const columns = [
    { title: '用户', dataIndex: ['user', 'username'] },
    { title: '商品', dataIndex: ['product', 'name'] },
    { title: '评分', dataIndex: 'rating', render: (v: number) => <Rate disabled value={v} style={{ fontSize: 14 }} /> },
    { title: '内容', dataIndex: 'content', ellipsis: true },
    { title: '时间', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString() },
    {
      title: '操作', width: 200,
      render: (_: any, record: Review) => (
        <Space>
          <Button size="small" onClick={() => { setEditing(record); setForm({ productId: record.productId, orderId: record.orderId || 0, rating: record.rating, content: record.content || '' }); setModalOpen(true); }}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => onDelete(record.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="评价管理" extra={
      <Button type="primary" onClick={async () => {
        const p = await productsAPI.list({ pageSize: 100 });
        setProducts(p.data.list);
        setEditing(null); setForm({ productId: 0, orderId: 0, rating: 5, content: '' }); setModalOpen(true);
      }}>发布评价</Button>
    }>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }} />

      <Modal title={editing ? '编辑评价' : '发布评价'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={onSubmit}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>商品</div>
          <select style={{ width: '100%', padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: 6 }}
            value={form.productId || undefined} onChange={(e) => setForm({ ...form, productId: Number(e.target.value) })}>
            <option value="">选择商品</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div>评分</div>
          <Rate value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
          <div>内容</div>
          <Input.TextArea rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </Space>
      </Modal>
    </Card>
  );
}
