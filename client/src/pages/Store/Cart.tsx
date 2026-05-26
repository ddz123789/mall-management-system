import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, InputNumber, Space, Popconfirm, message, Card, Modal, Input } from 'antd';
import { cartAPI, ordersAPI } from '../../api';
import { useAuthStore } from '../../store';
import type { CartItem } from '../../types';

export default function Cart() {
  const [data, setData] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [orderOpen, setOrderOpen] = useState(false);
  const [address, setAddress] = useState('');
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try { const { data } = await cartAPI.list(); setData(data); } finally { setLoading(false); }
  };

  const updateQty = async (id: number, qty: number) => {
    if (qty < 1) return;
    await cartAPI.update(id, qty);
    fetchData();
  };

  const onDelete = async (id: number) => {
    await cartAPI.delete(id);
    message.success('已移除');
    fetchData();
  };

  const placeOrder = async () => {
    if (!address) { message.error('请输入收货地址'); return; }
    const items = data.filter((d) => selected.includes(d.id)).map((d) => ({ productId: d.productId, quantity: d.quantity }));
    if (items.length === 0) { message.error('请选择商品'); return; }
    try {
      await ordersAPI.create({ items, address });
      message.success('下单成功');
      setOrderOpen(false);
      setSelected([]);
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || '下单失败');
    }
  };

  const selectedTotal = data.filter((d) => selected.includes(d.id)).reduce((sum, d) => sum + d.product.price * d.quantity, 0);

  const columns = [
    { title: '商品名称', dataIndex: ['product', 'name'] },
    { title: '单价', dataIndex: ['product', 'price'], render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '数量', dataIndex: 'quantity', render: (v: number, r: CartItem) => <InputNumber min={1} max={r.product.stock} value={v} onChange={(val) => val && updateQty(r.id, val)} /> },
    { title: '小计', render: (_: any, r: CartItem) => `¥${(r.product.price * r.quantity).toFixed(2)}` },
    { title: '操作', render: (_: any, r: CartItem) => <Popconfirm title="移除?" onConfirm={() => onDelete(r.id)}><Button size="small" danger>移除</Button></Popconfirm> },
  ];

  return (
    <Card title="购物车" extra={
      <Space>
        <span style={{ fontSize: 16 }}>合计: <strong style={{ color: '#f5222d' }}>¥{selectedTotal.toFixed(2)}</strong></span>
        <Button type="primary" size="large" onClick={() => setOrderOpen(true)} disabled={selected.length === 0}>去结算</Button>
      </Space>
    }>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={false}
        rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys as number[]) }} />
      <Modal title="确认订单" open={orderOpen} onCancel={() => setOrderOpen(false)} onOk={placeOrder} okText="提交订单">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>商品数量: <strong>{selected.length}</strong> 种</div>
          <div style={{ fontSize: 18 }}>合计: <strong style={{ color: '#f5222d' }}>¥{selectedTotal.toFixed(2)}</strong></div>
          <Input.TextArea placeholder="请输入收货地址" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
        </Space>
      </Modal>
    </Card>
  );
}
