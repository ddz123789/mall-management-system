import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../utils/upload';
import * as auth from '../controllers/auth';
import * as users from '../controllers/users';
import * as products from '../controllers/products';
import * as categories from '../controllers/categories';
import * as cart from '../controllers/cart';
import * as orders from '../controllers/orders';
import * as reviews from '../controllers/reviews';
import * as coupons from '../controllers/coupons';
import * as logistics from '../controllers/logistics';
import * as inventory from '../controllers/inventory';
import * as dashboard from '../controllers/dashboard';

const router = Router();

// Auth
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.post('/auth/refresh', auth.refresh);
router.get('/auth/profile', authenticate, auth.getProfile);

// Dashboard
router.get('/dashboard/stats', authenticate, authorize('admin', 'seller'), dashboard.stats);
router.get('/dashboard/sales-trend', authenticate, authorize('admin', 'seller'), dashboard.salesTrend);
router.get('/dashboard/top-products', authenticate, authorize('admin', 'seller'), dashboard.topProducts);

// Users
router.get('/users', authenticate, authorize('admin'), users.list);
router.get('/users/:id', authenticate, authorize('admin'), users.getById);
router.post('/users', authenticate, authorize('admin'), users.create);
router.put('/users/:id', authenticate, authorize('admin'), users.update);
router.put('/users/:id/status', authenticate, authorize('admin'), users.updateStatus);
router.delete('/users/:id', authenticate, authorize('admin'), users.remove);

// Categories
router.get('/categories', categories.list);
router.get('/categories/:id', categories.getById);
router.post('/categories', authenticate, authorize('admin'), categories.create);
router.put('/categories/:id', authenticate, authorize('admin'), categories.update);
router.delete('/categories/:id', authenticate, authorize('admin'), categories.remove);

// Products
router.get('/products', products.list);
router.get('/products/:id', products.getById);
router.post('/products', authenticate, authorize('admin', 'seller'), products.create);
router.put('/products/:id', authenticate, authorize('admin', 'seller'), products.update);
router.delete('/products/:id', authenticate, authorize('admin'), products.remove);
router.post('/products/:id/images', authenticate, authorize('admin', 'seller'), upload.array('images', 5), products.uploadImages);

// Cart
router.get('/cart', authenticate, cart.list);
router.post('/cart', authenticate, cart.add);
router.put('/cart/:id', authenticate, cart.update);
router.delete('/cart/:id', authenticate, cart.remove);
router.delete('/cart', authenticate, cart.clear);

// Orders
router.get('/orders', authenticate, orders.list);
router.get('/orders/:id', authenticate, orders.getById);
router.post('/orders', authenticate, orders.create);
router.put('/orders/:id/status', authenticate, authorize('admin', 'seller'), orders.updateStatus);
router.put('/orders/:id/payment', authenticate, orders.updatePayment);

// Reviews
router.get('/reviews', reviews.list);
router.post('/reviews', authenticate, reviews.create);
router.put('/reviews/:id', authenticate, reviews.update);
router.delete('/reviews/:id', authenticate, authorize('admin'), reviews.remove);

// Coupons
router.get('/coupons', authenticate, coupons.list);
router.post('/coupons', authenticate, authorize('admin'), coupons.create);
router.put('/coupons/:id', authenticate, authorize('admin'), coupons.update);
router.delete('/coupons/:id', authenticate, authorize('admin'), coupons.remove);
router.post('/coupons/claim', authenticate, coupons.claim);
router.get('/my-coupons', authenticate, coupons.myCoupons);

// Logistics
router.get('/logistics', authenticate, authorize('admin', 'seller'), logistics.list);
router.get('/logistics/order/:orderId', authenticate, logistics.getByOrderId);
router.post('/logistics', authenticate, authorize('admin', 'seller'), logistics.create);
router.put('/logistics/:id', authenticate, authorize('admin', 'seller'), logistics.update);

// Inventory
router.get('/inventory', authenticate, authorize('admin', 'seller'), inventory.list);
router.post('/inventory/adjust', authenticate, authorize('admin', 'seller'), inventory.adjustStock);
router.get('/inventory/logs', authenticate, authorize('admin', 'seller'), inventory.logs);

export default router;
