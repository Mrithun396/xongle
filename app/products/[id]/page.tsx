'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { supabase } from '@/app/lib/supabase';
import { useCart } from '@/app/context/CartContext';
import { ArrowLeft, ShoppingCart, Star, Zap, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  discount_percent: number;
  image_url: string | null;
  status: string;
}

interface GroupBuy {
  id: string;
  product_id: string;
  member_count: number;
  status: string;
  expires_at: string;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  const { addToCart } = useCart();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (productError) throw productError;
        setProduct(productData);

        const { data: groupBuysData, error: groupBuysError } = await supabase
          .from('group_buys')
          .select('*')
          .eq('product_id', productId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (groupBuysError) throw groupBuysError;
        setGroupBuys(groupBuysData || []);

        const { data: relatedData, error: relatedError } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'active')
          .eq('category', productData.category)
          .neq('id', productData.id)
          .limit(4);

        if (relatedError) {
          throw relatedError;
        }

        setRelatedProducts(relatedData || []);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;

    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        discount_percent: product.discount_percent,
      },
      quantity
    );

    setCartMessage(`${quantity} item${quantity > 1 ? 's' : ''} added to cart!`);
    setTimeout(() => setCartMessage(''), 3000);
  };

  const handleJoinGroupBuy = (groupBuyId: string) => {
    if (!user) {
      router.push(`/login?redirect=/group/${groupBuyId}`);
      return;
    }
    router.push(`/group/${groupBuyId}`);
  };

  const handleStartGroupBuy = () => {
    if (!user) {
      router.push(`/login?redirect=/start-group/${productId}`);
      return;
    }
    router.push(`/start-group/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar showSearch={false} />
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#1d9e75] border-t-transparent"></div>
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar showSearch={false} />
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg ring-1 ring-gray-100">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <p className="mb-4 text-lg text-gray-700">{error || 'Product not found.'}</p>
            <button onClick={() => router.push('/products')} className="rounded-lg bg-[#1d9e75] px-5 py-2 font-semibold text-white hover:bg-[#15845f]">
              Back to products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const discountedPrice = product.price * (1 - product.discount_percent / 100);
  const savings = product.price - discountedPrice;

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Navbar showSearch={false} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1d9e75]">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="overflow-hidden rounded-2xl bg-gray-100">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-[480px] w-full object-cover" />
              ) : (
                <div className="flex h-[480px] items-center justify-center text-6xl text-gray-300">📦</div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full bg-[#1d9e75] px-3 py-1 text-xs font-semibold text-white">{product.category}</span>
                {product.discount_percent > 0 && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">{product.discount_percent}% OFF</span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-bold text-gray-950 sm:text-4xl">{product.name}</h1>
              <p className="mt-3 text-base leading-7 text-gray-600">{product.description || 'A premium product available through Xongle group buys.'}</p>

              <div className="mt-5 flex items-center gap-2 text-sm text-gray-500">
                <div className="flex gap-1 text-yellow-400">
                  {[...Array(5)].map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
                </div>
                <span>(128 reviews)</span>
              </div>

              <div className="mt-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-100 p-5">
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-bold text-[#1d9e75]">₹{discountedPrice.toFixed(2)}</p>
                  <p className="text-lg text-gray-500 line-through">₹{product.price.toFixed(2)}</p>
                </div>
                <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#1d9e75]">
                  <Zap className="h-4 w-4" />
                  Save ₹{savings.toFixed(2)} with group savings
                </p>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2">
                  <button onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="h-8 w-8 rounded-md bg-gray-100 text-lg font-semibold text-gray-700">−</button>
                  <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} className="w-12 border-0 bg-transparent text-center text-sm font-semibold text-gray-900 focus:outline-none" />
                  <button onClick={() => setQuantity((current) => current + 1)} className="h-8 w-8 rounded-md bg-gray-100 text-lg font-semibold text-gray-700">+</button>
                </div>

                <div className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">Ready for group buying</div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button onClick={handleAddToCart} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1d9e75] px-4 py-3 font-semibold text-white transition hover:bg-[#15845f]">
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </button>
                <button onClick={handleStartGroupBuy} className="inline-flex items-center justify-center rounded-lg border-2 border-[#1d9e75] px-4 py-3 font-semibold text-[#1d9e75] transition hover:bg-green-50">
                  {user ? 'Start Group Buy' : 'Sign In to Start Group Buy'}
                </button>
              </div>

              {cartMessage && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  {cartMessage}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1d9e75]">Active group buys</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-950">{groupBuys.length} community buys live</h2>
                </div>
                <Users className="h-5 w-5 text-[#1d9e75]" />
              </div>

              {groupBuys.length === 0 ? (
                <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">No active group buys yet. Start a new one to invite friends.</div>
              ) : (
                <div className="space-y-3">
                  {groupBuys.slice(0, 4).map((groupBuy) => (
                    <button
                      key={groupBuy.id}
                      onClick={() => handleJoinGroupBuy(groupBuy.id)}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition hover:border-[#1d9e75] hover:bg-green-50"
                    >
                      <div>
                        <p className="font-semibold text-gray-950">{groupBuy.member_count} people joined</p>
                        <p className="mt-1 text-xs text-gray-500">Open group to join and share your savings</p>
                      </div>
                      <span className="rounded-full bg-[#1d9e75] px-3 py-1 text-xs font-bold text-white">Join</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1d9e75]">Related products</p>
              <h2 className="mt-1 text-xl font-bold text-gray-950">More in {product.category}</h2>
            </div>
            <Link href="/products" className="text-sm font-semibold text-[#1d9e75]">View all</Link>
          </div>

          {relatedProducts.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">No related products found right now.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((item) => {
                const relatedDiscountedPrice = item.price * (1 - item.discount_percent / 100);

                return (
                  <Link key={item.id} href={`/products/${item.id}`} className="overflow-hidden rounded-2xl border border-gray-100 transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="h-40 bg-gray-100">
                      {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl">📦</div>}
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d9e75]">{item.category}</p>
                      <p className="mt-2 font-semibold text-gray-950">{item.name}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-[#1d9e75]">₹{relatedDiscountedPrice.toFixed(2)}</p>
                          {item.discount_percent > 0 && <p className="text-xs text-gray-500 line-through">₹{item.price.toFixed(2)}</p>}
                        </div>
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-[#1d9e75]">Open</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
