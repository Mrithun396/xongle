'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { useCart } from '@/app/context/CartContext';
import { createClient } from '@/app/lib/supabase';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Zap,
  LogIn,
} from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleCheckout = () => {
    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  const subtotal = cartTotal;
  const deliveryCharge = subtotal > 499 ? 0 : 49;
  const total = subtotal + deliveryCharge;
  const savings = cart.reduce((total, item) => {
    const discountedPrice = item.price * (1 - item.discount_percent / 100);
    return total + (item.price - discountedPrice) * item.quantity;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1d9e75] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
      <Navbar showSearch={false} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#1d9e75] hover:text-[#085041] mb-8 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Shopping
        </button>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {/* Empty Cart */}
        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Start adding products to your cart and save big with group buying!
            </p>
            <Link
              href="/products"
              className="inline-block px-8 py-3 bg-[#1d9e75] text-white font-bold rounded-lg hover:bg-[#085041]"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => {
                const discountedPrice =
                  item.price * (1 - item.discount_percent / 100);
                const itemTotal = discountedPrice * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-md p-6 flex gap-6"
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">📦</span>
                        )}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">
                        {item.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-2xl font-bold text-[#1d9e75]">
                          ₹{discountedPrice.toFixed(2)}
                        </span>
                        <span className="text-lg text-gray-500 line-through">
                          ₹{item.price.toFixed(2)}
                        </span>
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-bold">
                          {item.discount_percent}% OFF
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="mt-4 flex items-center gap-4">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.id,
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="w-12 text-center border border-gray-300 rounded py-1"
                        />
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Item Total & Remove */}
                    <div className="flex flex-col items-end justify-between">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">Subtotal</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{itemTotal.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 space-y-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Order Summary
                </h3>

                {/* Savings */}
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    <p className="font-semibold text-green-700">You Save</p>
                  </div>
                  <p className="text-3xl font-bold text-green-600">₹{savings.toFixed(2)}</p>
                  <p className="text-xs text-green-700 mt-1">with group discounts</p>
                </div>

                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery charge</span>
                    <span className={deliveryCharge === 0 ? 'text-green-600 font-semibold' : 'text-gray-900'}>
                      {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-3xl font-bold text-[#1d9e75]">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Auth Gate */}
                {user ? (
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-[#1d9e75] hover:bg-[#085041] text-white font-bold py-3 rounded-lg transition-colors"
                  >
                    Proceed to Checkout
                  </button>
                ) : (
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-[#1d9e75] hover:bg-[#15845f] text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In to Checkout
                  </button>
                )}

                {/* Continue Shopping */}
                <Link
                  href="/products"
                  className="w-full border-2 border-gray-300 text-gray-900 font-bold py-2 rounded-lg hover:border-[#1d9e75] transition-colors text-center"
                >
                  Continue Shopping
                </Link>

                {/* Trust Badge */}
                <div className="pt-4 border-t border-gray-200 text-center text-xs text-gray-600">
                  <p className="mb-2">✓ Secure Checkout</p>
                  <p className="mb-2">✓ SSL Encrypted</p>
                  <p>✓ Easy Returns</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
