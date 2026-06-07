'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import { ArrowLeft, Calendar, Users } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  discount_percent: number;
  image_url: string | null;
}

export default function CreateGroupBuyPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [expiresIn, setExpiresIn] = useState('7');
  const [user, setUser] = useState<any>(null);

  const productId = params.productId as string;

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      setUser(data.session.user);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const supabase = createClient();
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (error) throw error;
        setProduct(data);
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

  const handleCreateGroupBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;

    try {
      const supabase = createClient();
      setCreating(true);
      setError('');

      const authUserId = user.id;
      const expiresAt = expiresIn === 'permanent' ? null : new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000);

      console.log('Creating group buy', {
        authUserId,
        productId: product.id,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
      });

      // Create group buy
      const { data: groupBuyData, error: gbError } = await supabase
        .from('group_buys')
        .insert([
          {
            product_id: product.id,
            creator_id: authUserId,
            status: 'active',
            member_count: 1,
            expires_at: expiresAt ? expiresAt.toISOString() : null,
          },
        ])
        .select()
        .single();

      if (gbError) {
        console.error('Group buy insert error:', gbError, {
          authUserId,
          productId: product.id,
          expiresAt,
        });
        throw gbError;
      }

      // Add creator as first member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([
          {
            group_buy_id: groupBuyData.id,
            user_id: authUserId,
            is_ready: false,
          },
        ]);

      if (memberError) {
        console.error('Group member insert error:', memberError, {
          authUserId,
          groupBuyId: groupBuyData.id,
        });
        throw memberError;
      }

      // Redirect to group page
      router.push(`/group/${groupBuyData.id}`);
    } catch (err) {
      console.error('Error creating group buy:', err);
      setError('Failed to create group buy. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
        <nav className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#1d9e75] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">X</span>
                </div>
                <span className="font-bold text-lg text-gray-900">Xongle</span>
              </div>
            </div>
          </div>
        </nav>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1d9e75] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
        <nav className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[#1d9e75] hover:text-[#085041]"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            </div>
          </div>
        </nav>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600 text-lg">{error || 'Product not found'}</p>
            <button
              onClick={() => router.push('/products')}
              className="mt-4 px-6 py-2 bg-[#1d9e75] text-white rounded-lg hover:bg-[#085041]"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const discountedPrice = product.price * (1 - product.discount_percent / 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[#1d9e75] hover:text-[#085041] font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1d9e75] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">X</span>
              </div>
              <span className="font-bold text-lg text-gray-900">Xongle</span>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Product Summary</h2>

            <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-gray-300 text-4xl">📦</div>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>

            {product.description && (
              <p className="text-gray-600 text-sm mb-4">{product.description}</p>
            )}

            <div className="mb-4">
              <span className="inline-block bg-[#1d9e75] text-white px-3 py-1 rounded-full text-xs font-semibold">
                {product.category}
              </span>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Current Price</p>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold text-[#1d9e75]">
                  ₹{discountedPrice.toFixed(2)}
                </div>
                {product.discount_percent > 0 && (
                  <div className="text-gray-500 text-sm line-through">
                    ₹{product.price.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Create Group Buy Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Start a Group Buy</h2>
            <p className="text-gray-600 text-sm mb-6">
              Create a group and invite others to buy together and unlock better discounts.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateGroupBuy} className="space-y-4">
              {/* Expires In */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#1d9e75]" />
                  Group Expires In
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d9e75]"
                >
                  <option value="3">3 Days</option>
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                  <option value="permanent">Permanent (No expiry)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Group will automatically close after this period
                </p>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <Users className="w-5 h-5 text-[#1d9e75] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">You'll be the first member</p>
                    <p className="text-gray-600 text-sm">
                      After creating, you can invite friends via WhatsApp to join and buy together.
                    </p>
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-[#1d9e75] hover:bg-[#085041] disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {creating ? 'Creating...' : 'Create Group Buy'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                By creating a group buy, you agree to our Terms of Service
              </p>
            </form>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">How Group Buys Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-[#1d9e75] mb-2">1</div>
              <p className="font-semibold text-gray-900 mb-1">Create & Share</p>
              <p className="text-sm text-gray-600">
                Create a group buy and share the link with friends on WhatsApp
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-[#1d9e75] mb-2">2</div>
              <p className="font-semibold text-gray-900 mb-1">Invite & Join</p>
              <p className="text-sm text-gray-600">
                Friends join the group to add their items and increase bulk quantity
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-[#1d9e75] mb-2">3</div>
              <p className="font-semibold text-gray-900 mb-1">Save Together</p>
              <p className="text-sm text-gray-600">
                Hit thresholds and unlock bulk discounts for everyone in the group
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
