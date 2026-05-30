'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { CheckCircle, Package, CalendarDays, Truck, MapPin } from 'lucide-react';

interface OrderSummary {
  orderIds: string[];
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    discountedPrice: number;
  }>;
  subtotal: number;
  couponDiscount: number;
  tax: number;
  total: number;
  estimatedDelivery: string;
  delivery: {
    name: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
    state: string;
  };
}

export default function OrderConfirmationPage() {
  const [orderId, setOrderId] = useState('');
  const [summary, setSummary] = useState<OrderSummary | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setOrderId(params.get('orderId') || '');
    }

    const saved = localStorage.getItem('xongle_last_order');
    if (saved) {
      try {
        setSummary(JSON.parse(saved));
      } catch {
        setSummary(null);
      }
    }
  }, []);

  const estimatedDelivery = useMemo(() => {
    if (!summary?.estimatedDelivery) return '5-7 working days';
    return new Date(summary.estimatedDelivery).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [summary]);

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Navbar showSearch={false} />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-[#1d9e75]">
                <CheckCircle className="h-4 w-4" />
                Order confirmed
              </div>
              <h1 className="mt-3 text-3xl font-bold text-gray-950">Your order is in progress</h1>
              <p className="mt-2 text-gray-600">Thanks for shopping with Xongle. Your order details are saved below.</p>
            </div>

            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">Order ID</p>
              <p className="mt-1 font-mono text-[#1d9e75]">{orderId || summary?.orderIds?.[0] || 'N/A'}</p>
            </div>
          </div>

          {summary ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-5">
                <div className="rounded-2xl bg-gray-50 p-5">
                  <div className="flex items-center gap-2 text-[#1d9e75]">
                    <Package className="h-5 w-5" />
                    <h2 className="text-lg font-bold text-gray-950">Order items</h2>
                  </div>
                  <div className="mt-4 space-y-3">
                    {summary.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-950">₹{(item.discountedPrice * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-5">
                  <div className="flex items-center gap-2 text-[#1d9e75]">
                    <MapPin className="h-5 w-5" />
                    <h2 className="text-lg font-bold text-gray-950">Delivery address</h2>
                  </div>
                  <div className="mt-3 text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">{summary.delivery.name}</p>
                    <p className="mt-1">{summary.delivery.address}</p>
                    <p>{summary.delivery.city}, {summary.delivery.state} - {summary.delivery.pincode}</p>
                    <p className="mt-1">Phone: {summary.delivery.phone}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-5">
                <div className="rounded-2xl bg-green-50 p-5">
                  <div className="flex items-center gap-2 text-[#1d9e75]">
                    <CalendarDays className="h-5 w-5" />
                    <h2 className="text-lg font-bold text-gray-950">Estimated delivery</h2>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-[#1d9e75]">{estimatedDelivery}</p>
                  <p className="mt-2 text-sm text-gray-600">We’ll update you on shipment progress once your order is packed.</p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-5">
                  <div className="flex items-center gap-2 text-[#1d9e75]">
                    <Truck className="h-5 w-5" />
                    <h2 className="text-lg font-bold text-gray-950">Payment summary</h2>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{summary.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Coupon discount</span><span>-₹{summary.couponDiscount.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Tax</span><span>₹{summary.tax.toFixed(2)}</span></div>
                    <div className="mt-3 border-t border-gray-200 pt-3 flex justify-between text-base font-bold text-gray-950"><span>Total</span><span className="text-[#1d9e75]">₹{summary.total.toFixed(2)}</span></div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link href="/dashboard" className="flex-1 rounded-lg bg-[#1d9e75] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#15845f]">View orders</Link>
                  <Link href="/products" className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50">Continue shopping</Link>
                </div>
              </section>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl bg-gray-50 p-6 text-sm text-gray-600">Your order confirmation is not available right now. Continue shopping to place another order.</div>
          )}
        </div>
      </div>
    </div>
  );
}
