import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import { UserOutlined, ShopOutlined, OrderedListOutlined, DollarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { dashboardAPI } from '../../api';
import type { DashboardStats, SalesTrend, Product } from '../../types';

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer]);

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.stats(),
      dashboardAPI.salesTrend(7),
      dashboardAPI.topProducts(),
    ]).then(([s, t, p]) => {
      setStats(s.data);
      setTrend(t.data);
      setTopProducts(p.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="用户总数" value={stats?.userCount} prefix={<UserOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="商品总数" value={stats?.productCount} prefix={<ShopOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="订单总数" value={stats?.orderCount} prefix={<OrderedListOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="销售额" value={stats?.totalSales} prefix={<DollarOutlined />} precision={2} /></Card></Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}><Card><Statistic title="待处理订单" value={stats?.pendingOrders} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#cf1322' }} /></Card></Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card title="销售趋势（近7天）">
            <ReactEChartsCore
              echarts={echarts}
              option={{
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: trend.map((t) => t.date) },
                yAxis: { type: 'value' },
                series: [{ name: '销售额', type: 'line', data: trend.map((t) => t.amount), smooth: true }],
              }}
              style={{ height: 300 }}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="热销商品 TOP10">
            <ReactEChartsCore
              echarts={echarts}
              option={{
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'value' },
                yAxis: { type: 'category', data: topProducts.map((p) => p.name).reverse() },
                series: [{ type: 'bar', data: topProducts.map((p) => p.sales).reverse() }],
              }}
              style={{ height: 300 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
