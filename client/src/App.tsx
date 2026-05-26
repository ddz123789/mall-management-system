import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Orders from './pages/Orders';
import Cart from './pages/Cart';
import Inventory from './pages/Inventory';
import Reviews from './pages/Reviews';
import Coupons from './pages/Coupons';
import Logistics from './pages/Logistics';
import Reports from './pages/Reports';

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<PrivateRoute roles={['admin']}><Categories /></PrivateRoute>} />
        <Route path="users" element={<PrivateRoute roles={['admin']}><Users /></PrivateRoute>} />
        <Route path="orders" element={<Orders />} />
        <Route path="cart" element={<Cart />} />
        <Route path="inventory" element={<PrivateRoute roles={['admin', 'seller']}><Inventory /></PrivateRoute>} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="coupons" element={<PrivateRoute roles={['admin']}><Coupons /></PrivateRoute>} />
        <Route path="logistics" element={<PrivateRoute roles={['admin', 'seller']}><Logistics /></PrivateRoute>} />
        <Route path="reports" element={<PrivateRoute roles={['admin']}><Reports /></PrivateRoute>} />
      </Route>
    </Routes>
  );
}
