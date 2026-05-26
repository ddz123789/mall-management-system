import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Space, Tag, Popconfirm, message, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { couponsAPI } from '../../api';
import type { Coupon } from '../../types';
import dayjs from 'dayjs';

export default function Coupons() {
  const [data, setData] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await couponsAPI.list();
      setData(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const onFinish = async (values: any) => {
    const payload = { ...values, startDate: values.dateRange[0].toISOString(), endDate: values.dateRange[1].toISOString() };
    delete payload.dateRange;
    if (editing) {
      await couponsAPI.update(editing.id, payload);
    } else {
      await couponsAPI.create(payload);
    }
    message.success(editing ? '更新成功' : '创建成功');
    setModalOpen(false); setEditing(null); form.resetFields();
    fetchData();
  };

  const onDelete = async (id: number) => {
    await couponsAPI.delete(id);
    message.success('删除成功');
    fetchData();
  };

  const columns = [
    { title: '名称', dataIndex: 'name' },
    {
      title: '类型', dataIndex: 'type',
      render: (v: string) => <Tag>{v === 'fixed' ? '满减' : '折扣'}</Tag>,
    },
    {
      title: '面值', dataIndex: 'value',
      render: (v: number, r: Coupon) => r.type === 'fixed' ? `¥${v}` : `${v}%`,
    },
    { title: '最低消费', dataIndex: 'minAmount', render: (v: number) => `¥${v}` },
    { title: '开始', dataIndex: 'startDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    { title: '结束', dataIndex: 'endDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    {
      title: '状态', dataIndex: 'status',
      render: (v: string) => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作', width: 200,
      render: (_: any, record: Coupon) => (
        <Space>
          <Button size="small" onClick={() => { setEditing(record); form.setFieldsValue({ ...record, dateRange: [dayjs(record.startDate), dayjs(record.endDate)] }); setModalOpen(true); }}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => onDelete(record.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="优惠券管理" extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>
        新增优惠券
      </Button>
    }>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={false} />
      <Modal title={editing ? '编辑优惠券' : '新增优惠券'} open={modalOpen} onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="类型" initialValue="fixed">
            <Select options={[{ label: '满减', value: 'fixed' }, { label: '折扣', value: 'percent' }]} />
          </Form.Item>
          <Form.Item name="value" label="面值（满减金额或折扣百分比）" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="minAmount" label="最低消费金额" initialValue={0}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="dateRange" label="有效期" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
