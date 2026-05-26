import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.token}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  register: (data: { username: string; email: string; password: string }) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

// Dashboard
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
  salesTrend: (days = 7) => api.get('/dashboard/sales-trend', { params: { days } }),
  topProducts: () => api.get('/dashboard/top-products'),
};

// Users
export const usersAPI = {
  list: (params?: any) => api.get('/users', { params }),
  get: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  updateStatus: (id: number, status: string) => api.put(`/users/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// Products
export const productsAPI = {
  list: (params?: any) => api.get('/products', { params }),
  get: (id: number) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  uploadImages: (id: number, formData: FormData) => api.post(`/products/${id}/images`, formData),
};

// Categories
export const categoriesAPI = {
  list: () => api.get('/categories'),
  get: (id: number) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: number, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// Cart
export const cartAPI = {
  list: () => api.get('/cart'),
  add: (data: { productId: number; quantity?: number }) => api.post('/cart', data),
  update: (id: number, quantity: number) => api.put(`/cart/${id}`, { quantity }),
  delete: (id: number) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart'),
};

// Orders
export const ordersAPI = {
  list: (params?: any) => api.get('/orders', { params }),
  get: (id: number) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  updateStatus: (id: number, status: string) => api.put(`/orders/${id}/status`, { status }),
  updatePayment: (id: number) => api.put(`/orders/${id}/payment`),
};

// Reviews
export const reviewsAPI = {
  list: (params?: any) => api.get('/reviews', { params }),
  create: (data: any) => api.post('/reviews', data),
  update: (id: number, data: any) => api.put(`/reviews/${id}`, data),
  delete: (id: number) => api.delete(`/reviews/${id}`),
};

// Coupons
export const couponsAPI = {
  list: () => api.get('/coupons'),
  create: (data: any) => api.post('/coupons', data),
  update: (id: number, data: any) => api.put(`/coupons/${id}`, data),
  delete: (id: number) => api.delete(`/coupons/${id}`),
  claim: (couponId: number) => api.post('/coupons/claim', { couponId }),
  myCoupons: () => api.get('/my-coupons'),
};

// Logistics
export const logisticsAPI = {
  list: () => api.get('/logistics'),
  getByOrder: (orderId: number) => api.get(`/logistics/order/${orderId}`),
  create: (data: any) => api.post('/logistics', data),
  update: (id: number, data: any) => api.put(`/logistics/${id}`, data),
};

// Inventory
export const inventoryAPI = {
  list: (params?: any) => api.get('/inventory', { params }),
  adjust: (data: { productId: number; quantity: number; remark?: string }) => api.post('/inventory/adjust', data),
  logs: (params?: any) => api.get('/inventory/logs', { params }),
};
