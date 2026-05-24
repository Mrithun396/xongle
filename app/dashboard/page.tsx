'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { LogOut, User, Phone } from 'lucide-react';

interface UserProfile {
  id: string;
  phone: string;
  email?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push('/login');
        return;
      }

      setUser({
        id: data.session.user.id,
        phone: data.session.user.phone || 'N/A',
        email: data.session.user.email,
      });
      setLoading(false);
    };

    loadUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push('/login');
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1d9e75] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-green-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-[#1d9e75] hover:bg-[#085041] text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

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
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-[#1d9e75] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Welcome Card */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Xongle! 👋</h1>
            <p className="text-gray-600 mb-6">
              You're now logged in and ready to start buying together with your friends and family.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="text-2xl font-bold text-[#1d9e75] mb-1">0</div>
                <p className="text-sm text-gray-600">Active Groups</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="text-2xl font-bold text-[#1d9e75] mb-1">0</div>
                <p className="text-sm text-gray-600">Pending Orders</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="text-2xl font-bold text-[#1d9e75] mb-1">₹0</div>
                <p className="text-sm text-gray-600">Total Savings</p>
              </div>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-green-100 rounded-full">
                <User className="w-8 h-8 text-[#1d9e75]" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-6">Your Profile</h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-[#1d9e75]" />
                  <p className="font-semibold text-gray-900">{user?.phone}</p>
                </div>
              </div>

              {user?.email && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="font-semibold text-gray-900 mt-1 break-all">{user.email}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">User ID</p>
                <p className="font-mono text-xs text-gray-900 mt-1 break-all">{user?.id}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-6 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left">
              <h3 className="font-semibold text-gray-900 mb-1">📱 Create a Group</h3>
              <p className="text-sm text-gray-600">Start a group and invite friends to buy together</p>
            </button>
            <button className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left">
              <h3 className="font-semibold text-gray-900 mb-1">🛒 Browse Products</h3>
              <p className="text-sm text-gray-600">Explore items available for group buying</p>
            </button>
            <button className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left">
              <h3 className="font-semibold text-gray-900 mb-1">👥 Join a Group</h3>
              <p className="text-sm text-gray-600">Join existing groups via WhatsApp link</p>
            </button>
            <button className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left">
              <h3 className="font-semibold text-gray-900 mb-1">⚙️ Settings</h3>
              <p className="text-sm text-gray-600">Manage your profile and preferences</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
