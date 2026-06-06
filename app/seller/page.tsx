'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { createClient } from '@/app/lib/supabase';
import { CheckCircle, Plus, ShoppingBag, TrendingUp, Users, AlertCircle, Sparkles, Edit3, Trash2 } from 'lucide-react';

interface SellerProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface ProductRecord {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  discount_percent: number;
  image_url: string | null;
  status: string;
  orders_count?: number;
}

interface SellerStats {
  totalOrders: number;
  totalRevenue: number;
  commission: number;
}

export default function SellerPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [stats, setStats] = useState<SellerStats>({
    totalOrders: 0,
    totalRevenue: 0,
    commission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'grocery',
    discount_percent: '0',
    image_url: '',
  });

  useEffect(() => {
    const loadSellerData = async () => {
      try {
        setLoading(true);
        setError('');

        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;

        if (!session) {
          router.push('/login?redirect=/seller');
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('id, name, role')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profileData) {
          throw new Error('Unable to load seller profile.');
        }

        if (profileData.role !== 'seller' && profileData.role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setProfile({
          id: profileData.id,
          name: profileData.name,
          email: session.user.email || null,
          role: profileData.role,
        });

        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*, orders(id, amount)')
          .eq('seller_id', profileData.id)
          .order('created_at', { ascending: false });

        if (productsError) {
          throw productsError;
        }

        const normalizedProducts = (productsData || []).map((product: any) => ({
          ...product,
          orders_count: Array.isArray(product.orders) ? product.orders.length : 0,
        }));

        const allOrders = normalizedProducts.flatMap((product) => product.orders || []);
        const totalRevenue = allOrders.reduce((sum, order: any) => sum + Number(order.amount || 0), 0);
        const totalOrders = allOrders.length;

        setProducts(normalizedProducts);
        setStats({
          totalOrders,
          totalRevenue,
          commission: totalRevenue * 0.05,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load seller dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadSellerData();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile) return;

    setSubmitting(true);
    setSubmitError('');
    setSubmitMessage('');

    try {
      const price = Number(form.price);
      const discountPercent = Number(form.discount_percent);

      if (!form.name.trim() || Number.isNaN(price) || price <= 0) {
        setSubmitError('Provide a valid product name and price.');
        return;
      }

      const item = {
        seller_id: profile.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        category: form.category,
        discount_percent: discountPercent,
        image_url: form.image_url.trim() || null,
        status: 'active',
      };

      if (editingProductId) {
        const { error } = await supabase
          .from('products')
          .update(item)
          .eq('id', editingProductId);

        if (error) {
          throw error;
        }

        setSubmitMessage('Product updated successfully.');
      } else {
        const { error } = await supabase.from('products').insert(item);

        if (error) {
          throw error;
        }

        setSubmitMessage('Product added successfully.');
      }

      setEditingProductId(null);
      setForm({
        name: '',
        description: '',
        price: '',
        category: 'grocery',
        discount_percent: '0',
        image_url: '',
      });

      await reloadProducts(profile.id);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const reloadProducts = async (sellerId: string) => {
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*, orders(id, amount)')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (productsError) {
      throw productsError;
    }

    const normalizedProducts = (productsData || []).map((product: any) => ({
      ...product,
      orders_count: Array.isArray(product.orders) ? product.orders.length : 0,
    }));

    const allOrders = normalizedProducts.flatMap((product) => product.orders || []);
    const totalRevenue = allOrders.reduce((sum, order: any) => sum + Number(order.amount || 0), 0);
    const totalOrders = allOrders.length;

    setProducts(normalizedProducts);
    setStats({
      totalOrders,
      totalRevenue,
      commission: totalRevenue * 0.05,
    });
  };

  const handleEdit = (product: ProductRecord) => {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      category: product.category,
      discount_percent: String(product.discount_percent),
      image_url: product.image_url || '',
    });
    setSubmitMessage('');
    setSubmitError('');
  };

  const handleDelete = async (productId: string) => {
    if (!profile) return;

    const confirmed = window.confirm('Delete this product? This action cannot be undone.');
    if (!confirmed) return;

    setSubmitting(true);
    setSubmitError('');
    setSubmitMessage('');

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) {
        throw error;
      }

      setSubmitMessage('Product deleted successfully.');
      await reloadProducts(profile.id);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to delete product.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar showSearch={false} />
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4 py-16">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#1d9e75] border-t-transparent"></div>
            <p className="text-gray-600">Loading seller dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar showSearch={false} />
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">Access error</p>
            <p className="mt-2">{error}</p>
            <Link href="/dashboard" className="mt-4 inline-block rounded-lg bg-[#1d9e75] px-4 py-2 font-semibold text-white">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Navbar showSearch={false} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1d9e75]">Seller dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Manage your products</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, <span className="font-semibold text-gray-900">{profile?.name || profile?.email || 'Seller'}</span>.
            </p>
          </div>
          <Link href="/products" className="inline-flex items-center justify-center rounded-lg bg-[#1d9e75] px-4 py-2 font-semibold text-white transition hover:bg-[#15845f]">
            View storefront
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Total products</p>
              <ShoppingBag className="h-5 w-5 text-[#1d9e75]" />
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-950">{products.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Total orders</p>
              <Users className="h-5 w-5 text-[#1d9e75]" />
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-950">{stats.totalOrders}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Total revenue</p>
              <TrendingUp className="h-5 w-5 text-[#1d9e75]" />
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-950">₹{stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Commission paid (5%)</p>
              <Sparkles className="h-5 w-5 text-[#1d9e75]" />
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-950">₹{stats.commission.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-950">Add new product</h2>
                <p className="mt-1 text-sm text-gray-600">Create a new listing with the details buyers need.</p>
              </div>
              <div className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-[#1d9e75]">Live listing</div>
            </div>

            {submitError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</div>}
            {submitMessage && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{submitMessage}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Product name</label>
                <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1d9e75]" placeholder="Organic rice" required />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1d9e75]" rows={3} placeholder="Describe the product and benefits" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Price (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1d9e75]" placeholder="249" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Discount %</label>
                  <input type="number" min="0" max="50" value={form.discount_percent} onChange={(e) => setForm((prev) => ({ ...prev, discount_percent: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1d9e75]" placeholder="10" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                  <select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1d9e75]">
                    <option value="grocery">Grocery</option>
                    <option value="electronics">Electronics</option>
                    <option value="fashion">Fashion</option>
                    <option value="home">Home</option>
                    <option value="beauty">Beauty</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Image URL</label>
                  <input value={form.image_url} onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1d9e75]" placeholder="https://example.com/image.jpg" />
                </div>
              </div>

              <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1d9e75] px-4 py-2.5 font-semibold text-white transition hover:bg-[#15845f] disabled:cursor-not-allowed disabled:opacity-70">
                <Plus className="h-4 w-4" />
                {submitting ? (editingProductId ? 'Updating product...' : 'Saving product...') : editingProductId ? 'Update product' : 'Add product'}
              </button>
              {editingProductId && (
                <button type="button" onClick={() => {
                  setEditingProductId(null);
                  setForm({
                    name: '',
                    description: '',
                    price: '',
                    category: 'grocery',
                    discount_percent: '0',
                    image_url: '',
                  });
                  setSubmitError('');
                  setSubmitMessage('');
                }} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50">
                  Cancel edit
                </button>
              )}
            </form>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-950">Your products</h2>
                <p className="mt-1 text-sm text-gray-600">Track active sales, orders, and manage your catalog.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-600">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Discount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Orders</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="bg-white">
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded-xl bg-gray-100">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-2xl">📦</div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-gray-900">₹{Number(product.price).toFixed(2)}</td>
                      <td className="px-4 py-4 align-top text-gray-900">{product.discount_percent}%</td>
                      <td className="px-4 py-4 align-top">
                        <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-[#1d9e75]">{product.status}</span>
                      </td>
                      <td className="px-4 py-4 align-top text-gray-900">{product.orders_count || 0}</td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleEdit(product)} className="inline-flex items-center gap-2 rounded-lg bg-[#1d9e75] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#15845f]">
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDelete(product.id)} className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {products.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                No products yet. Add your first listing to start selling.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
