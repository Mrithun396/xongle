'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { useCart } from '@/app/context/CartContext';
import { supabase } from '@/app/lib/supabase';
import {
  ArrowRight,
  BadgePercent,
  Headphones,
  Home as HomeIcon,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkle,
  Sparkles,
  Star,
  Shirt,
  Truck,
  Users,
} from 'lucide-react';

interface ProductCard {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  discount_percent: number;
  image_url: string | null;
}

interface GroupBuyCard {
  id: string;
  product_id: string;
  member_count: number;
  expires_at: string;
  products: ProductCard | null;
}


const trustBadges = [
  { icon: Truck, label: 'Free Delivery', sublabel: 'On orders above ₹499' },
  { icon: ShieldCheck, label: 'Secure Payment', sublabel: '100% encrypted checkout' },
  { icon: BadgePercent, label: 'Easy Returns', sublabel: '15-day hassle free' },
  { icon: Headphones, label: '24/7 Support', sublabel: 'Chat & call assistance' },
];

const categorySections = [
  { value: 'grocery', label: 'Grocery Deals', icon: ShoppingBag, accent: 'bg-emerald-50 text-[#1D9E75]', path: '/products?category=grocery' },
  { value: 'electronics', label: 'Electronics', icon: Smartphone, accent: 'bg-blue-50 text-blue-600', path: '/products?category=electronics' },
  { value: 'fashion', label: 'Fashion', icon: Shirt, accent: 'bg-rose-50 text-rose-600', path: '/products?category=fashion' },
  { value: 'home', label: 'Home', icon: HomeIcon, accent: 'bg-amber-50 text-amber-600', path: '/products?category=home' },
];

export default function Home() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [categoryProducts, setCategoryProducts] = useState<Record<string, ProductCard[]>>({});
  const [activeGroupBuys, setActiveGroupBuys] = useState<GroupBuyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const skeletonTimer = window.setTimeout(() => setShowSkeleton(false), 500);
    return () => window.clearTimeout(skeletonTimer);
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (productsError) {
        console.log('Home products fetch error:', productsError);
        throw productsError;
      }

      const groupedByCategory = {
        grocery: (allProducts || []).filter((product) => product.category === 'grocery').slice(0, 8),
        electronics: (allProducts || []).filter((product) => product.category === 'electronics').slice(0, 8),
        fashion: (allProducts || []).filter((product) => product.category === 'fashion').slice(0, 8),
        home: (allProducts || []).filter((product) => product.category === 'home').slice(0, 8),
        beauty: (allProducts || []).filter((product) => product.category === 'beauty').slice(0, 8),
      };

      const { data: groupBuysData, error: groupBuysError } = await supabase
        .from('group_buys')
        .select('*, products(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4);

      if (groupBuysError) {
        console.log('Home group buys fetch error:', groupBuysError);
        throw groupBuysError;
      }

      setCategoryProducts(groupedByCategory);
      setActiveGroupBuys((groupBuysData || []).map((groupBuy) => ({
        ...groupBuy,
        products: Array.isArray(groupBuy.products) ? groupBuy.products[0] ?? null : groupBuy.products ?? null,
      })));
    } catch (err) {
      console.error('Failed to load landing page data', err);
      setError('Could not load niche products right now. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const handleAddToCart = (product: ProductCard) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      discount_percent: product.discount_percent,
    });
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-[#2D2D2D]">
      <Navbar showSearch={true} />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#053A2D] via-[#0A5A45] to-[#1D9E75] px-4 py-8 text-white sm:px-6 lg:px-8 lg:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_26%)]" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-medium text-white/90 ring-1 ring-white/20 backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Premium group buying for India
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl" style={{ color: '#ffffff' }}>
            Buy together. Save more. Shop smarter.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/80 sm:text-lg">
            Discover trusted essentials, unlock group discounts, and enjoy fast delivery across India — all in one premium shopping experience.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0A5A45] shadow-lg shadow-black/15 transition hover:bg-gray-100"
            >
              Shop now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
            >
              Start group buy
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1D9E75]">Shop by niche</p>
            <h2 className="mt-2 text-2xl font-bold text-[#2D2D2D] sm:text-3xl">Curated deals in every category</h2>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            <button
              onClick={loadHomeData}
              className="self-start rounded-xl bg-[#1d9e75] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#15845f]"
            >
              Retry
            </button>
          </div>
        )}

        {loading && showSkeleton ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {categorySections.map((section) => (
              <div key={section.value} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2 ${section.accent}`}>
                      <section.icon className="h-5 w-5" />
                    </div>
                    <div className="h-4 w-28 rounded bg-gray-200" />
                  </div>
                  <div className="h-4 w-20 rounded bg-gray-200" />
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[1,2,3].map((item) => (
                    <div key={item} className="rounded-2xl bg-gray-100 p-3">
                      <div className="h-28 rounded-xl bg-gray-200" />
                      <div className="mt-3 h-4 w-3/4 rounded bg-gray-200" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {categorySections.map((section) => {
              const products = categoryProducts[section.value] || [];

              return (
                <section key={section.value} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <div className="flex items-center justify-between gap-3 border-b border-[#F0F0F0] pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2 ${section.accent}`}>
                        <section.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-[#2D2D2D]">{section.label}</p>
                      </div>
                    </div>
                    <Link href={section.path} className="text-sm font-bold text-[#1D9E75]">See all →</Link>
                  </div>

                  {products.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
                      No products yet in this category
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {products.map((product) => {
                        const discountedPrice = product.price * (1 - product.discount_percent / 100);

                        return (
                          <Link key={product.id} href={`/products/${product.id}`} className="block">
                            <article className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-[0_1px_6px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                              <div className="relative">
                                <div className="relative aspect-[4/5] bg-[#F6F6F6]">
                                  {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-5xl">📦</div>
                                  )}
                                </div>

                                <div className="flex flex-1 flex-col p-4">
                                  <h3 className="text-sm font-semibold leading-snug text-[#2D2D2D] line-clamp-2">{product.name}</h3>

                                  <div className="mt-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <p className="text-base font-bold text-[#1D9E75]">₹{discountedPrice.toFixed(2)}</p>
                                      {product.discount_percent > 0 && <p className="text-xs text-gray-400 line-through">₹{product.price.toFixed(2)}</p>}
                                    </div>
                                    {product.discount_percent > 0 && (
                                      <span className="rounded-full bg-[#FFF1F0] px-2 py-1 text-[10px] font-bold text-[#FF6161]">
                                        {product.discount_percent}% off
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-2 flex items-center gap-1 text-xs font-medium text-[#6B7280]">
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                    <span>4.2</span>
                                  </div>

                                  <div className="mt-4 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => handleAddToCart(product)}
                                      className="rounded-xl bg-[#1D9E75] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#15845f]"
                                    >
                                      Add to Cart
                                    </button>
                                    <button
                                      onClick={() => router.push(`/start-group/${product.id}`)}
                                      className="rounded-xl border border-[#1D9E75] bg-white px-3 py-2.5 text-xs font-bold text-[#1D9E75] transition hover:bg-emerald-50"
                                    >
                                      Group Buy
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-3 md:grid-cols-4">
          {trustBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.label} className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/5">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-emerald-50 p-2 text-[#1D9E75]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2D2D2D]">{badge.label}</p>
                    <p className="mt-1 text-xs text-gray-500">{badge.sublabel}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 pt-2 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1D9E75]">Live community</p>
              <h2 className="mt-2 text-2xl font-bold text-[#2D2D2D]">Join active group buys</h2>
            </div>
            <div className="rounded-full bg-[#F6F6F6] px-3 py-1 text-xs font-bold text-[#2D2D2D]">{activeGroupBuys.length} live now</div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {activeGroupBuys.map((groupBuy) => {
              const product = groupBuy.products;
              const discountedPrice = product ? product.price * (1 - product.discount_percent / 100) : 0;

              return (
                <Link
                  key={groupBuy.id}
                  href={`/group/${groupBuy.id}`}
                  className="rounded-2xl border border-black/5 bg-[#F6F6F6] p-5 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1D9E75]">Community deal</p>
                      <h3 className="mt-2 text-lg font-bold text-[#2D2D2D]">{product?.name || 'Featured product'}</h3>
                    </div>
                    <span className="rounded-full bg-[#1D9E75] px-2.5 py-1 text-[10px] font-bold text-white">{groupBuy.member_count} joined</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{product?.description || 'Join buyers saving on premium essentials.'}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#1D9E75]">₹{discountedPrice.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Estimated group price</p>
                    </div>
                    <span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#2D2D2D] shadow-sm">Join now</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
