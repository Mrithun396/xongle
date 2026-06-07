'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { useCart } from '@/app/context/CartContext';
import { createClient } from '@/app/lib/supabase';
import { CheckCircle, Package, MapPin, CreditCard, Tag, AlertCircle } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    state: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login?redirect=/checkout');
        return;
      }

      setUser(data.session.user);
      setForm((current) => ({
        ...current,
        phone: data.session.user.phone || '',
        name: data.session.user.user_metadata.full_name || '',
      }));
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const subtotal = useMemo(() => cartTotal, [cartTotal]);
  const couponDiscount = useMemo(() => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'SAVE10') return subtotal * 0.1;
    if (code === 'XONGLE20') return subtotal * 0.2;
    return 0;
  }, [couponCode, subtotal]);

  const deliveryCharge = subtotal > 499 ? 0 : 49;
  const tax = 0;
  const savings = useMemo(() => {
    return cart.reduce((total, item) => {
      const discountedPrice = item.price * (1 - item.discount_percent / 100);
      return total + (item.price - discountedPrice) * item.quantity;
    }, 0);
  }, [cart]);
  const total = subtotal - couponDiscount + deliveryCharge;

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponMessage('Enter a coupon code to apply.');
      return;
    }

    if (code === 'SAVE10' || code === 'XONGLE20') {
      setCouponMessage(`Coupon applied: ${code} (${code === 'SAVE10' ? '10%' : '20%'} off)`);
    } else {
      setCouponMessage('Invalid coupon code. Try SAVE10 or XONGLE20.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim() || !form.pincode.trim() || !form.state.trim()) {
      setError('Please complete all shipping fields before placing the order.');
      return;
    }

    try {
      const supabase = createClient();
      setPlacing(true);
      setError('');

      const orderIds: string[] = [];

      for (const item of cart) {
        const discountedPrice = item.price * (1 - item.discount_percent / 100);

        const { data: existingGroupBuy } = await supabase
          .from('group_buys')
          .select('id')
          .eq('product_id', item.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        let groupBuyId = existingGroupBuy?.id;

        if (!groupBuyId) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          const { data: createdGroupBuy, error: groupBuyError } = await supabase
            .from('group_buys')
            .insert({
              product_id: item.id,
              creator_id: user.id,
              status: 'active',
              member_count: 1,
              expires_at: expiresAt.toISOString(),
            })
            .select('id')
            .single();

          if (groupBuyError) {
            throw groupBuyError;
          }

          groupBuyId = createdGroupBuy.id;

          await supabase.from('group_members').insert({
            group_buy_id: groupBuyId,
            user_id: user.id,
          });
        }

        const { data: orderInsert, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            product_id: item.id,
            group_buy_id: groupBuyId,
            amount: discountedPrice * item.quantity,
            status: 'pending',
          })
          .select('id')
          .single();

        if (orderError) {
          throw orderError;
        }

        orderIds.push(orderInsert.id);
      }

      const confirmation = {
        orderIds,
        userId: user.id,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discountedPrice: item.price * (1 - item.discount_percent / 100),
        })),
        subtotal,
        couponDiscount,
        tax,
        total,
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        delivery: form,
      };

      localStorage.setItem('xongle_last_order', JSON.stringify(confirmation));
      clearCart();
      router.push(`/order-confirmation?orderId=${orderIds[0] || 'manual'}`);
    } catch (err) {
      console.error('Failed to place order', err);
      setError('Order placement failed. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar showSearch={false} />
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#1d9e75] border-t-transparent"></div>
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar showSearch={false} />
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-gray-600">Add products to continue with checkout.</p>
            <button onClick={() => router.push('/products')} className="mt-6 rounded-lg bg-[#1d9e75] px-6 py-3 font-semibold text-white hover:bg-[#15845f]">
              Continue shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Navbar showSearch={false} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1d9e75]">Checkout</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">Complete your order</h1>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#1d9e75]" />
                <h2 className="text-xl font-bold text-gray-950">Delivery details</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
                  <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1d9e75] focus:outline-none" placeholder="Asha Sharma" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1d9e75] focus:outline-none" placeholder="9876543210" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Pincode</label>
                  <input value={form.pincode} onChange={(e) => setForm((current) => ({ ...current, pincode: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1d9e75] focus:outline-none" placeholder="560001" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                  <textarea value={form.address} onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))} rows={4} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1d9e75] focus:outline-none" placeholder="Street, apartment, area" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
                  <input value={form.city} onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1d9e75] focus:outline-none" placeholder="Bengaluru" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">State</label>
                  <input value={form.state} onChange={(e) => setForm((current) => ({ ...current, state: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1d9e75] focus:outline-none" placeholder="Karnataka" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#1d9e75]" />
                <h2 className="text-xl font-bold text-gray-950">Payment</h2>
              </div>
              <div className="rounded-xl border-2 border-[#1d9e75] bg-green-50 px-4 py-3 text-sm font-semibold text-gray-900">
                Cash on Delivery (COD)
              </div>
            </div>
          </section>

          <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 lg:sticky lg:top-24 lg:h-fit">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-[#1d9e75]" />
              <h2 className="text-xl font-bold text-gray-950">Order summary</h2>
            </div>

            <div className="mt-4 space-y-3">
              {cart.map((item) => {
                const itemPrice = item.price * (1 - item.discount_percent / 100) * item.quantity;
                return (
                  <div key={item.id} className="flex items-start justify-between gap-4 rounded-xl bg-gray-50 px-3 py-2 text-sm">
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">₹{itemPrice.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-700">You Save</p>
                </div>
                <p className="text-3xl font-bold text-green-600">₹{savings.toFixed(2)}</p>
                <p className="text-xs text-green-700 mt-1">compared to original price</p>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                <span>Delivery charge</span>
                <span className={deliveryCharge === 0 ? 'text-green-600 font-semibold' : 'text-gray-900'}>
                  {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}
                </span>
              </div>
              <div className="mt-4 border-t border-gray-200 pt-4 flex items-center justify-between">
                <span className="text-base font-bold text-gray-950">Total</span>
                <span className="text-2xl font-bold text-[#1d9e75]">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Apply coupon code</label>
              <div className="flex gap-2">
                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="SAVE10" className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1d9e75] focus:outline-none" />
                <button type="button" onClick={applyCoupon} className="rounded-lg bg-[#1d9e75] px-3 py-2 text-sm font-semibold text-white hover:bg-[#15845f]">Apply</button>
              </div>
              {couponMessage && <p className="mt-2 text-xs text-gray-600">{couponMessage}</p>}
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1d9e75] px-4 py-3 font-semibold text-white transition hover:bg-[#15845f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {placing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Placing order...
                </>
              ) : (
                'Place Order'
              )}
            </button>

            <p className="mt-3 text-xs text-gray-500">Orders are saved to Supabase and you’ll be redirected to confirmation.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
