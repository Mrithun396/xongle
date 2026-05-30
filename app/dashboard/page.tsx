'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { supabase } from '@/app/lib/supabase';
import { ArrowRight, History, ShoppingBag, Users, WalletCards } from 'lucide-react';

interface OrderRecord {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  product_id: string;
  product_name?: string;
  product_price?: number;
  discount_percent?: number;
}

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [summary, setSummary] = useState({
    activeGroups: 0,
    pendingOrders: 0,
    totalSavings: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderRecord[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();

        if (!sessionData.session) {
          router.push('/login');
          return;
        }

        const authUser = sessionData.session.user;

        const { data: userProfile } = await supabase
          .from('users')
          .select('id, name, phone, role, referral_code')
          .eq('id', authUser.id)
          .single();

        setProfile({
          email: authUser.email,
          name: userProfile?.name || authUser.user_metadata?.full_name || 'Buyer',
          phone: userProfile?.phone || authUser.phone || 'Not provided',
          role: userProfile?.role || 'buyer',
          referralCode: userProfile?.referral_code || 'N/A',
        });

        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_buy_id')
          .eq('user_id', authUser.id);

        const activeGroups = memberships?.length || 0;

        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        const productIds = Array.from(new Set((ordersData || []).map((order) => order.product_id)));
        const productsMap = new Map<string, { name: string; price: number; discount_percent: number }>();

        if (productIds.length > 0) {
          const { data: productData } = await supabase
            .from('products')
            .select('id, name, price, discount_percent')
            .in('id', productIds);

          (productData || []).forEach((product) => {
            productsMap.set(product.id, {
              name: product.name,
              price: Number(product.price),
              discount_percent: product.discount_percent || 0,
            });
          });
        }

        const formattedOrders = (ordersData || []).map((order) => {
          const product = productsMap.get(order.product_id);
          return {
            ...order,
            product_name: product?.name || 'Product',
            product_price: product?.price || 0,
            discount_percent: product?.discount_percent || 0,
          };
        });

        const totalSavings = formattedOrders.reduce((sum, order) => {
          const basePrice = Number(order.product_price || 0);
          const discountedPrice = Number(order.amount || 0);
          return sum + Math.max(0, basePrice - discountedPrice);
        }, 0);

        setRecentOrders(formattedOrders.slice(0, 5));
        setSummary({
          activeGroups,
          pendingOrders: formattedOrders.filter((order) => order.status === 'pending').length,
          totalSavings,
        });
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  const totalOrders = useMemo(() => recentOrders.length, [recentOrders]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar showSearch={false} />
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#1d9e75] border-t-transparent"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Navbar showSearch={false} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1d9e75]">Customer dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Welcome back, {profile?.name}</h1>
            <p className="mt-2 text-gray-600">Track your group buys, saved orders, and community activity in one place.</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-green-50 p-4">
                <div className="flex items-center gap-2 text-[#1d9e75]"><Users className="h-5 w-5" /><span className="text-sm font-semibold">Groups</span></div>
                <p className="mt-3 text-2xl font-bold text-gray-950">{summary.activeGroups}</p>
                <p className="mt-1 text-xs text-gray-500">Active community joins</p>
              </div>

              <div className="rounded-2xl bg-orange-50 p-4">
                <div className="flex items-center gap-2 text-orange-600"><ShoppingBag className="h-5 w-5" /><span className="text-sm font-semibold">Orders</span></div>
                <p className="mt-3 text-2xl font-bold text-gray-950">{totalOrders}</p>
                <p className="mt-1 text-xs text-gray-500">Saved order entries</p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-blue-600"><WalletCards className="h-5 w-5" /><span className="text-sm font-semibold">Savings</span></div>
                <p className="mt-3 text-2xl font-bold text-gray-950">₹{Number(summary.totalSavings || 0).toFixed(2)}</p>
                <p className="mt-1 text-xs text-gray-500">Estimated group savings</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <button onClick={() => router.push('/products')} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left transition hover:border-[#1d9e75] hover:bg-green-50">
                <p className="text-lg font-semibold text-gray-950">Browse products</p>
                <p className="mt-1 text-sm text-gray-600">Find fresh deals and start new group buys.</p>
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#1d9e75]">Explore <ArrowRight className="h-4 w-4" /></div>
              </button>

              <button onClick={() => router.push('/checkout')} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left transition hover:border-[#1d9e75] hover:bg-green-50">
                <p className="text-lg font-semibold text-gray-950">Complete checkout</p>
                <p className="mt-1 text-sm text-gray-600">Review your cart and place your next order.</p>
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#1d9e75]">Go to cart <ArrowRight className="h-4 w-4" /></div>
              </button>
            </div>
          </section>

          <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1d9e75]">Profile</p>
                <h2 className="mt-2 text-xl font-bold text-gray-950">Your account</h2>
              </div>
              <button onClick={handleLogout} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">Logout</button>
            </div>

            <div className="mt-4 rounded-2xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Name</p>
              <p className="mt-1 text-lg font-semibold text-gray-950">{profile?.name}</p>
            </div>

            <div className="mt-3 grid gap-3">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Email</p>
                <p className="mt-1 text-sm font-semibold text-gray-950 break-all">{profile?.email}</p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="mt-1 text-sm font-semibold text-gray-950">{profile?.phone}</p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Referral code</p>
                <p className="mt-1 text-sm font-semibold text-gray-950">{profile?.referralCode}</p>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1d9e75]">Recent activity</p>
              <h2 className="mt-2 text-xl font-bold text-gray-950">Latest orders</h2>
            </div>
            <History className="h-5 w-5 text-[#1d9e75]" />
          </div>

          {recentOrders.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">No recent orders yet. Place your first order to see it here.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3">
                  <div>
                    <p className="font-semibold text-gray-950">{order.product_name}</p>
                    <p className="mt-1 text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {order.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-950">₹{Number(order.amount).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{order.discount_percent}% off</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
