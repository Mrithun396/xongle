'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { Users, ArrowLeft, Check } from 'lucide-react';

interface GroupBuy {
  id: string;
  product_id: string;
  creator_id: string;
  status: string;
  member_count: number;
  expires_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  discount_percent: number;
  image_url: string | null;
}

interface GroupMember {
  user_id: string;
  joined_at: string;
}

export default function GroupBuyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [groupBuy, setGroupBuy] = useState<GroupBuy | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [user, setUser] = useState<any>(null);

  const groupBuyId = params.id as string;

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch group buy
        const { data: groupBuyData, error: gbError } = await supabase
          .from('group_buys')
          .select('*')
          .eq('id', groupBuyId)
          .single();

        if (gbError) throw gbError;
        setGroupBuy(groupBuyData);

        // Fetch product
        const { data: productData, error: pError } = await supabase
          .from('products')
          .select('*')
          .eq('id', groupBuyData.product_id)
          .single();

        if (pError) throw pError;
        setProduct(productData);

        // Fetch members
        const { data: membersData, error: mError } = await supabase
          .from('group_members')
          .select('user_id, joined_at')
          .eq('group_buy_id', groupBuyId);

        if (mError) throw mError;
        setMembers(membersData || []);

        // Check if user already joined
        if (user) {
          const isJoined = membersData?.some((m) => m.user_id === user.id);
          setJoined(!!isJoined);
        }
      } catch (err) {
        console.error('Error fetching group buy:', err);
        setError('Failed to load group buy details.');
      } finally {
        setLoading(false);
      }
    };

    if (user && groupBuyId) {
      fetchData();
    }
  }, [user, groupBuyId]);

  const handleJoinGroup = async () => {
    try {
      const { error } = await supabase.from('group_members').insert([
        {
          group_buy_id: groupBuyId,
          user_id: user.id,
        },
      ]);

      if (error && error.code !== '23505') {
        // 23505 is duplicate key error, which means already joined
        throw error;
      }

      setJoined(true);
      // Refresh member count
      const { data: membersData } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_buy_id', groupBuyId);

      setMembers(membersData || []);

      if (groupBuy) {
        setGroupBuy({
          ...groupBuy,
          member_count: membersData?.length || 0,
        });
      }
    } catch (err) {
      console.error('Error joining group:', err);
      setError('Failed to join group buy. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1d9e75] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading group buy...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !groupBuy || !product) {
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
            <p className="text-gray-600 text-lg">{error || 'Group buy not found'}</p>
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
  const expiresAt = new Date(groupBuy.expires_at);
  const daysLeft = Math.ceil(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

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
          {/* Product Image */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
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
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-4">
                <span className="inline-block bg-[#1d9e75] text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {product.category}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>

              {product.description && (
                <p className="text-gray-600 mb-4">{product.description}</p>
              )}

              {/* Pricing */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <p className="text-gray-600 text-sm mb-2">Price per item</p>
                <div className="flex items-end gap-3">
                  <div className="text-3xl font-bold text-[#1d9e75]">
                    ₹{discountedPrice.toFixed(2)}
                  </div>
                  {product.discount_percent > 0 && (
                    <>
                      <div className="text-lg text-gray-500 line-through">
                        ₹{product.price.toFixed(2)}
                      </div>
                      <div className="text-red-500 font-bold">
                        Save {product.discount_percent}%
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Group Status */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-[#1d9e75]" />
                  <span className="font-semibold text-gray-900">
                    {members.length} people already joined
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {daysLeft > 0
                    ? `Group expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
                    : 'Group has expired'}
                </p>
              </div>

              {/* Join Button */}
              {joined ? (
                <button disabled className="w-full bg-green-100 text-green-700 font-semibold py-3 rounded-lg flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  You've Joined This Group
                </button>
              ) : (
                <button
                  onClick={handleJoinGroup}
                  disabled={daysLeft <= 0}
                  className="w-full bg-[#1d9e75] hover:bg-[#085041] disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Join Group Buy Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Group Members</h2>
          <p className="text-gray-600 text-sm mb-4">
            {members.length} member{members.length !== 1 ? 's' : ''} have joined this group buy
          </p>
          <div className="space-y-2">
            {members.map((member, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-[#1d9e75] rounded-full flex items-center justify-center text-white font-semibold">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Member #{idx + 1}</p>
                  <p className="text-xs text-gray-500">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
