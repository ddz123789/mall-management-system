# 商城管理系统

一个基于 React + Node.js + TypeScript 的全栈商城管理系统。

## 技术栈

- **前端**：React 18 + TypeScript + Vite + Ant Design 5 + Zustand + ECharts
- **后端**：Node.js + Express + TypeScript + Prisma + SQLite
- **认证**：JWT (Access Token + Refresh Token)

## 功能模块

- 仪表盘（数据统计、销售趋势、热销排行）
- 商品管理（CRUD、上下架、图片上传、分类管理）
- 用户管理（CRUD、角色权限、状态管理）
- 订单管理（下单、支付、发货、状态流转）
- 购物车（添加、结算）
- 库存管理（库存查看、调整、日志）
- 评价管理（评分、评论）
- 优惠券（满减/折扣、有效期管理）
- 物流追踪（快递单号、状态更新）
- 报表导出（CSV 导出、统计图表）

## 快速开始

### 1. 安装依赖

```bash
# 后端
cd server
npm install

# 前端
cd ../client
npm install
```

### 2. 初始化数据库

```bash
cd server
npm run db:push
npm run db:seed
```

### 3. 启动开发服务器

```bash
# 启动后端 (端口 3001)
cd server
npm run dev

# 启动前端 (端口 5173)
cd client
npm run dev
```

### 4. 访问

打开浏览器访问 http://localhost:5173

**默认管理员账号**：admin / admin123

## 角色权限

- **admin**：全部权限
- **seller**：商品、订单、库存、物流管理
- **user**：浏览、下单、购物车、评价

## 项目结构

```
project01/
├── client/          # React 前端
│   └── src/
│       ├── api/         # API 请求封装
│       ├── components/  # 公共组件
│       ├── pages/       # 页面组件
│       ├── store/       # Zustand 状态管理
│       └── types/       # TypeScript 类型
├── server/          # Express 后端
│   └── src/
│       ├── controllers/ # 控制器
│       ├── middleware/   # 中间件
│       ├── routes/      # 路由
│       └── utils/       # 工具函数
└── README.md
```

## API 接口

| 模块 | 路径 | 说明 |
|------|------|------|
| 认证 | `/api/auth/*` | 注册、登录、刷新令牌 |
| 用户 | `/api/users` | 用户 CRUD |
| 商品 | `/api/products` | 商品 CRUD |
| 分类 | `/api/categories` | 分类 CRUD |
| 购物车 | `/api/cart` | 购物车操作 |
| 订单 | `/api/orders` | 订单管理 |
| 评价 | `/api/reviews` | 评价 CRUD |
| 优惠券 | `/api/coupons` | 优惠券 CRUD |
| 物流 | `/api/logistics` | 物流追踪 |
| 库存 | `/api/inventory` | 库存管理 |
| 统计 | `/api/dashboard/*` | 数据统计 |
