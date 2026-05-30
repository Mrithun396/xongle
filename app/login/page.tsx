'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState('/products');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setRedirectTo(params.get('redirect') || '/products');
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push(redirectTo);
      }
    };

    checkSession();
  }, [router, redirectTo]);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Magic link sent! Open it from your inbox to sign in.');
      }
    } catch (err) {
      setError('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-green-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1d9e75]">
              <span className="text-xl font-bold text-white">X</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Xongle</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <Mail className="h-6 w-6 text-[#1d9e75]" />
            </div>
          </div>

          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Sign in with email</h1>
          <p className="mb-6 text-center text-gray-600">We’ll email you a secure magic link—no password needed.</p>

          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {message && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-600">{message}</div>}

          <form onSubmit={handleSendMagicLink} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#1d9e75] focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/20 disabled:bg-gray-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1d9e75] px-4 py-3 font-semibold text-white transition hover:bg-[#085041] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send magic link'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200"></div>
            <span className="text-xs text-gray-500">or</span>
            <div className="h-px flex-1 bg-gray-200"></div>
          </div>

          <p className="mb-4 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold text-[#1d9e75] hover:text-[#085041]">
              Sign up
            </Link>
          </p>

          <p className="text-center text-xs text-gray-500">By signing in, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
}

