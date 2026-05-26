import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Button, DatePicker, Space, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { dashboardAPI, ordersAPI } from '../../api';
import type { SalesTrend, Product, Order } from '../../types';
import dayjs from 'dayjs';

echarts.use([LineChart, BarChart, PieChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer]);

export default function Reports() {
  const [trend, setTrend] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.salesTrend(30),
      dashboardAPI.topProducts(),
      ordersAPI.list({ pageSize: 100 }),
    ]).then(([t, p, o]) => {
      setTrend(t.data);
      setTopProducts(p.data);
      setOrders(o.data.list);
    }).finally(() => setLoading(false));
  }, []);

  const exportOrders = () => {
    const headers = ['订单号', '用户', '金额', '状态', '支付状态', '时间'];
    const rows = orders.map((o) => [o.orderNo, o.user?.username || '', o.totalAmount.toFixed(2), o.status, o.paymentStatus, dayjs(o.createdAt).format('YYYY-MM-DD HH:mm')]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `orders-${dayjs().format('YYYYMMDD')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('导出成功');
  };

  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="30天销售趋势">
            <ReactEChartsCore echarts={echarts} style={{ height: 300 }}
              option={{
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: trend.map((t) => t.date) },
                yAxis: { type: 'value' },
                series: [{ name: '销售额', type: 'line', data: trend.map((t) => t.amount), smooth: true, areaStyle: { opacity: 0.3 } }],
              }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="热销商品">
            <ReactEChartsCore echarts={echarts} style={{ height: 300 }}
              option={{
                tooltip: { trigger: 'item' },
                series: [{
                  type: 'pie', radius: ['40%', '70%'],
                  data: topProducts.map((p) => ({ name: p.name, value: p.sales })),
                }],
              }}
            />
          </Card>
        </Col>
      </Row>
      <Card title="订单数据" style={{ marginTop: 16 }} extra={<Button icon={<DownloadOutlined />} onClick={exportOrders}>导出 CSV</Button>}>
        <Table dataSource={orders} rowKey="id" loading={loading} pagination={{ pageSize: 10 }}
          columns={[
            { title: '订单号', dataIndex: 'orderNo' },
            { title: '用户', dataIndex: ['user', 'username'] },
            { title: '金额', dataIndex: 'totalAmount', render: (v: number) => `¥${v.toFixed(2)}` },
            { title: '状态', dataIndex: 'status' },
            { title: '支付', dataIndex: 'paymentStatus' },
            { title: '时间', dataIndex: 'createdAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
          ]}
        />
      </Card>
    </div>
  );
}
