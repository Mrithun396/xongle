'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { createClient } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { ArrowRight, History, ShoppingBag, Users, WalletCards, Eye, Calendar, Package } from 'lucide-react';

interface OrderRecord {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  product_id: string;
  product_name?: string;
  product_price?: number;
  discount_percent?: number;
  quantity?: number;
}

interface GroupBuyMember {
  id: string;
  group_buy_id: string;
  user_id: string;
  created_at: string;
  group_buy?: {
    id: string;
    product_id: string;
    status: string;
    member_count: number;
    created_at: string;
  };
  product?: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

type TabType = 'overview' | 'orders' | 'groups' | 'wallet';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'orders' || tab === 'groups' || tab === 'wallet') return tab;
    }
    return 'overview';
  });

  const [loading, setLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [summary, setSummary] = useState({
    activeGroups: 0,
    totalOrders: 0,
    totalSpent: 0,
    totalSavings: 0,
  });
  const [allOrders, setAllOrders] = useState<OrderRecord[]>([]);
  const [userGroups, setUserGroups] = useState<GroupBuyMember[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<number>(0);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    const timeoutId = window.setTimeout(() => setShowSpinner(false), 1000);

    const loadDashboard = async () => {
      const supabase = createClient();
      try {
        console.log('Dashboard auth user id:', user.id);
        const { data: userProfile } = await supabase
          .from('users')
          .select('id, name, phone, role, referral_code')
          .eq('id', user.id)
          .single();

        console.log('Dashboard userProfile:', userProfile);

        setProfile({
          email: user.email,
          name: userProfile?.name || user.user_metadata?.full_name || 'Buyer',
          phone: userProfile?.phone || user.phone || 'Not provided',
          role: userProfile?.role || 'buyer',
          referralCode: userProfile?.referral_code || 'N/A',
        });

        const [ordersResult, groupsResult, couponsResult] = await Promise.allSettled([
          supabase
            .from('orders')
            .select('*, products(name, image_url, price, discount_percent)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('group_members')
            .select('*, group_buys(*, products(name, image_url))')
            .eq('user_id', user.id),
          supabase
            .from('coupons')
            .select('*')
            .eq('user_id', user.id)
            .eq('used', false),
        ]);

        const ordersData =
          ordersResult.status === 'fulfilled' && !ordersResult.value.error
            ? ordersResult.value.data || []
            : [];
        if (ordersResult.status === 'fulfilled' && ordersResult.value.error) {
          console.error('Orders query failed', ordersResult.value.error);
        }
        if (ordersResult.status === 'rejected') {
          console.error('Orders query rejected', ordersResult.reason);
        }

        const membershipsData =
          groupsResult.status === 'fulfilled' && !groupsResult.value.error
            ? groupsResult.value.data || []
            : [];
        if (groupsResult.status === 'fulfilled' && groupsResult.value.error) {
          console.error('Groups query failed', groupsResult.value.error);
        }
        if (groupsResult.status === 'rejected') {
          console.error('Groups query rejected', groupsResult.reason);
        }

        const couponsData =
          couponsResult.status === 'fulfilled' && !couponsResult.value.error
            ? couponsResult.value.data || []
            : [];
        if (couponsResult.status === 'fulfilled' && couponsResult.value.error) {
          console.error('Coupons query failed', couponsResult.value.error);
        }
        if (couponsResult.status === 'rejected') {
          console.error('Coupons query rejected', couponsResult.reason);
        }

        const formattedOrders = (ordersData as any[]).map((order) => {
          const product = Array.isArray(order.products)
            ? order.products[0]
            : order.products || {};

          return {
            ...order,
            product_name: product.name || 'Product',
            product_price: Number(product.price || 0),
            discount_percent: Number(product.discount_percent || 0),
          };
        });

        const formattedGroups = (membershipsData as any[]).map((member) => {
          const groupBuy = member.group_buy || {};
          const groupProduct = Array.isArray(groupBuy.products)
            ? groupBuy.products[0]
            : groupBuy.products || null;

          return {
            ...member,
            product: groupProduct,
          };
        });

        const totalSavings = formattedOrders.reduce((sum, order) => {
          const basePrice = Number(order.product_price || 0);
          const discountedPrice = Number(order.amount || 0);
          return sum + Math.max(0, basePrice - discountedPrice);
        }, 0);

        const totalSpent = formattedOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);

        setAllOrders(formattedOrders);
        setUserGroups(formattedGroups);
        setAvailableCoupons(couponsData.length);
        setSummary({
          activeGroups: formattedGroups.length,
          totalOrders: formattedOrders.length,
          totalSpent,
          totalSavings,
        });
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        setShowSpinner(false);
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading && showSpinner) {
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
        <section className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1d9e75]">Customer dashboard</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-950">Welcome back, {profile?.name}</h1>
            </div>
            <button onClick={handleLogout} className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">
              Logout
            </button>
          </div>
        </section>

        <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm ring-1 ring-gray-100">
          {[
            { id: 'overview' as TabType, label: 'Overview', icon: '📊' },
            { id: 'orders' as TabType, label: 'My Orders', icon: '📦' },
            { id: 'groups' as TabType, label: 'My Groups', icon: '👥' },
            { id: 'wallet' as TabType, label: 'My Wallet', icon: '💰' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-max rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-[#1d9e75] text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-semibold text-gray-600">Total Orders</span>
                </div>
                <p className="mt-3 text-3xl font-bold text-gray-950">{summary.totalOrders}</p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center gap-2">
                  <WalletCards className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-600">Total Spent</span>
                </div>
                <p className="mt-3 text-3xl font-bold text-gray-950">₹{summary.totalSpent.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-semibold text-gray-600">Active Groups</span>
                </div>
                <p className="mt-3 text-3xl font-bold text-gray-950">{summary.activeGroups}</p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-600">Total Saved</span>
                </div>
                <p className="mt-3 text-3xl font-bold text-gray-950">₹{summary.totalSavings.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <button onClick={() => router.push('/products')} className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-left transition hover:border-[#1d9e75] hover:bg-green-50">
                <p className="text-lg font-semibold text-gray-950">Browse Products</p>
                <p className="mt-2 text-sm text-gray-600">Explore deals in all categories</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#1d9e75]">
                  Shop Now <ArrowRight className="h-4 w-4" />
                </div>
              </button>
              <button onClick={() => router.push('/cart')} className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-left transition hover:border-[#1d9e75] hover:bg-green-50">
                <p className="text-lg font-semibold text-gray-950">Your Cart</p>
                <p className="mt-2 text-sm text-gray-600">Review and checkout</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#1d9e75]">
                  View Cart <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-6 flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-orange-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-950">My Orders</h2>
                <p className="text-sm text-gray-600">View all your orders and their status</p>
              </div>
            </div>
            {allOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-3 text-lg font-semibold text-gray-700">No orders yet</p>
                <p className="mt-1 text-sm text-gray-500">Start shopping to see your orders here</p>
                <button onClick={() => router.push('/products')} className="mt-4 rounded-lg bg-[#1d9e75] px-6 py-2 font-semibold text-white hover:bg-[#15845f]">
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {allOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-gray-100 p-4 hover:border-[#1d9e75] hover:bg-green-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-950">{order.product_name}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1"><span className="font-semibold">ID:</span> {order.id.slice(0, 8)}</div>
                          <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(order.created_at).toLocaleDateString('en-IN')}</div>
                          <div className="flex items-center gap-1"><span className="font-semibold">Qty:</span> {order.quantity || 1}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-950">₹{Number(order.amount).toFixed(2)}</p>
                        <p className="text-xs text-gray-600 line-through">₹{Number(order.product_price).toFixed(2)}</p>
                        <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-6 flex items-center gap-3">
              <Users className="h-6 w-6 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-950">My Groups</h2>
                <p className="text-sm text-gray-600">Active group buys you're part of</p>
              </div>
            </div>
            {userGroups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-3 text-lg font-semibold text-gray-700">No active groups</p>
                <p className="mt-1 text-sm text-gray-500">Join or create a group buy to save more</p>
                <button onClick={() => router.push('/products')} className="mt-4 rounded-lg bg-[#1d9e75] px-6 py-2 font-semibold text-white hover:bg-[#15845f]">
                  Find Group Buys
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {userGroups.map((membership) => (
                  <div key={membership.id} className="rounded-2xl border border-gray-100 p-4 hover:border-[#1d9e75] hover:bg-green-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-1 items-start gap-4">
                        {membership.product?.image_url && (
                          <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-gray-100">
                            <img src={membership.product.image_url} alt={membership.product.name || 'Product image'} loading="lazy" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-950">{membership.product?.name || 'Product'}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1"><Users className="h-4 w-4" /> {membership.group_buy?.member_count || 0} members</div>
                            <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Joined {new Date(membership.created_at).toLocaleDateString('en-IN')}</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${membership.group_buy?.status === 'active' ? 'bg-green-100 text-green-700' : membership.group_buy?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                          {(membership.group_buy?.status || 'Unknown').charAt(0).toUpperCase() + (membership.group_buy?.status || 'Unknown').slice(1)}
                        </span>
                        <Link href={`/group/${membership.group_buy_id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1d9e75] hover:underline">
                          View Group <Eye className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-6 flex items-center gap-3">
              <WalletCards className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-950">My Wallet</h2>
                <p className="text-sm text-gray-600">Payment history and coupons</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6">
                <p className="text-sm font-semibold text-gray-700">Wallet Balance</p>
                <p className="mt-3 text-3xl font-bold text-gray-950">₹0.00</p>
                <p className="mt-2 text-xs text-gray-600">Reload to use for orders</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-6">
                <p className="text-sm font-semibold text-gray-700">Available Coupons</p>
                <p className="mt-3 text-3xl font-bold text-gray-950">{availableCoupons}</p>
                <p className="mt-2 text-xs text-gray-600">
                  {availableCoupons > 0 ? `${availableCoupons} active coupon${availableCoupons !== 1 ? 's' : ''}` : 'No active coupons'}
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="text-gray-700">Wallet features coming soon!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}