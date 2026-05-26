import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, InputNumber, Popconfirm, message, Card, Modal, Input, Empty, Space } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { cartAPI, ordersAPI } from '../../api';
import { useAuthStore } from '../../store';
import PaymentModal from '../../components/common/PaymentModal';
import type { CartItem } from '../../types';

export default function Cart() {
  const [data, setData] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [orderOpen, setOrderOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [payOrder, setPayOrder] = useState<{ orderNo: string; amount: number } | null>(null);
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
    setSelected(selected.filter((s) => s !== id));
    message.success('已移除');
    fetchData();
  };

  const placeOrder = async () => {
    if (!address.trim()) { message.error('请输入收货地址'); return; }
    if (selected.length === 0) { message.error('请选择要结算的商品'); return; }
    setSubmitting(true);
    try {
      const items = data
        .filter((d) => selected.includes(d.id))
        .map((d) => ({ productId: d.productId, quantity: d.quantity }));
      const res = await ordersAPI.create({ items, address: address.trim() });
      message.success('下单成功，请支付');
      setOrderOpen(false);
      setSelected([]);
      setAddress('');
      setPayOrder({ orderNo: res.data.orderNo, amount: res.data.totalAmount });
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || '下单失败，请重试');
    } finally { setSubmitting(false); }
  };

  const selectAll = data.length > 0 && selected.length === data.length;
  const selectedTotal = data
    .filter((d) => selected.includes(d.id))
    .reduce((sum, d) => sum + d.product.price * d.quantity, 0);

  if (!loading && data.length === 0) {
    return (
      <Card>
        <Empty description="购物车是空的" image={<ShoppingCartOutlined style={{ fontSize: 80, color: '#ddd' }} />}>
          <Button type="primary" onClick={() => navigate('/')}>去逛逛</Button>
        </Empty>
      </Card>
    );
  }

  const columns = [
    { title: '商品名称', dataIndex: ['product', 'name'] },
    { title: '单价', dataIndex: ['product', 'price'], render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '数量', dataIndex: 'quantity', width: 120, render: (v: number, r: CartItem) => <InputNumber min={1} max={r.product.stock} value={v} onChange={(val) => val && updateQty(r.id, val)} /> },
    { title: '小计', render: (_: any, r: CartItem) => <strong>¥{(r.product.price * r.quantity).toFixed(2)}</strong> },
    { title: '操作', width: 80, render: (_: any, r: CartItem) => <Popconfirm title="移除该商品?" onConfirm={() => onDelete(r.id)}><Button size="small" danger>移除</Button></Popconfirm> },
  ];

  return (
    <Card title={`购物车 (${data.length} 件商品)`}>
      <Table
        rowSelection={{
          selectedRowKeys: selected,
          onChange: (keys) => setSelected(keys as number[]),
          onSelectAll: (_, __, changeRows) => {
            if (changeRows.length > 0) setSelected(data.map((d) => d.id));
            else setSelected([]);
          },
        }}
        columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={false}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 24, marginTop: 24, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
        <span style={{ fontSize: 14, color: '#999' }}>已选 <strong>{selected.length}</strong> 件</span>
        <span style={{ fontSize: 20 }}>合计: <strong style={{ color: '#f5222d' }}>¥{selectedTotal.toFixed(2)}</strong></span>
        <Button type="primary" size="large" onClick={() => setOrderOpen(true)} disabled={selected.length === 0} loading={submitting}>
          去结算
        </Button>
      </div>

      <Modal title="确认订单" open={orderOpen} onCancel={() => setOrderOpen(false)} onOk={placeOrder} okText="提交订单" confirmLoading={submitting}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <div style={{ marginBottom: 8 }}>下单商品：</div>
            {data.filter((d) => selected.includes(d.id)).map((d) => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>{d.product.name} × {d.quantity}</span>
                <span>¥{(d.product.price * d.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
              <strong>合计</strong><strong style={{ color: '#f5222d' }}>¥{selectedTotal.toFixed(2)}</strong>
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 8 }}>收货地址：</div>
            <Input.TextArea placeholder="请输入收货人、电话和详细地址" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </Space>
      </Modal>
      {payOrder && (
        <PaymentModal open={!!payOrder} orderNo={payOrder.orderNo} amount={payOrder.amount}
          onClose={() => setPayOrder(null)} onPaid={() => { message.success('支付成功！'); setPayOrder(null); }} />
      )}
    </Card>
  );
}
