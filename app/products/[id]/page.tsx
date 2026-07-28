'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { createClient } from '@/app/lib/supabase';
import { useCart } from '@/app/context/CartContext';
import { useAuth } from '@/app/context/AuthContext';
import { ArrowLeft, ShoppingCart, Star, Zap, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  discount_percent: number;
  image_url: string | null;
  seller_id: string | null;
  status: string;
}

interface GroupBuy {
  id: string;
  product_id: string;
  member_count: number;
  status: string;
  expires_at: string | null;
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

  const { addToCart } = useCart();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    console.log('effect fired, authLoading:', authLoading, 'user:', !!user);

    const fetchProduct = async () => {
      try {
        const supabase = createClient();
        setLoading(true);
        setError('');

        console.time(`fetchProduct:${productId}`);
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        console.timeEnd(`fetchProduct:${productId}`);

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
  }, [productId, authLoading]);

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

  const handleBuyNow = () => {
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

    router.push('/checkout');
  };

  const formatTimeLeft = (expires_at: string | null) => {
    if (!expires_at) return 'Permanent';
    const diff = new Date(expires_at).getTime() - Date.now();
    if (diff <= 0) return 'Closing soon';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h left`;
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
  const freeDelivery = discountedPrice > 499;
  const sellerName = product.seller_id ? `Seller ${product.seller_id.slice(0, 8)}` : 'Xongle Marketplace';
  const highlights = product.description
    ? product.description
        .split('.')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 4)
    : [
        'Fast delivery across India for qualified orders.',
        'Designed for hassle-free group ordering and savings.',
        'Secure checkout with reliable customer support.',
        'Inclusive pricing with no hidden taxes.',
      ];

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Navbar showSearch={false} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1d9e75]">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="relative overflow-hidden rounded-[32px] bg-white p-6">
              {product.discount_percent > 0 && (
                <div className="absolute left-6 top-6 rounded-full bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg">
                  {product.discount_percent}% OFF
                </div>
              )}
              <div className="min-h-[520px] flex items-center justify-center bg-[#f8faf9] p-6">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="max-h-[520px] w-full max-w-[620px] object-contain" />
                ) : (
                  <div className="flex h-80 w-full items-center justify-center rounded-3xl bg-gray-100 text-6xl text-gray-300">📦</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full bg-[#1d9e75] px-3 py-1 text-xs font-semibold text-white">{product.category}</span>
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">{product.discount_percent}% saved</span>
              </div>

              <h1 className="mt-4 text-4xl font-bold text-gray-950 sm:text-5xl">{product.name}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F4FAF8] px-3 py-1 font-semibold text-[#1d9e75]">4.2 ★</span>
                <span className="text-sm font-medium text-gray-500">(128 reviews)</span>
              </div>

              <div className="mt-6 rounded-[28px] bg-[#f0fdf4] p-6">
                <div className="flex items-end gap-4 flex-wrap">
                  <p className="text-5xl font-bold leading-none text-[#127A4B]">₹{discountedPrice.toFixed(2)}</p>
                  <div>
                    <p className="text-base text-gray-500 line-through">₹{product.price.toFixed(2)}</p>
                    <span className="mt-2 inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-600">{product.discount_percent}% OFF</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600">Inclusive of all taxes</p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[28px] border border-gray-200 bg-white p-4">
                  <p className="text-sm font-semibold text-[#1d9e75]">{freeDelivery ? 'Free delivery' : 'Standard delivery'}</p>
                  <p className="mt-1 text-sm text-gray-600">{freeDelivery ? 'Free delivery on orders above ₹499' : 'Expected delivery fee applies'}</p>
                </div>
                <div className="rounded-[28px] border border-gray-200 bg-white p-4">
                  <p className="text-sm font-semibold text-[#2d2d2d]">Expected delivery</p>
                  <p className="mt-1 text-sm text-gray-600">3-5 business days</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2">
                  <button onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="h-10 w-10 rounded-xl bg-gray-100 text-lg font-semibold text-gray-700">−</button>
                  <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} className="w-16 border-0 bg-transparent text-center text-lg font-semibold text-gray-900 focus:outline-none" />
                  <button onClick={() => setQuantity((current) => current + 1)} className="h-10 w-10 rounded-xl bg-gray-100 text-lg font-semibold text-gray-700">+</button>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <button onClick={handleAddToCart} className="w-full rounded-2xl bg-[#1d9e75] px-5 py-4 text-center text-base font-semibold text-white transition hover:bg-[#15845f]">
                  Add to Cart
                </button>
                <button onClick={handleBuyNow} className="w-full rounded-2xl bg-[#111111] px-5 py-4 text-center text-base font-semibold text-white transition hover:bg-[#333333]">
                  Buy Now
                </button>
                <button onClick={handleStartGroupBuy} className="w-full rounded-2xl border-2 border-[#1d9e75] bg-white px-5 py-4 text-center text-base font-semibold text-[#1d9e75] transition hover:bg-green-50">
                  Group Buy
                </button>
              </div>

              {cartMessage && (
                <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
                  <CheckCircle className="inline h-4 w-4 align-text-bottom" /> {cartMessage}
                </div>
              )}
            </div>

            <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1d9e75]">Group buy info</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-950">{groupBuys.length} active group buys for this product</h2>
                </div>
                <Users className="h-6 w-6 text-[#1d9e75]" />
              </div>

              {groupBuys.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                  No active group buys yet. Start one to invite friends and save more.
                </div>
              ) : (
                <div className="space-y-4">
                  {groupBuys.slice(0, 4).map((groupBuy) => (
                    <div key={groupBuy.id} className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-[#f8faf9] p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-gray-950">{groupBuy.member_count} members joined</p>
                        <p className="mt-1 text-sm text-gray-600">{formatTimeLeft(groupBuy.expires_at)}</p>
                      </div>
                      <button onClick={() => handleJoinGroupBuy(groupBuy.id)} className="rounded-full bg-[#1d9e75] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#15845f]">
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-2xl font-bold text-gray-950">Product description</h2>
            <p className="mt-4 text-gray-600 leading-7">{product.description || 'A premium product available through Xongle group buys with quality assurance and fast delivery.'}</p>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-950">Key highlights</h3>
              <ul className="mt-4 space-y-3 list-disc pl-5 text-gray-600">
                {highlights.map((highlight, index) => (
                  <li key={index}>{highlight}</li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h3 className="text-xl font-semibold text-gray-950">Seller info</h3>
              <p className="mt-4 text-sm text-gray-600">Sold by <span className="font-semibold text-gray-900">{sellerName}</span></p>
              <p className="mt-3 text-sm text-gray-600">Reliable shipping from trusted partners, 30-day returns, and secure payment.</p>
              <div className="mt-5 space-y-3 rounded-3xl bg-[#F4FAF8] p-4 text-sm text-gray-700">
                <p className="font-semibold text-[#1d9e75]">Why buy from us</p>
                <p>Fast dispatch and safe delivery.</p>
                <p>Verified group purchase support.</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-10 rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-gray-100">
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
                  <Link key={item.id} href={`/products/${item.id}`} className="overflow-hidden rounded-3xl border border-gray-100 transition hover:-translate-y-0.5 hover:shadow-lg">
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
