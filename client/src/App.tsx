import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';

// User store
import StoreLayout from './components/Layout/StoreLayout';
import StoreHome from './pages/Store/Home';
import StoreProductDetail from './pages/Store/ProductDetail';
import StoreCart from './pages/Store/Cart';
import StoreOrders from './pages/Store/Orders';
import StoreLogin from './pages/Store/Login';

// Admin management
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Reviews from './pages/Reviews';
import Coupons from './pages/Coupons';
import Logistics from './pages/Logistics';
import Reports from './pages/Reports';

function AdminRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'user') return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* User store */}
      <Route path="/" element={<StoreLayout />}>
        <Route index element={<StoreHome />} />
        <Route path="product/:id" element={<StoreProductDetail />} />
        <Route path="cart" element={<StoreCart />} />
        <Route path="orders" element={<StoreOrders />} />
      </Route>
      <Route path="/login" element={<StoreLogin />} />

      {/* Admin management */}
      <Route path="/admin" element={<AdminRoute><MainLayout /></AdminRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<AdminRoute roles={['admin']}><Categories /></AdminRoute>} />
        <Route path="users" element={<AdminRoute roles={['admin']}><Users /></AdminRoute>} />
        <Route path="orders" element={<Orders />} />
        <Route path="inventory" element={<AdminRoute roles={['admin', 'seller']}><Inventory /></AdminRoute>} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="coupons" element={<AdminRoute roles={['admin']}><Coupons /></AdminRoute>} />
        <Route path="logistics" element={<AdminRoute roles={['admin', 'seller']}><Logistics /></AdminRoute>} />
        <Route path="reports" element={<AdminRoute roles={['admin']}><Reports /></AdminRoute>} />
      </Route>
    </Routes>
  );
}
