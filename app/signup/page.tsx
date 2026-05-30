'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { Mail, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required.');
      return false;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email.');
      return false;
    }

    if (!phone.trim()) {
      setError('Phone number is required.');
      return false;
    }

    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const redirectUrl = `${window.location.origin}/auth/callback?redirect=/products`;

      const { error: signUpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim(),
            phone_number: phone.trim(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccess('Check your inbox for a magic link to complete signup.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send signup link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1d9e75]">
                <span className="font-bold text-white">X</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Xongle</span>
            </Link>
            <div className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#1d9e75] hover:text-[#085041]">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center px-4 py-12 sm:py-16 lg:py-20">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-bold text-gray-900">Join Xongle</h1>
              <p className="text-gray-600">Create an account with email magic link and start group buying.</p>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-[#1d9e75] focus:outline-none"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-[#1d9e75] focus:outline-none"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit phone number"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-[#1d9e75] focus:outline-none"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1d9e75] px-4 py-2.5 font-bold text-white transition hover:bg-[#085041] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Sending link...' : 'Create account'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200"></div>
              <span className="text-sm text-gray-500">or</span>
              <div className="h-px flex-1 bg-gray-200"></div>
            </div>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#1d9e75] hover:text-[#085041]">
                Use email magic link
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
