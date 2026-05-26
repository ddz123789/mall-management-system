import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Select, Popconfirm, message, Card, Modal, Descriptions } from 'antd';
import { ordersAPI, logisticsAPI } from '../../api';
import type { Order } from '../../types';
import PaymentModal from './Payment';

const statusMap: Record<string, string> = {
  pending: '待发货', paid: '已付款', shipped: '已发货', delivered: '已送达', completed: '已完成', cancelled: '已取消',
};
const statusColors: Record<string, string> = {
  pending: 'orange', paid: 'blue', shipped: 'cyan', delivered: 'purple', completed: 'green', cancelled: 'red',
};

export default function Orders() {
  const [data, setData] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<Order | null>(null);
  const [logisticsOpen, setLogisticsOpen] = useState(false);
  const [logisticsForm, setLogisticsForm] = useState({ company: '', trackingNo: '' });
  const [payOpen, setPayOpen] = useState(false);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await ordersAPI.list({ page, pageSize });
      setData(data.list); setTotal(data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, pageSize]);

  const showDetail = async (id: number) => {
    const { data } = await ordersAPI.get(id);
    setDetail(data); setDetailOpen(true);
  };

  const updateStatus = async (id: number, status: string) => {
    await ordersAPI.updateStatus(id, status);
    message.success('状态已更新');
    fetchData();
  };

  const addLogistics = async () => {
    if (!detail) return;
    await logisticsAPI.create({
      orderId: detail.id,
      company: logisticsForm.company,
      trackingNo: logisticsForm.trackingNo,
    });
    await ordersAPI.updateStatus(detail.id, 'shipped');
    message.success('物流已添加');
    setLogisticsOpen(false);
    fetchData();
  };

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', width: 180 },
    { title: '用户', dataIndex: ['user', 'username'] },
    { title: '金额', dataIndex: 'totalAmount', render: (v: number) => `¥${v.toFixed(2)}` },
    {
      title: '状态', dataIndex: 'status',
      render: (v: string) => <Tag color={statusColors[v]}>{statusMap[v] || v}</Tag>,
    },
    {
      title: '支付', dataIndex: 'paymentStatus',
      render: (v: string) => <Tag color={v === 'paid' ? 'green' : 'red'}>{v === 'paid' ? '已支付' : '未支付'}</Tag>,
    },
    {
      title: '操作', width: 280,
      render: (_: any, record: Order) => (
        <Space>
          <Button size="small" onClick={() => showDetail(record.id)}>详情</Button>
          {record.paymentStatus === 'unpaid' && (
            <Button size="small" type="primary" onClick={() => { setPayingOrder(record); setPayOpen(true); }}>去支付</Button>
          )}
          {record.status === 'paid' && (
            <Button size="small" onClick={() => { setDetail(record); setLogisticsOpen(true); }}>发货</Button>
          )}
          <Select size="small" placeholder="改状态" style={{ width: 100 }}
            value={undefined as unknown as string}
            onChange={(v) => updateStatus(record.id, v)}
            options={Object.entries(statusMap).map(([k, v]) => ({ label: v, value: k }))}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card title="订单管理">
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }} />

      <Modal title="订单详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={700}>
        {detail && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="订单号">{detail.orderNo}</Descriptions.Item>
            <Descriptions.Item label="用户">{detail.user?.username}</Descriptions.Item>
            <Descriptions.Item label="金额">¥{detail.totalAmount.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="状态">{statusMap[detail.status]}</Descriptions.Item>
            <Descriptions.Item label="支付方式">{detail.paymentMethod}</Descriptions.Item>
            <Descriptions.Item label="支付状态">{detail.paymentStatus === 'paid' ? '已支付' : '未支付'}</Descriptions.Item>
            <Descriptions.Item label="地址" span={2}>{detail.address}</Descriptions.Item>
          </Descriptions>
        )}
        {detail?.items && (
          <Table style={{ marginTop: 16 }} dataSource={detail.items} rowKey="id" pagination={false}
            columns={[
              { title: '商品', dataIndex: ['product', 'name'] },
              { title: '单价', dataIndex: 'price', render: (v: number) => `¥${v.toFixed(2)}` },
              { title: '数量', dataIndex: 'quantity' },
            ]}
          />
        )}
      </Modal>

      <Modal title="添加物流" open={logisticsOpen} onCancel={() => setLogisticsOpen(false)} onOk={addLogistics}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select placeholder="快递公司" style={{ width: '100%' }} value={logisticsForm.company || undefined} onChange={(v) => setLogisticsForm({ ...logisticsForm, company: v })}
            options={['顺丰速运', '中通快递', '圆通速递', '韵达快递', '京东物流'].map((c) => ({ label: c, value: c }))} />
          <input placeholder="快递单号" style={{ width: '100%', padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: 6 }}
            value={logisticsForm.trackingNo} onChange={(e) => setLogisticsForm({ ...logisticsForm, trackingNo: e.target.value })} />
        </Space>
      </Modal>
      {payingOrder && (
        <PaymentModal open={payOpen} orderNo={payingOrder.orderNo} amount={payingOrder.totalAmount}
          onClose={() => { setPayOpen(false); setPayingOrder(null); }} onPaid={fetchData} />
      )}
    </Card>
  );
}
