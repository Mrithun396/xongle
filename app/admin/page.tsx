'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { supabase } from '@/app/lib/supabase';
import { Eye, Plus, RefreshCw, Search, Sparkles, Trash2 } from 'lucide-react';

interface ProductRecord {
  id: string;
  name: string;
  price: number;
  category: string;
  status: string;
  created_at: string;
  image_url: string | null;
  seller_id: string;
  seller_name?: string;
}

interface SellerRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  productsCount: number;
  totalSales: number;
}

interface OrderRecord {
  id: string;
  user_id: string;
  product_id: string;
  amount: number;
  status: string;
  created_at: string;
  buyerName?: string;
  buyerEmail?: string;
  productName?: string;
  productImage?: string | null;
}

interface FestivalBoost {
  id: string;
  festival_name: string;
  discount_percent: number;
  start_date: string;
  end_date: string;
  active: boolean;
  created_at?: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  totalOrders: number;
}

type TabType = 'overview' | 'products' | 'sellers' | 'orders' | 'boosts' | 'users';

type StatusOption = 'all' | 'active' | 'pending' | 'inactive' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

const TABS: Array<{ id: TabType; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'products', label: 'Products' },
  { id: 'sellers', label: 'Sellers' },
  { id: 'orders', label: 'Orders' },
  { id: 'boosts', label: 'Festival Boosts' },
  { id: 'users', label: 'Users' },
];

const PRODUCT_STATUS_OPTIONS = ['all', 'active', 'pending', 'inactive'] as const;
const ORDER_STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
const USER_ROLE_OPTIONS = ['buyer', 'seller', 'reseller', 'admin'] as const;

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(true);
  const [error, setError] = useState('');
  const [profileName, setProfileName] = useState('Admin');

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeGroupBuys: 0,
    totalSellers: 0,
  });

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [sellers, setSellers] = useState<SellerRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [boosts, setBoosts] = useState<FestivalBoost[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);

  const [productStatusFilter, setProductStatusFilter] = useState<StatusOption>('all');
  const [productSearch, setProductSearch] = useState('');
  const [sellerSearch, setSellerSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<StatusOption>('all');
  const [userSearch, setUserSearch] = useState('');

  const [boostForm, setBoostForm] = useState({
    festival_name: '',
    discount_percent: '5',
    start_date: '',
    end_date: '',
    active: true,
  });
  const [editingBoostId, setEditingBoostId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString('en-IN');
    } catch {
      return value;
    }
  };

  const fetchAdminData = async () => {
    setError('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.push('/login');
        return;
      }

      const [profileRes, usersRes, productsRes, ordersRes, groupBuysRes, boostsRes] = await Promise.allSettled([
        supabase.from('users').select('id, name, role').eq('id', session.user.id).single(),
        supabase.from('users').select('id, name, email, phone, role, created_at'),
        supabase.from('products').select('id, name, seller_id, price, category, status, created_at, image_url'),
        supabase.from('orders').select('id, user_id, product_id, amount, status, created_at'),
        supabase.from('group_buys').select('id').eq('status', 'active'),
        supabase.from('festival_boosts').select('*').order('start_date', { ascending: false }),
      ]);

      const profileData =
        profileRes.status === 'fulfilled' && !profileRes.value.error ? profileRes.value.data : null;

      if (!profileData || profileData.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setProfileName(profileData.name || session.user.user_metadata?.full_name || session.user.email || 'Admin');

      const allUsers =
        usersRes.status === 'fulfilled' && !usersRes.value.error ? usersRes.value.data || [] : [];
      const allProducts =
        productsRes.status === 'fulfilled' && !productsRes.value.error ? productsRes.value.data || [] : [];
      const allOrders =
        ordersRes.status === 'fulfilled' && !ordersRes.value.error ? ordersRes.value.data || [] : [];
      const activeGroupBuys =
        groupBuysRes.status === 'fulfilled' && !groupBuysRes.value.error ? groupBuysRes.value.data || [] : [];
      const storedBoosts =
        boostsRes.status === 'fulfilled' && !boostsRes.value.error ? boostsRes.value.data || [] : [];

      const usersMap = new Map<string, any>(
        (allUsers || []).map((user: any) => [user.id, user])
      );

      const productsMap = new Map<string, any>(
        (allProducts || []).map((product: any) => [product.id, product])
      );

      const productRecords = (allProducts || []).map((product: any) => ({
        ...product,
        seller_name: usersMap.get(product.seller_id)?.name || 'Unknown seller',
      }));

      const orderRecords = (allOrders || []).map((order: any) => {
        const buyer = usersMap.get(order.user_id);
        const product = productsMap.get(order.product_id);
        return {
          ...order,
          buyerName: buyer?.name || 'Buyer',
          buyerEmail: buyer?.email || buyer?.phone || '',
          productName: product?.name || 'Product',
          productImage: product?.image_url || null,
        };
      });

      const sellersList = (allUsers || [])
        .filter((user: any) => user.role === 'seller')
        .map((seller: any) => {
          const sellerProducts = (allProducts || []).filter((product: any) => product.seller_id === seller.id);
          const totalSales = (orderRecords || [])
            .filter((order: any) => productsMap.get(order.product_id)?.seller_id === seller.id)
            .reduce((sum: number, order: any) => sum + Number(order.amount || 0), 0);

          return {
            ...seller,
            productsCount: sellerProducts.length,
            totalSales,
          };
        });

      const userRecords = (allUsers || []).map((user: any) => ({
        ...user,
        totalOrders: (allOrders || []).filter((order: any) => order.user_id === user.id).length,
      }));

      setProducts(productRecords);
      setOrders(orderRecords);
      setSellers(sellersList);
      setUsers(userRecords);
      setBoosts(storedBoosts || []);

      setStats({
        totalUsers: (allUsers || []).length,
        totalProducts: (allProducts || []).length,
        totalOrders: (allOrders || []).length,
        totalRevenue: (allOrders || []).reduce((sum: number, order: any) => sum + Number(order.amount || 0), 0),
        activeGroupBuys: (activeGroupBuys || []).length,
        totalSellers: sellersList.length,
      });
    } catch (err) {
      console.error('Admin load failed', err);
      setError('Unable to load admin panel. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSpinner(false), 1000);
    fetchAdminData();
    return () => window.clearTimeout(timer);
  }, [router]);

  const refreshData = async () => {
    setLoading(true);
    await fetchAdminData();
  };

  const handleProductAction = async (productId: string, status: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('products').update({ status }).eq('id', productId);
      if (error) throw error;
      refreshData();
    } catch (err) {
      setError('Failed to update product status.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSellerStatus = async (sellerId: string, role: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('users').update({ role }).eq('id', sellerId);
      if (error) throw error;
      refreshData();
    } catch (err) {
      setError('Failed to update seller role.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOrderStatus = async (orderId: string, status: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;
      refreshData();
    } catch (err) {
      setError('Failed to update order status.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBoostSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        festival_name: boostForm.festival_name.trim(),
        discount_percent: Number(boostForm.discount_percent),
        start_date: boostForm.start_date,
        end_date: boostForm.end_date,
        active: boostForm.active,
      };

      if (!payload.festival_name || !payload.start_date || !payload.end_date) {
        setError('Please complete all festival boost fields.');
        return;
      }

      if (editingBoostId) {
        const { error } = await supabase.from('festival_boosts').update(payload).eq('id', editingBoostId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('festival_boosts').insert(payload);
        if (error) throw error;
      }

      setBoostForm({ festival_name: '', discount_percent: '5', start_date: '', end_date: '', active: true });
      setEditingBoostId(null);
      refreshData();
    } catch (err) {
      setError('Unable to save festival boost.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBoostEdit = (boost: FestivalBoost) => {
    setEditingBoostId(boost.id);
    setBoostForm({
      festival_name: boost.festival_name,
      discount_percent: String(boost.discount_percent),
      start_date: boost.start_date,
      end_date: boost.end_date,
      active: boost.active,
    });
  };

  const handleBoostDelete = async (boostId: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('festival_boosts').delete().eq('id', boostId);
      if (error) throw error;
      refreshData();
    } catch (err) {
      setError('Unable to delete festival boost.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesStatus = productStatusFilter === 'all' || product.status === productStatusFilter;
      const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [products, productStatusFilter, productSearch]);

  const filteredSellers = useMemo(() => {
    return sellers.filter((seller) =>
      seller.name.toLowerCase().includes(sellerSearch.toLowerCase()) ||
      seller.email?.toLowerCase().includes(sellerSearch.toLowerCase()) ||
      seller.phone?.toLowerCase().includes(sellerSearch.toLowerCase())
    );
  }, [sellers, sellerSearch]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
      return matchesStatus;
    });
  }, [orders, orderStatusFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.phone?.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  if (loading && showSpinner) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar showSearch={false} />
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#1d9e75] border-t-transparent" />
            <p className="text-gray-600">Loading admin panel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#effaf2] text-[#1f2937]">
      <Navbar showSearch={false} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1d9e75]">Admin panel</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Welcome back, {profileName}</h1>
            <p className="mt-2 text-sm text-slate-600">Manage products, sellers, orders, boosts and users from one place.</p>
          </div>
          <button onClick={refreshData} className="inline-flex items-center gap-2 rounded-2xl bg-[#1d9e75] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#16875f]">
            <RefreshCw className="h-4 w-4" /> Refresh data
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1d9e75]">Total users</p>
            <p className="mt-4 text-3xl font-bold text-slate-950">{stats.totalUsers}</p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1d9e75]">Total products</p>
            <p className="mt-4 text-3xl font-bold text-slate-950">{stats.totalProducts}</p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1d9e75]">Total orders</p>
            <p className="mt-4 text-3xl font-bold text-slate-950">{stats.totalOrders}</p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1d9e75]">Total revenue</p>
            <p className="mt-4 text-3xl font-bold text-slate-950">₹{stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1d9e75]">Active group buys</p>
            <p className="mt-4 text-3xl font-bold text-slate-950">{stats.activeGroupBuys}</p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1d9e75]">Total sellers</p>
            <p className="mt-4 text-3xl font-bold text-slate-950">{stats.totalSellers}</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-[#f3faf4] p-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-[#1d9e75] text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-3xl bg-[#ecf9ee] p-6">
                    <div className="flex items-center gap-3 text-green-700">
                      <Sparkles className="h-5 w-5" />
                      <p className="text-sm font-semibold uppercase tracking-[0.24em]">Quick overview</p>
                    </div>
                    <p className="mt-5 text-sm text-slate-600">Use the tabs to manage product approvals, seller applications, order fulfillment, festival boosts, and user roles.</p>
                  </div>
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <p className="text-sm uppercase tracking-[0.24em] text-[#1d9e75]">Products</p>
                    <p className="mt-4 text-3xl font-bold text-slate-950">{stats.totalProducts}</p>
                    <p className="mt-2 text-sm text-slate-600">Keep product inventory healthy and approve pending items quickly.</p>
                  </div>
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <p className="text-sm uppercase tracking-[0.24em] text-[#1d9e75]">Sellers</p>
                    <p className="mt-4 text-3xl font-bold text-slate-950">{stats.totalSellers}</p>
                    <p className="mt-2 text-sm text-slate-600">Review seller accounts and keep the marketplace trusted.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <p className="text-sm uppercase tracking-[0.24em] text-[#1d9e75]">Orders</p>
                    <p className="mt-4 text-3xl font-bold text-slate-950">{stats.totalOrders}</p>
                    <p className="mt-2 text-sm text-slate-600">Track customer orders and fulfillment status.</p>
                  </div>
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <p className="text-sm uppercase tracking-[0.24em] text-[#1d9e75]">Revenue</p>
                    <p className="mt-4 text-3xl font-bold text-slate-950">₹{stats.totalRevenue.toFixed(2)}</p>
                    <p className="mt-2 text-sm text-slate-600">Monitor earnings from all completed and active orders.</p>
                  </div>
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <p className="text-sm uppercase tracking-[0.24em] text-[#1d9e75]">Active boosts</p>
                    <p className="mt-4 text-3xl font-bold text-slate-950">{boosts.filter((boost) => boost.active).length}</p>
                    <p className="mt-2 text-sm text-slate-600">Run promotions and festival campaigns effectively.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="flex items-center gap-2 rounded-full bg-[#f3faf4] px-4 py-3 text-sm text-slate-700">
                      <span>Status</span>
                      <select
                        value={productStatusFilter}
                        onChange={(event) => setProductStatusFilter(event.target.value as StatusOption)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                      >
                        {PRODUCT_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="relative block w-full max-w-xs text-sm text-slate-700">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        value={productSearch}
                        onChange={(event) => setProductSearch(event.target.value)}
                        placeholder="Search products"
                        className="w-full rounded-full border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none shadow-sm"
                      />
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full table-auto border-collapse text-left text-sm">
                    <thead className="bg-[#f3faf4] text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Seller</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                            No matching products found.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product, index) => (
                          <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f8faf7]'}>
                            <td className="px-4 py-4 align-top">
                              <div className="flex items-center gap-3">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    loading="lazy"
                                    className="h-12 w-12 rounded-2xl object-cover"
                                  />
                                ) : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
                                    📦
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-slate-950">{product.name}</p>
                                  <p className="text-xs text-slate-500">{product.id.slice(0, 8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <p className="font-medium text-slate-900">{product.seller_name}</p>
                            </td>
                            <td className="px-4 py-4 align-top">₹{Number(product.price || 0).toFixed(2)}</td>
                            <td className="px-4 py-4 align-top capitalize">{product.category}</td>
                            <td className="px-4 py-4 align-top capitalize">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                product.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : product.status === 'pending'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {product.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 align-top">{formatDate(product.created_at)}</td>
                            <td className="px-4 py-4 align-top">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  disabled={submitting}
                                  onClick={() => handleProductAction(product.id, 'active')}
                                  className="rounded-xl bg-[#1d9e75] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#16875f] disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  disabled={submitting}
                                  onClick={() => handleProductAction(product.id, 'inactive')}
                                  className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'sellers' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">Approve or suspend seller accounts from this tab.</p>
                  <label className="relative block w-full max-w-xs text-sm text-slate-700">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={sellerSearch}
                      onChange={(event) => setSellerSearch(event.target.value)}
                      placeholder="Search sellers"
                      className="w-full rounded-full border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none shadow-sm"
                    />
                  </label>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full table-auto border-collapse text-left text-sm">
                    <thead className="bg-[#f3faf4] text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Seller</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Products</th>
                        <th className="px-4 py-3">Total sales</th>
                        <th className="px-4 py-3">Applied</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSellers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                            No sellers found.
                          </td>
                        </tr>
                      ) : (
                        filteredSellers.map((seller, index) => (
                          <tr key={seller.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f8faf7]'}>
                            <td className="px-4 py-4 align-top">
                              <p className="font-semibold text-slate-950">{seller.name}</p>
                              <p className="text-xs text-slate-500 capitalize">{seller.role}</p>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <p className="text-sm text-slate-700">{seller.email || seller.phone || '-'}</p>
                            </td>
                            <td className="px-4 py-4 align-top">{seller.productsCount}</td>
                            <td className="px-4 py-4 align-top">₹{seller.totalSales.toFixed(2)}</td>
                            <td className="px-4 py-4 align-top">{formatDate(seller.created_at)}</td>
                            <td className="px-4 py-4 align-top">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  disabled={submitting}
                                  onClick={() => handleSellerStatus(seller.id, 'seller')}
                                  className="rounded-xl bg-[#1d9e75] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#16875f] disabled:opacity-50"
                                >
                                  Approve Seller
                                </button>
                                <button
                                  disabled={submitting}
                                  onClick={() => handleSellerStatus(seller.id, 'buyer')}
                                  className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                                >
                                  Suspend Seller
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 rounded-full bg-[#f3faf4] px-4 py-3 text-sm text-slate-700">
                    <span>Status</span>
                    <select
                      value={orderStatusFilter}
                      onChange={(event) => setOrderStatusFilter(event.target.value as StatusOption)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                    >
                      {ORDER_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full table-auto border-collapse text-left text-sm">
                    <thead className="bg-[#f3faf4] text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Buyer</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                            No orders match this filter.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order, index) => (
                          <tr key={order.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f8faf7]'}>
                            <td className="px-4 py-4 align-top font-medium text-slate-950">{order.id.slice(0, 8)}</td>
                            <td className="px-4 py-4 align-top">
                              <p className="font-semibold text-slate-950">{order.buyerName}</p>
                              <p className="text-xs text-slate-500">{order.buyerEmail || '-'}</p>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="flex items-center gap-3">
                                {order.productImage ? (
                                  <img
                                    src={order.productImage}
                                    alt={order.productName}
                                    loading="lazy"
                                    className="h-10 w-10 rounded-2xl object-cover"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
                                    📦
                                  </div>
                                )}
                                <span>{order.productName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top">₹{Number(order.amount || 0).toFixed(2)}</td>
                            <td className="px-4 py-4 align-top">
                              <select
                                value={order.status}
                                onChange={(event) => handleOrderStatus(order.id, event.target.value)}
                                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                              >
                                {ORDER_STATUS_OPTIONS.filter((status) => status !== 'all').map((status) => (
                                  <option key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-4 align-top">{formatDate(order.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'boosts' && (
              <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                <div className="rounded-3xl bg-[#f3faf4] p-6 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center gap-2 text-[#1d9e75]">
                    <Sparkles className="h-5 w-5" />
                    <p className="text-sm font-semibold uppercase tracking-[0.24em]">Create boost</p>
                  </div>
                  <form onSubmit={handleBoostSave} className="mt-6 space-y-4">
                    <label className="block text-sm font-semibold text-slate-700">
                      Festival name
                      <input
                        value={boostForm.festival_name}
                        onChange={(event) => setBoostForm({ ...boostForm, festival_name: event.target.value })}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      Extra discount %
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={boostForm.discount_percent}
                        onChange={(event) => setBoostForm({ ...boostForm, discount_percent: event.target.value })}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      Start date
                      <input
                        type="date"
                        value={boostForm.start_date}
                        onChange={(event) => setBoostForm({ ...boostForm, start_date: event.target.value })}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      End date
                      <input
                        type="date"
                        value={boostForm.end_date}
                        onChange={(event) => setBoostForm({ ...boostForm, end_date: event.target.value })}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={boostForm.active}
                        onChange={(event) => setBoostForm({ ...boostForm, active: event.target.checked })}
                      />
                      Active boost
                    </label>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1d9e75] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#16875f] disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      {editingBoostId ? 'Update boost' : 'Create boost'}
                    </button>
                  </form>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1d9e75]">Festival boosts</p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full table-auto border-collapse text-left text-sm">
                      <thead className="bg-[#f3faf4] text-slate-600">
                        <tr>
                          <th className="px-4 py-3">Festival</th>
                          <th className="px-4 py-3">Discount</th>
                          <th className="px-4 py-3">Period</th>
                          <th className="px-4 py-3">Active</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boosts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                              No festival boosts configured.
                            </td>
                          </tr>
                        ) : (
                          boosts.map((boost, index) => (
                            <tr key={boost.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f8faf7]'}>
                              <td className="px-4 py-4 align-top">{boost.festival_name}</td>
                              <td className="px-4 py-4 align-top">{boost.discount_percent}%</td>
                              <td className="px-4 py-4 align-top">{formatDate(boost.start_date)} - {formatDate(boost.end_date)}</td>
                              <td className="px-4 py-4 align-top">{boost.active ? 'Yes' : 'No'}</td>
                              <td className="px-4 py-4 align-top">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    disabled={submitting}
                                    onClick={() => handleBoostEdit(boost)}
                                    className="rounded-xl bg-[#1d9e75] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#16875f] disabled:opacity-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    disabled={submitting}
                                    onClick={() => handleBoostDelete(boost.id)}
                                    className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">Manage roles and view orders per customer.</p>
                  <label className="relative block w-full max-w-xs text-sm text-slate-700">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Search users"
                      className="w-full rounded-full border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none shadow-sm"
                    />
                  </label>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full table-auto border-collapse text-left text-sm">
                    <thead className="bg-[#f3faf4] text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Orders</th>
                        <th className="px-4 py-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user, index) => (
                          <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f8faf7]'}>
                            <td className="px-4 py-4 align-top">
                              <p className="font-semibold text-slate-950">{user.name}</p>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <p className="text-sm text-slate-700">{user.email || user.phone || '-'}</p>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <select
                                value={user.role}
                                onChange={async (event) => {
                                  const newRole = event.target.value;
                                  setSubmitting(true);
                                  try {
                                    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', user.id);
                                    if (error) throw error;
                                    refreshData();
                                  } catch (err) {
                                    setError('Unable to update user role.');
                                    console.error(err);
                                  } finally {
                                    setSubmitting(false);
                                  }
                                }}
                                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                              >
                                {USER_ROLE_OPTIONS.map((roleOption) => (
                                  <option key={roleOption} value={roleOption}>
                                    {roleOption}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-4 align-top">{user.totalOrders}</td>
                            <td className="px-4 py-4 align-top">{formatDate(user.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
