import { useEffect, useState } from 'react';
import { Table, Button, InputNumber, Space, Popconfirm, message, Card, Modal, Input } from 'antd';
import { cartAPI, ordersAPI } from '../../api';
import type { CartItem } from '../../types';

export default function Cart() {
  const [data, setData] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [orderOpen, setOrderOpen] = useState(false);
  const [address, setAddress] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await cartAPI.list();
      setData(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

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
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || '下单失败');
    }
  };

  const selectedTotal = data
    .filter((d) => selected.includes(d.id))
    .reduce((sum, d) => sum + d.product.price * d.quantity, 0);

  const columns = [
    { title: '商品图片', dataIndex: ['product', 'images'], width: 100, render: (v: string) => {
      try {
        const imgs = JSON.parse(v);
        return imgs[0] ? <img src={imgs[0]} alt="" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} /> : null;
      } catch { return null; }
    }},
    { title: '商品名称', dataIndex: ['product', 'name'] },
    { title: '单价', dataIndex: ['product', 'price'], render: (v: number) => `¥${v.toFixed(2)}` },
    {
      title: '数量', dataIndex: 'quantity',
      render: (v: number, record: CartItem) => (
        <InputNumber min={1} max={record.product.stock} value={v} onChange={(val) => val && updateQty(record.id, val)} />
      ),
    },
    {
      title: '小计', render: (_: any, record: CartItem) => `¥${(record.product.price * record.quantity).toFixed(2)}`,
    },
    {
      title: '操作',
      render: (_: any, record: CartItem) => (
        <Popconfirm title="确定移除?" onConfirm={() => onDelete(record.id)}>
          <Button size="small" danger>移除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card title="购物车" extra={
      <Space>
        <span>已选: ¥{selectedTotal.toFixed(2)}</span>
        <Button type="primary" onClick={() => setOrderOpen(true)} disabled={selected.length === 0}>结算</Button>
        <Popconfirm title="确定清空?" onConfirm={async () => { await cartAPI.clear(); fetchData(); }}>
          <Button danger>清空</Button>
        </Popconfirm>
      </Space>
    }>
      <Table
        columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={false}
        rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys as number[]) }}
      />
      <Modal title="确认订单" open={orderOpen} onCancel={() => setOrderOpen(false)} onOk={placeOrder}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>商品数量: {selected.length} 种</div>
          <div>合计金额: ¥{selectedTotal.toFixed(2)}</div>
          <Input.TextArea placeholder="收货地址" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
        </Space>
      </Modal>
    </Card>
  );
}
