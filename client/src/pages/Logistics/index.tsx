import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Tag, message, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { logisticsAPI, ordersAPI } from '../../api';
import type { Logistics } from '../../types';

export default function LogisticsPage() {
  const [data, setData] = useState<Logistics[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await logisticsAPI.list();
      setData(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const onFinish = async (values: any) => {
    await logisticsAPI.create(values);
    message.success('创建成功');
    setModalOpen(false); form.resetFields();
    fetchData();
  };

  const onUpdate = async (record: Logistics) => {
    const newStatus = record.status === 'pending' ? 'shipped' : record.status === 'shipped' ? 'delivered' : 'delivered';
    await logisticsAPI.update(record.id, { status: newStatus });
    message.success('状态已更新');
    fetchData();
  };

  const statusMap: Record<string, string> = { pending: '待揽件', shipped: '运输中', delivered: '已送达' };

  const columns = [
    { title: '订单号', dataIndex: ['order', 'orderNo'] },
    { title: '快递公司', dataIndex: 'company' },
    { title: '快递单号', dataIndex: 'trackingNo' },
    {
      title: '状态', dataIndex: 'status',
      render: (v: string) => <Tag color={v === 'delivered' ? 'green' : v === 'shipped' ? 'blue' : 'orange'}>{statusMap[v] || v}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleString() },
    {
      title: '操作', width: 180,
      render: (_: any, record: Logistics) => (
        <Space>
          <Button size="small" onClick={() => onUpdate(record)}>
            {record.status === 'pending' ? '揽件' : record.status === 'shipped' ? '送达' : '更新'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="物流追踪" extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
        添加快递
      </Button>
    }>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      <Modal title="添加快递" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="orderId" label="订单ID" rules={[{ required: true }]}><Input type="number" /></Form.Item>
          <Form.Item name="company" label="快递公司" rules={[{ required: true }]}>
            <Select options={['顺丰速运', '中通快递', '圆通速递', '韵达快递', '京东物流'].map((c) => ({ label: c, value: c }))} />
          </Form.Item>
          <Form.Item name="trackingNo" label="快递单号" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
