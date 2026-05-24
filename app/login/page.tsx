'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('OTP sent successfully! Check your email inbox or spam folder.');
        setStep('otp');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!otp || otp.length < 6) {
      setError('Please enter a valid OTP');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: 'email',
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1d9e75] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">X</span>
            </div>
            <span className="font-bold text-2xl text-gray-900">Xongle</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-green-100 rounded-full">
              {step === 'email' ? (
                <Mail className="w-6 h-6 text-[#1d9e75]" />
              ) : (
                <Lock className="w-6 h-6 text-[#1d9e75]" />
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {step === 'email' ? 'Enter Your Email' : 'Verify OTP'}
          </h1>
          <p className="text-center text-gray-600 mb-6">
            {step === 'email'
              ? 'We will send you a one-time password via email'
              : 'Enter the 6-digit code we sent to your email'}
          </p>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
              {message}
            </div>
          )}

          {/* Email Step */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d9e75] focus:border-transparent disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Make sure to check your spam folder if you don't see the email
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-[#1d9e75] hover:bg-[#085041] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Sending...' : 'Send OTP'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  One-Time Password
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={loading}
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d9e75] focus:border-transparent disabled:bg-gray-50 text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the 6-digit code sent to {email}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-[#1d9e75] hover:bg-[#085041] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError('');
                  setMessage('');
                }}
                className="w-full mt-3 text-[#1d9e75] hover:text-[#085041] font-semibold py-2 transition-colors"
              >
                Change Email
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-500">Secure & Private</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Footer */}
          <p className="text-xs text-center text-gray-500">
            By logging in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 mb-3">Powered by Supabase Auth</p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              🔒 Encrypted
            </span>
            <span className="flex items-center gap-1">
              ✓ Secure
            </span>
            <span className="flex items-center gap-1">
              📧 Email Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

