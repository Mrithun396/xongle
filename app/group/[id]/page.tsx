'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { createClient } from '@/app/lib/supabase';
import { Users, Check, Share2, Clock } from 'lucide-react';

interface GroupBuy {
  id: string;
  product_id: string;
  creator_id: string;
  status: string;
  member_count: number;
  expires_at: string | null;
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
  id: string;
  user_id: string;
  joined_at: string;
  is_ready: boolean;
}

export default function GroupBuyPage() {
  const router = useRouter();
  const params = useParams();
  const [groupBuy, setGroupBuy] = useState<GroupBuy | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [joining, setJoining] = useState(false);
  const [placingOrders, setPlacingOrders] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

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
          .select('*')
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

  // Countdown timer
  useEffect(() => {
    if (!groupBuy) return;

    const updateTimer = () => {
      if (!groupBuy.expires_at) {
        setTimeLeft('Permanent');
        return;
      }

      const expiresAt = new Date(groupBuy.expires_at).getTime();
      const now = Date.now();
      const difference = expiresAt - now;

      if (difference <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeft(`${minutes}m left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [groupBuy]);

  const handleJoinGroup = async () => {
    if (!user) return;

    try {
      setJoining(true);
      setError('');

      const { error } = await supabase.from('group_members').insert([
        {
          group_buy_id: groupBuyId,
          user_id: user.id,
          is_ready: false,
        },
      ]);

      if (error && error.code !== '23505') {
        throw error;
      }

      setJoined(true);

      // Refresh member list and count
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_buy_id', groupBuyId);

      if (membersError) throw membersError;

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
    } finally {
      setJoining(false);
    }
  };

  const handleReadyToOrder = async () => {
    if (!user || !groupBuy || !product) return;

    try {
      setPlacingOrders(true);
      setError('');
      setStatusMessage('');

      const { error: readyError } = await supabase
        .from('group_members')
        .update({ is_ready: true })
        .eq('group_buy_id', groupBuyId)
        .eq('user_id', user.id);

      if (readyError) throw readyError;

      const { data: refreshedMembers, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_buy_id', groupBuyId);

      if (membersError) throw membersError;

      const membersList = refreshedMembers || [];
      setMembers(membersList);

      const readyCount = membersList.filter((member) => member.is_ready).length;
      const allReady = membersList.length > 0 && readyCount === membersList.length;

      if (allReady) {
        const { data: existingOrders, error: existingOrdersError } = await supabase
          .from('orders')
          .select('user_id')
          .eq('group_buy_id', groupBuyId);

        if (existingOrdersError) throw existingOrdersError;

        const existingUserIds = new Set((existingOrders || []).map((order) => order.user_id));

        const orderRows = membersList
          .filter((member) => !existingUserIds.has(member.user_id))
          .map((member) => ({
            user_id: member.user_id,
            product_id: product.id,
            group_buy_id: groupBuyId,
            amount: product.price * (1 - product.discount_percent / 100),
            status: 'pending',
          }));

        if (orderRows.length > 0) {
          const { error: orderInsertError } = await supabase.from('orders').insert(orderRows);
          if (orderInsertError) throw orderInsertError;
        }

        const { error: updateGroupError } = await supabase
          .from('group_buys')
          .update({ status: 'completed' })
          .eq('id', groupBuyId);

        if (updateGroupError) throw updateGroupError;

        setStatusMessage('🎉 All members ready! Order is being placed...');
      } else {
        setStatusMessage('Your ready status is saved. Waiting for the rest of the group.');
      }
    } catch (err) {
      console.error('Error updating ready status:', err);
      setError('Failed to update ready status. Please try again.');
    } finally {
      setPlacingOrders(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!product) return;

    const discountedPrice = product.price * (1 - product.discount_percent / 100);
    const savings = ((product.price - discountedPrice) / product.price * 100).toFixed(0);
    const groupUrl = `${window.location.origin}/group/${groupBuyId}`;
    const text = `🎉 Join my group buy on Xongle and save ${savings}%!\n\n📦 ${product.name}\n💰 ₹${discountedPrice.toFixed(2)} (was ₹${product.price.toFixed(2)})\n👥 ${members.length} people already joined\n\n🔗 ${groupUrl}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
        <Navbar showSearch={false} />
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
        <Navbar showSearch={false} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">{error || 'Group buy not found'}</p>
            <button
              onClick={() => router.push('/products')}
              className="px-6 py-2 bg-[#1d9e75] text-white rounded-lg hover:bg-[#085041]"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const discountedPrice = product.price * (1 - product.discount_percent / 100);
  const savings = product.price - discountedPrice;
  const readyCount = members.filter((member) => member.is_ready).length;
  const allReady = members.length > 0 && readyCount === members.length;
  const maxMembers = 50; // Visual max for progress bar
  const progressPercent = Math.min((members.length / maxMembers) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
      <Navbar showSearch={false} />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Product Image & Details */}
          <div className="lg:col-span-2">
            {/* Product Image */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden mb-6">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-300 text-6xl">📦</div>
                )}
              </div>

              {/* Product Info */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="inline-block bg-[#1d9e75] text-white px-3 py-1 rounded-full text-xs font-semibold mb-3">
                      {product.category}
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {product.name}
                    </h1>
                  </div>
                  {product.discount_percent > 0 && (
                    <div className="text-right">
                      <div className="text-3xl font-bold text-red-500">
                        {product.discount_percent}% OFF
                      </div>
                    </div>
                  )}
                </div>

                {product.description && (
                  <p className="text-gray-600 mb-4">{product.description}</p>
                )}
              </div>

              {/* Pricing */}
              <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl mb-6">
                <p className="text-gray-600 text-sm mb-2">Group Buy Price</p>
                <div className="flex items-end gap-4 mb-4">
                  <div className="text-4xl font-bold text-[#1d9e75]">
                    ₹{discountedPrice.toFixed(2)}
                  </div>
                  <div className="text-xl text-gray-500 line-through mb-1">
                    ₹{product.price.toFixed(2)}
                  </div>
                </div>
                <p className="text-green-700 font-semibold">
                  Save ₹{savings.toFixed(2)} per item! 💰
                </p>
              </div>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {members.length} Members Joined
              </h2>

              {members.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {members.slice(0, 12).map((member, idx) => (
                    <div
                      key={member.id}
                      className="flex flex-col items-center text-center"
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2" style={{ backgroundColor: member.is_ready ? '#1d9e75' : '#d1d5db' }}>
                        {member.is_ready ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        Member {idx + 1} • {member.is_ready ? 'Ready' : 'Not ready'}
                      </p>
                    </div>
                  ))}
                  {members.length > 12 && (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold">
                        +{members.length - 12}
                      </div>
                      <p className="text-xs text-gray-600">More</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No members yet. Be the first to join!</p>
              )}
            </div>
          </div>

          {/* Right: Action Panel */}
          <div className="lg:col-span-1">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 space-y-6">
              {/* Countdown */}
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-gray-600 text-sm mb-1">Group Expires In</p>
                <p className="text-2xl font-bold text-[#1d9e75]">{timeLeft}</p>
              </div>

              {/* Progress Bar */}
              <div>
                <p className="text-gray-700 font-semibold mb-2">
                  {members.length} {members.length === 1 ? 'person' : 'people'} joined
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#1d9e75] to-[#2ecc71] transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {Math.round(progressPercent)}% of target reached
                </p>
              </div>

              {joined ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-green-50 p-4">
                    <p className="text-sm text-gray-600">Ready status</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-lg font-semibold text-gray-900">
                        {readyCount}/{members.length} ready
                      </p>
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${allReady ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {allReady ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        {allReady ? 'All members ready' : 'Waiting for members'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleReadyToOrder}
                    disabled={placingOrders || allReady}
                    className={`w-full rounded-xl py-4 text-lg font-bold transition ${allReady ? 'bg-green-100 text-green-700 border border-green-300 cursor-default' : 'bg-[#1d9e75] hover:bg-[#085041] text-white disabled:opacity-50'}`}
                  >
                    {allReady ? '✓ You’re Ready!' : placingOrders ? 'Saving...' : "I'm Ready to Order!"}
                  </button>

                  {statusMessage && (
                    <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                      {statusMessage}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleJoinGroup}
                  disabled={joining}
                  className="w-full bg-[#1d9e75] hover:bg-[#085041] disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors text-lg"
                >
                  {joining ? 'Joining...' : 'Join This Group'}
                </button>
              )}

              {/* WhatsApp Share Button - PROMINENT */}
              <button
                onClick={handleWhatsAppShare}
                className="w-full bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Share2 className="w-5 h-5" />
                Share on WhatsApp
              </button>

              {/* Info Box */}
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <p className="text-sm text-gray-700">
                  <span className="font-bold text-[#1d9e75]">Invite friends</span> to unlock more discounts! The more people join, the better the deal.
                </p>
              </div>

              {/* Viral Mechanic Info */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#1d9e75] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Share the link
                    </p>
                    <p className="text-xs text-gray-500">
                      Send it to friends on WhatsApp
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#1d9e75] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      They join the group
                    </p>
                    <p className="text-xs text-gray-500">
                      More members = bigger discount
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#1d9e75] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Everyone saves! 🎉
                    </p>
                    <p className="text-xs text-gray-500">
                      Collectively unlock better prices
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
