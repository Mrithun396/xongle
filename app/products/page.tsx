'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { ShoppingCart, Users, Filter } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  discount_percent: number;
  seller_id: string;
}

interface GroupBuy {
  id: string;
  product_id: string;
  member_count: number;
  status: string;
}

interface ProductWithGroupBuy extends Product {
  activeGroupBuy?: GroupBuy;
}

const CATEGORIES = ['All', 'Grocery', 'Electronics', 'Fashion', 'Home'];

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithGroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [user, setUser] = useState<any>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      setUser(data.session.user);
    };
    checkAuth();
  }, [router]);

  // Fetch products and group buys
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch active products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'active');

        if (productsError) throw productsError;

        // Fetch active group buys
        const { data: groupBuysData, error: groupBuysError } = await supabase
          .from('group_buys')
          .select('*')
          .eq('status', 'active');

        if (groupBuysError) throw groupBuysError;

        // Combine data - add active group buy info to each product
        const productsWithGroupBuys = productsData.map((product) => {
          const activeGroupBuy = groupBuysData?.find(
            (gb) => gb.product_id === product.id
          );
          return {
            ...product,
            activeGroupBuy,
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

    if (user) {
      fetchProducts();
    }
  }, [user]);

  // Filter products by category
  const filteredProducts = products.filter((product) => {
    if (selectedCategory === 'All') return true;
    return product.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleJoinGroupBuy = (productId: string, groupBuyId: string) => {
    router.push(`/group-buy/${groupBuyId}`);
  };

  const handleStartGroupBuy = (productId: string) => {
    router.push(`/create-group-buy/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#1d9e75] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">X</span>
                </div>
                <span className="font-bold text-lg text-gray-900">Xongle</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Loading State */}
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1d9e75] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1d9e75] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">X</span>
              </div>
              <span className="font-bold text-lg text-gray-900">Xongle</span>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-[#1d9e75] transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Browse Products
          </h1>
          <p className="text-gray-600">
            {filteredProducts.length} {selectedCategory === 'All' ? 'products' : `${selectedCategory.toLowerCase()} products`} available
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* Category Filter Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-[#1d9e75] text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-[#1d9e75]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No products found in this category</p>
              <p className="text-gray-500 text-sm mt-2">Try selecting a different category</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const discountedPrice = product.price * (1 - product.discount_percent / 100);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden flex flex-col"
                >
                  {/* Product Image */}
                  <div className="relative w-full h-48 bg-gray-100 overflow-hidden group">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-12 h-12 text-gray-300" />
                      </div>
                    )}

                    {/* Discount Badge */}
                    {product.discount_percent > 0 && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {product.discount_percent}% OFF
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3 bg-[#1d9e75] text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {product.category}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    {/* Name */}
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Description */}
                    {product.description && (
                      <p className="text-gray-500 text-xs sm:text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* Pricing */}
                    <div className="mb-3 flex items-center gap-2">
                      <div>
                        <div className="text-lg sm:text-xl font-bold text-[#1d9e75]">
                          ₹{discountedPrice.toFixed(2)}
                        </div>
                        {product.discount_percent > 0 && (
                          <div className="text-xs text-gray-500 line-through">
                            ₹{product.price.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Group Buy Info */}
                    {product.activeGroupBuy && (
                      <div className="flex items-center gap-1 text-sm text-[#1d9e75] mb-4 bg-green-50 px-3 py-2 rounded-lg">
                        <Users className="w-4 h-4" />
                        <span className="font-semibold">{product.activeGroupBuy.member_count} people</span>
                        <span className="text-gray-600">joined</span>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-2 mt-auto">
                      {product.activeGroupBuy ? (
                        <>
                          <button
                            onClick={() =>
                              handleJoinGroupBuy(
                                product.id,
                                product.activeGroupBuy!.id
                              )
                            }
                            className="flex-1 bg-[#1d9e75] hover:bg-[#085041] text-white font-semibold py-2 rounded-lg transition-colors text-sm"
                          >
                            Join Group Buy
                          </button>
                          <button
                            onClick={() => handleStartGroupBuy(product.id)}
                            className="flex-1 border-2 border-[#1d9e75] text-[#1d9e75] hover:bg-green-50 font-semibold py-2 rounded-lg transition-colors text-sm"
                          >
                            Start New
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleStartGroupBuy(product.id)}
                          className="w-full bg-[#1d9e75] hover:bg-[#085041] text-white font-semibold py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Start Group Buy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
