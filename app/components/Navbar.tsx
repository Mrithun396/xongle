'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import { useCart } from '@/app/context/CartContext';
import {
  ChevronDown,
  Home as HomeIcon,
  LogOut,
  Menu,
  Search,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkle,
  User,
  X,
} from 'lucide-react';

const categories = [
  { label: 'Groceries', value: 'grocery', icon: ShoppingBag },
  { label: 'Electronics', value: 'electronics', icon: Smartphone },
  { label: 'Fashion', value: 'fashion', icon: Shirt },
  { label: 'Home', value: 'home', icon: HomeIcon },
  { label: 'Beauty', value: 'beauty', icon: Sparkle },
];

export default function Navbar({ showSearch = true, onSearch }: { showSearch?: boolean; onSearch?: (query: string) => void }) {
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ name: string | null; role: string | null }>({ name: null, role: null });
  const [loading, setLoading] = useState(true);
  const { cartCount } = useCart();

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const currentUser = data.session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          const { data: profileData } = await supabase
            .from('users')
            .select('name, role')
            .eq('id', currentUser.id)
            .single();

          setProfile({
            name: profileData?.name || currentUser.email?.split('@')[0] || null,
            role: profileData?.role || null,
          });
        }
      } catch (error) {
        console.error('Failed to load auth session in Navbar:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profileData } = await supabase
          .from('users')
          .select('name, role')
          .eq('id', currentUser.id)
          .single();

        setProfile({
          name: profileData?.name || currentUser.email?.split('@')[0] || null,
          role: profileData?.role || null,
        });
      } else {
        setProfile({ name: null, role: null });
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setSearchQuery(q);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile({ name: null, role: null });
    router.push('/');
  };

  const displayName = profile.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E6E6E6] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between gap-4 py-3">
          <Link href="/" className="flex flex-shrink-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1D9E75] text-sm font-black text-white">
              X
            </div>
            <div>
              <p className="text-base font-bold text-[#2D2D2D]">Xongle</p>
            </div>
          </Link>

          {showSearch && (
            <form onSubmit={handleSearch} className="hidden flex-1 items-center justify-center md:flex">
              <div className="flex w-full max-w-2xl items-center gap-2 rounded-full bg-[#F6F6F6] px-2 py-2 ring-1 ring-[#E2E2E2]">
                <Search className="ml-2 h-4 w-4 text-[#999999]" />
                <input
                  type="text"
                  placeholder="Search essentials, electronics, fashion..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent px-1 text-sm text-[#2D2D2D] outline-none placeholder:text-[#999999]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-full bg-[#1D9E75] px-4 py-2 text-xs font-bold text-white"
                >
                  Search
                </button>
              </div>
            </form>
          )}

          <div className="hidden items-center gap-2 md:flex">
            <Link href="/cart" className="relative rounded-full p-2 text-[#2D2D2D] transition hover:bg-[#F4FAF8] hover:text-[#1D9E75]">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6161] text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {!loading && (
              user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-full border border-[#D8E8E3] bg-[#F8FBFA] px-2.5 py-1.5 transition hover:border-[#1D9E75]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1D9E75] text-xs font-bold text-white">
                      {initials}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#2D2D2D]">{displayName}</p>
                      <p className="text-[10px] text-gray-500">Account</p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-full bg-[#FFF1F1] px-3 py-2 text-xs font-bold text-[#FF6161]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="rounded-full px-3 py-2 text-sm font-bold text-[#2D2D2D] transition hover:bg-[#F4FAF8] hover:text-[#1D9E75]">
                    Sign In
                  </Link>
                  <Link href="/signup" className="rounded-full bg-[#1D9E75] px-4 py-2 text-sm font-bold text-white shadow-sm shadow-[#1D9E75]/20 transition hover:bg-[#15845f]">
                    Sign Up
                  </Link>
                </div>
              )
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Link href="/cart" className="relative rounded-full p-2 text-[#2D2D2D]">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6161] text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="rounded-full p-2 text-[#2D2D2D]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="border-t border-[#F0F0F0] py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.value}
                  href={`/products?category=${category.value}`}
                  className="inline-flex min-w-max items-center gap-2 rounded-full bg-[#F8F8F8] px-3 py-2 text-xs font-bold text-[#4A4A4A] transition hover:bg-[#E8F6F0] hover:text-[#1D9E75]"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {category.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#F0F0F0] bg-white px-4 py-4 md:hidden">
          {showSearch && (
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-[#D8E8E3] bg-[#F8FBFA] px-4 py-2.5 pr-10 text-sm text-[#2D2D2D] outline-none"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          <div className="space-y-1">
            <Link href="/products" className="block rounded-xl px-3 py-2 text-sm font-semibold text-[#2D2D2D] hover:bg-[#F4FAF8] hover:text-[#1D9E75]" onClick={() => setMobileMenuOpen(false)}>
              Browse products
            </Link>
            <Link href="/cart" className="block rounded-xl px-3 py-2 text-sm font-semibold text-[#2D2D2D] hover:bg-[#F4FAF8] hover:text-[#1D9E75]" onClick={() => setMobileMenuOpen(false)}>
              Cart
            </Link>
            {!loading && user ? (
              <>
                <Link href="/dashboard" className="block rounded-xl px-3 py-2 text-sm font-semibold text-[#2D2D2D] hover:bg-[#F4FAF8] hover:text-[#1D9E75]" onClick={() => setMobileMenuOpen(false)}>
                  My account
                </Link>
                <button type="button" onClick={handleLogout} className="mt-1 w-full rounded-xl bg-[#FFF1F1] px-3 py-2 text-left text-sm font-bold text-[#FF6161]">
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link href="/login" className="rounded-xl border border-[#D8E8E3] px-3 py-2 text-center text-sm font-bold text-[#2D2D2D]" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link href="/signup" className="rounded-xl bg-[#1D9E75] px-3 py-2 text-center text-sm font-bold text-white" onClick={() => setMobileMenuOpen(false)}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
