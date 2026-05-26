import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Card, Button, Modal, Descriptions } from 'antd';
import { ordersAPI } from '../../api';
import { useAuthStore } from '../../store';
import type { Order } from '../../types';
import dayjs from 'dayjs';

const statusMap: Record<string, string> = {
  pending: '待付款', paid: '已付款', shipped: '已发货', delivered: '已送达', completed: '已完成', cancelled: '已取消',
};

export default function StoreOrders() {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<Order | null>(null);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    ordersAPI.list({ pageSize: 50 }).then(({ data }) => setData(data.list)).finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', width: 180 },
    { title: '金额', dataIndex: 'totalAmount', render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'completed' ? 'green' : v === 'cancelled' ? 'red' : 'blue'}>{statusMap[v] || v}</Tag> },
    { title: '时间', dataIndex: 'createdAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '操作', render: (_: any, r: Order) => <Button size="small" onClick={async () => { const { data } = await ordersAPI.get(r.id); setDetail(data); setDetailOpen(true); }}>详情</Button> },
  ];

  return (
    <Card title="我的订单">
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      <Modal title="订单详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={600}>
        {detail && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="订单号">{detail.orderNo}</Descriptions.Item>
            <Descriptions.Item label="金额">¥{detail.totalAmount.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="状态">{statusMap[detail.status]}</Descriptions.Item>
            <Descriptions.Item label="地址">{detail.address}</Descriptions.Item>
          </Descriptions>
        )}
        {detail?.items && (
          <Table style={{ marginTop: 16 }} dataSource={detail.items} rowKey="id" pagination={false}
            columns={[
              { title: '商品', dataIndex: ['product', 'name'] },
              { title: '单价', dataIndex: 'price', render: (v: number) => `¥${v.toFixed(2)}` },
              { title: '数量', dataIndex: 'quantity' },
            ]} />
        )}
      </Modal>
    </Card>
  );
}
