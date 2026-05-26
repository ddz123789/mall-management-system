import { useEffect, useState } from 'react';
import { Table, Button, Modal, InputNumber, Input, Space, Tag, message, Card, Tabs } from 'antd';
import { inventoryAPI } from '../../api';
import type { Product, InventoryLog } from '../../types';

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [total, setTotal] = useState(0);
  const [logTotal, setLogTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [remark, setRemark] = useState('');
  const [keyword, setKeyword] = useState('');
  const [tab, setTab] = useState('products');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await inventoryAPI.list({ page, pageSize, keyword });
      setProducts(data.list); setTotal(data.total);
    } finally { setLoading(false); }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await inventoryAPI.logs({ page, pageSize });
      setLogs(data.list); setLogTotal(data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (tab === 'products') fetchProducts(); else fetchLogs(); }, [page, pageSize, tab, keyword]);

  const onAdjust = async () => {
    if (!adjusting) return;
    await inventoryAPI.adjust({ productId: adjusting.id, quantity, remark });
    message.success('库存调整成功');
    setAdjustOpen(false); setAdjusting(null);
    fetchProducts();
  };

  return (
    <Card title="库存管理">
      <Tabs activeKey={tab} onChange={setTab}>
        <Tabs.TabPane tab="库存列表" key="products">
          <Input.Search placeholder="搜索商品" onSearch={setKeyword} style={{ width: 250, marginBottom: 16 }} />
          <Table columns={[
            { title: '商品', dataIndex: 'name' },
            { title: '价格', dataIndex: 'price', render: (v: number) => `¥${v.toFixed(2)}` },
            { title: '库存', dataIndex: 'stock', render: (v: number) => <Tag color={v < 10 ? 'red' : v < 50 ? 'orange' : 'green'}>{v}</Tag> },
            { title: '销量', dataIndex: 'sales' },
            { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'on' ? 'green' : 'red'}>{v === 'on' ? '上架' : '下架'}</Tag> },
            { title: '操作', render: (_: any, r: Product) => <Button size="small" onClick={() => { setAdjusting(r); setQuantity(0); setRemark(''); setAdjustOpen(true); }}>调整库存</Button> },
          ]} dataSource={products} rowKey="id" loading={loading}
            pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="库存日志" key="logs">
          <Table columns={[
            { title: '商品', dataIndex: ['product', 'name'] },
            { title: '变动数量', dataIndex: 'quantity', render: (v: number) => <span style={{ color: v > 0 ? 'green' : 'red' }}>{v > 0 ? '+' : ''}{v}</span> },
            { title: '类型', dataIndex: 'type', render: (v: string) => <Tag>{v === 'in' ? '入库' : v === 'out' ? '出库' : '订单'}</Tag> },
            { title: '备注', dataIndex: 'remark' },
            { title: '时间', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleString() },
          ]} dataSource={logs} rowKey="id" loading={loading}
            pagination={{ current: page, pageSize, total: logTotal, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }} />
        </Tabs.TabPane>
      </Tabs>

      <Modal title="调整库存" open={adjustOpen} onCancel={() => setAdjustOpen(false)} onOk={onAdjust}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>商品: {adjusting?.name}</div>
          <div>当前库存: {adjusting?.stock}</div>
          <InputNumber placeholder="变动数量（正数入库、负数出库）" value={quantity} onChange={(v) => setQuantity(v || 0)} style={{ width: '100%' }} />
          <Input placeholder="备注" value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Space>
      </Modal>
    </Card>
  );
}
