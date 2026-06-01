'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { supabase } from '@/app/lib/supabase';
import { useCart } from '@/app/context/CartContext';
import {
  CheckCircle2,
  Filter,
  Search,
  ShoppingCart,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  discount_percent: number;
  seller_id: string;
  created_at?: string | null;
}

interface GroupBuy {
  id: string;
  product_id: string;
  member_count: number;
  status: string;
}

interface ProductWithGroupBuy extends Product {
  activeGroupBuyCount?: number;
}

const CATEGORY_OPTIONS = ['All', 'Grocery', 'Electronics', 'Fashion', 'Home'];
const PRICE_FILTERS = [
  { label: 'All', value: 'all' },
  { label: '₹0 - ₹500', value: '0-500' },
  { label: '₹500 - ₹1000', value: '500-1000' },
  { label: '₹1000+', value: '1000+' },
];

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithGroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceFilter, setPriceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [user, setUser] = useState<any>(null);
  const [cartMessage, setCartMessage] = useState<{ [key: string]: string }>({});
  const { addToCart } = useCart();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search).get('search') || new URLSearchParams(window.location.search).get('q');
    const categoryParam = new URLSearchParams(window.location.search).get('category');
    if (q) setSearchQuery(q);
    if (categoryParam) setSelectedCategory(categoryParam);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');

        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'active');

        if (productsError) throw productsError;

        const { data: groupBuysData, error: groupBuysError } = await supabase
          .from('group_buys')
          .select('*')
          .eq('status', 'active');

        if (groupBuysError) throw groupBuysError;

        const productsWithGroupBuys = (productsData || []).map((product) => {
          const activeGroupBuyCount = (groupBuysData || []).filter((gb) => gb.product_id === product.id).length;
          return {
            ...product,
            activeGroupBuyCount,
          };
        });

        setProducts(productsWithGroupBuys);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = !searchQuery || [product.name, product.description].filter(Boolean).some((value) => value?.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesPrice = true;
      const discountedPrice = product.price * (1 - product.discount_percent / 100);
      if (priceFilter === '0-500') matchesPrice = discountedPrice <= 500;
      if (priceFilter === '500-1000') matchesPrice = discountedPrice >= 500 && discountedPrice <= 1000;
      if (priceFilter === '1000+') matchesPrice = discountedPrice >= 1000;

      return matchesCategory && matchesSearch && matchesPrice;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'price-low') return (a.price * (1 - a.discount_percent / 100)) - (b.price * (1 - b.discount_percent / 100));
      if (sortBy === 'price-high') return (b.price * (1 - b.discount_percent / 100)) - (a.price * (1 - a.discount_percent / 100));
      if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return (b.discount_percent || 0) - (a.discount_percent || 0);
    });

    return sorted;
  }, [products, selectedCategory, priceFilter, searchQuery, sortBy]);

  const handleJoinGroupBuy = (productId: string) => {
    if (!user) {
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }
    router.push(`/products/${productId}`);
  };

  const handleStartGroupBuy = (productId: string) => {
    if (!user) {
      router.push(`/login?redirect=/start-group/${productId}`);
      return;
    }
    router.push(`/start-group/${productId}`);
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      discount_percent: product.discount_percent,
    });

    setCartMessage((current) => ({ ...current, [product.id]: 'Added to cart!' }));
    setTimeout(() => {
      setCartMessage((current) => ({ ...current, [product.id]: '' }));
    }, 2000);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query)}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    router.push('/products');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F6F6]">
        <Navbar showSearch={true} onSearch={handleSearch} />
        <div className="mx-auto flex min-h-[400px] max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#1D9E75] border-t-transparent" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-[#2D2D2D]">
      <Navbar showSearch={true} onSearch={handleSearch} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              {searchQuery ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1D9E75]">Search results</p>
                  <h1 className="mt-2 text-3xl font-bold text-[#2D2D2D] sm:text-4xl">{filteredProducts.length} results for "{searchQuery}"</h1>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1D9E75]">Shop curated deals</p>
                  <h1 className="mt-2 text-3xl font-bold text-[#2D2D2D] sm:text-4xl">Premium products for every group buy</h1>
                  <p className="mt-2 max-w-2xl text-sm text-gray-600">
                    Filter by category, compare prices, and join community deals with one click.
                  </p>
                </>
              )}
            </div>

            <div className="w-full max-w-sm rounded-2xl bg-[#F6F6F6] p-3">
              <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm">
                <Search className="h-4 w-4 text-[#1D9E75]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  placeholder="Search products"
                  className="w-full bg-transparent text-sm text-[#2D2D2D] outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:sticky lg:top-24 lg:h-fit">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-[#F4FAF8] p-2 text-[#1D9E75]">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <p className="text-base font-bold text-[#2D2D2D]">Filters</p>
                <p className="text-xs text-gray-500">Refine your savings</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1D9E75]">Niche</p>
              <div className="mt-3 space-y-2">
                {CATEGORY_OPTIONS.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${selectedCategory === category ? 'bg-[#1D9E75] text-white' : 'bg-[#F6F6F6] text-[#2D2D2D] hover:bg-[#E8F6F0]'}`}
                  >
                    <span>{category}</span>
                    {selectedCategory === category && <CheckCircle2 className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1D9E75]">Price range</p>
              <div className="mt-3 space-y-2">
                {PRICE_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setPriceFilter(filter.value)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${priceFilter === filter.value ? 'bg-[#FF6161] text-white' : 'bg-[#F6F6F6] text-[#2D2D2D] hover:bg-[#FFE8E8]'}`}
                  >
                    <span>{filter.label}</span>
                    {priceFilter === filter.value && <CheckCircle2 className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[#F8FBFA] p-4 ring-1 ring-[#E2EEE8]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#1D9E75]" />
                <p className="text-sm font-bold text-[#2D2D2D]">Smart ordering</p>
              </div>
              <p className="mt-2 text-xs text-gray-600">Join active communities, compare prices instantly, and unlock better deals with group buying.</p>
            </div>
          </aside>

          <section>
            <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-[#2D2D2D]">{filteredProducts.length} products available</p>
                <p className="text-xs text-gray-500">
                  {searchQuery ? `Showing results for "${searchQuery}"` : 'Browse curated bundles and seasonal offers'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-[#D8E8E3] bg-[#F8FBFA] px-3 py-2 text-sm text-[#2D2D2D] outline-none"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
                <Filter className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-lg font-bold text-[#2D2D2D]">{searchQuery ? `No products found for "${searchQuery}"` : 'No products matched'}</p>
                <p className="mt-1 text-sm text-gray-500">{searchQuery ? 'Try different keywords or browse all products.' : 'Try adjusting your filters or search terms.'}</p>
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="mt-4 rounded-lg bg-[#1D9E75] px-6 py-2 font-semibold text-white hover:bg-[#15845f]"
                  >
                    Browse all products
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {filteredProducts.map((product) => {
                  const discountedPrice = product.price * (1 - product.discount_percent / 100);
                  const hasGroupBuy = Boolean(product.activeGroupBuyCount);

                  return (
                    <Link key={product.id} href={`/products/${product.id}`} className="block">
                      <article className="group cursor-pointer flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_6px_rgba(0,0,0,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                        <div className="relative">
                        <div className="relative aspect-[4/5] bg-[#F6F6F6]">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-5xl">📦</div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col p-4">
                          <h2 className="text-sm font-semibold leading-snug text-[#2D2D2D] line-clamp-2">{product.name}</h2>

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

                        {product.activeGroupBuyCount ? (
                          <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#F4FAF8] px-3 py-2 text-xs font-semibold text-[#1D9E75]">
                            <Users className="h-3.5 w-3.5" />
                            {product.activeGroupBuyCount} active group{product.activeGroupBuyCount !== 1 ? 's' : ''}
                          </div>
                        ) : (
                          <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                            No active groups yet
                          </div>
                        )}

                        <div className="mt-4 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="rounded-xl bg-[#1D9E75] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#15845f]"
                          >
                            Add to Cart
                          </button>
                          <button
                            type="button"
                            onClick={() => product.activeGroupBuyCount ? handleJoinGroupBuy(product.id) : handleStartGroupBuy(product.id)}
                            className="rounded-xl border border-[#1d9e75] bg-white px-3 py-2.5 text-xs font-bold text-[#1d9e75] transition hover:bg-emerald-50"
                          >
                            {product.activeGroupBuyCount ? 'View Groups' : 'Start Group'}
                          </button>
                        </div>

                        {cartMessage[product.id] && (
                          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-[#1D9E75]">{cartMessage[product.id]}</p>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
