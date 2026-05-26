import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Popconfirm, message, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { categoriesAPI } from '../../api';
import type { Category } from '../../types';

export default function Categories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await categoriesAPI.list();
      const flat: any[] = [];
      const walk = (cats: Category[], level = 0) => {
        cats.forEach((c) => { flat.push({ ...c, key: c.id, _level: level }); if (c.children) walk(c.children, level + 1); });
      };
      walk(data);
      setData(flat);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const onFinish = async (values: any) => {
    if (editing) {
      await categoriesAPI.update(editing.id, values);
    } else {
      await categoriesAPI.create(values);
    }
    message.success(editing ? '更新成功' : '创建成功');
    setModalOpen(false); setEditing(null); form.resetFields();
    fetchData();
  };

  const onDelete = async (id: number) => {
    await categoriesAPI.delete(id);
    message.success('删除成功');
    fetchData();
  };

  const columns = [
    { title: '名称', dataIndex: 'name', render: (v: string, r: any) => `${'　'.repeat(r._level)}${v}` },
    { title: '描述', dataIndex: 'description' },
    { title: '排序', dataIndex: 'sort', width: 80 },
    {
      title: '操作', width: 200,
      render: (_: any, record: Category) => (
        <Space>
          <Button size="small" onClick={() => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); }}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => onDelete(record.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="分类管理" extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>
        新增分类
      </Button>
    }>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={false} />
      <Modal title={editing ? '编辑分类' : '新增分类'} open={modalOpen} onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="分类名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="parentId" label="父级分类">
            <Select allowClear placeholder="不选则为顶级分类" options={data.filter((c) => c.id !== editing?.id).map((c) => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Form.Item name="sort" label="排序"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
