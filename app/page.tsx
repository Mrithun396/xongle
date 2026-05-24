'use client';

import Link from 'next/link';
import { Menu, X, Users, Zap, TrendingUp, Smartphone, Lock, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#1d9e75] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">X</span>
                </div>
                <span className="font-bold text-xl text-gray-900">Xongle</span>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-[#1d9e75] transition-colors"
              >
                How it Works
              </a>
              <a
                href="#roles"
                className="text-gray-600 hover:text-[#1d9e75] transition-colors"
              >
                Roles
              </a>
              <a
                href="#stats"
                className="text-gray-600 hover:text-[#1d9e75] transition-colors"
              >
                Impact
              </a>
              <Link href="/login" className="px-6 py-2 bg-[#1d9e75] text-white rounded-lg hover:bg-[#085041] transition-colors">
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-100">
              <a
                href="#how-it-works"
                className="block py-2 text-gray-600 hover:text-[#1d9e75]"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it Works
              </a>
              <a
                href="#roles"
                className="block py-2 text-gray-600 hover:text-[#1d9e75]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Roles
              </a>
              <a
                href="#stats"
                className="block py-2 text-gray-600 hover:text-[#1d9e75]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Impact
              </a>
              <Link href="/login" className="block w-full mt-4 px-6 py-2 bg-[#1d9e75] text-white rounded-lg hover:bg-[#085041] transition-colors text-center">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 sm:py-20 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Buy together.{' '}
            <span className="text-[#1d9e75]">Save together.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Group buying made simple. Shop with friends and family, unlock discounts, and share via WhatsApp. 
            No minimum orders. No membership fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/login" className="px-8 py-3 bg-[#1d9e75] text-white rounded-lg hover:bg-[#085041] transition-colors font-semibold flex items-center justify-center gap-2">
              Start Buying Now <ArrowRight size={20} />
            </Link>
            <button className="px-8 py-3 border-2 border-gray-300 text-gray-900 rounded-lg hover:border-[#1d9e75] hover:text-[#1d9e75] transition-colors font-semibold">
              Learn More
            </button>
          </div>

          {/* Hero Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-[#1d9e75] mb-2">0%</div>
              <p className="text-gray-600 text-sm">Listing Fee</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-[#1d9e75] mb-2">30%</div>
              <p className="text-gray-600 text-sm">Avg Discount</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-[#1d9e75] mb-2">WhatsApp</div>
              <p className="text-gray-600 text-sm">Easy Sharing</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            5 simple steps to start saving with your community
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-[#1d9e75] text-white rounded-full flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Browse Products</h3>
                <p className="text-gray-600 text-sm">
                  Explore products from sellers in your community.
                </p>
              </div>
              {/* Connector */}
              <div className="hidden md:block absolute top-16 -right-3 w-6 h-1 bg-gray-300"></div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-[#1d9e75] text-white rounded-full flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Create a Group</h3>
                <p className="text-gray-600 text-sm">
                  Invite friends and family to shop together.
                </p>
              </div>
              <div className="hidden md:block absolute top-16 -right-3 w-6 h-1 bg-gray-300"></div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-[#1d9e75] text-white rounded-full flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Add Items</h3>
                <p className="text-gray-600 text-sm">
                  Members add items to reach bulk discounts.
                </p>
              </div>
              <div className="hidden md:block absolute top-16 -right-3 w-6 h-1 bg-gray-300"></div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-[#1d9e75] text-white rounded-full flex items-center justify-center font-bold mb-4">
                  4
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Unlock Discounts</h3>
                <p className="text-gray-600 text-sm">
                  Hit thresholds and unlock group discounts.
                </p>
              </div>
              <div className="hidden md:block absolute top-16 -right-3 w-6 h-1 bg-gray-300"></div>
            </div>

            {/* Step 5 */}
            <div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-[#1d9e75] text-white rounded-full flex items-center justify-center font-bold mb-4">
                  5
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Order & Save</h3>
                <p className="text-gray-600 text-sm">
                  Complete purchase and enjoy your savings!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section id="roles" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
            Who Can Join?
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Different roles for different needs in our community
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Buyer */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-[#1d9e75] transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Buyer</h3>
              <p className="text-gray-600 text-sm mb-4">
                Join groups and enjoy bulk discounts on products you need.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#1d9e75] font-bold">✓</span>
                  <span>Browse and add items</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1d9e75] font-bold">✓</span>
                  <span>Unlock group discounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1d9e75] font-bold">✓</span>
                  <span>Pay when threshold hit</span>
                </li>
              </ul>
            </div>

            {/* Seller */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-[#1d9e75] transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Seller</h3>
              <p className="text-gray-600 text-sm mb-4">
                List your products, reach bulk buyers, and increase sales.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#1d9e75] font-bold">✓</span>
                  <span>Zero listing fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1d9e75] font-bold">✓</span>
                  <span>Direct buyer access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1d9e75] font-bold">✓</span>
                  <span>Volume sales</span>
                </li>
              </ul>
            </div>

            {/* Reseller */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-[#1d9e75] transition-colors">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-purple-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Reseller</h3>
              <p className="text-gray-600 text-sm mb-4">
                Organize groups, earn commissions, build your business.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#1d9e75] font-bold">✓</span>
                  <span>Commission on sales</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1d9e75] font-bold">✓</span>
                  <span>Group management tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1d9e75] font-bold">✓</span>
                  <span>Performance dashboard</span>
                </li>
              </ul>
            </div>

            {/* Admin */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-[#1d9e75] transition-colors">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Lock className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Admin</h3>
              <p className="text-gray-600 text-sm mb-4">
                Manage platform, ensure trust, drive growth ecosystem.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#1d9e75] font-bold">✓</span>
                  <span>Platform moderation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1d9e75] font-bold">✓</span>
                  <span>Analytics & reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1d9e75] font-bold">✓</span>
                  <span>Revenue streams</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#085041]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
            The Xongle Impact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stat 1: Listing Fee */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-md"></div>
                  <div className="relative bg-white/20 w-20 h-20 rounded-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">₹</span>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">0</h3>
              <p className="text-white/80">Listing Fee for Sellers</p>
            </div>

            {/* Stat 2: Average Discount */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-md"></div>
                  <div className="relative bg-white/20 w-20 h-20 rounded-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">%</span>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">30</h3>
              <p className="text-white/80">Average Discount</p>
            </div>

            {/* Stat 3: Revenue Streams */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-md"></div>
                  <div className="relative bg-white/20 w-20 h-20 rounded-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">3</span>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Revenue Streams</h3>
              <p className="text-white/80">Seller fees, Reseller commissions, Ads</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-[#1d9e75] to-[#085041] rounded-2xl p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Save Together?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of buyers, sellers, and resellers already saving on Xongle. 
            Start your group buying journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-white text-[#1d9e75] rounded-lg hover:bg-gray-100 transition-colors font-semibold">
              Download App
            </button>
            <button className="px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors font-semibold">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#1d9e75] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">X</span>
                </div>
                <span className="font-bold text-lg text-white">Xongle</span>
              </div>
              <p className="text-sm text-gray-400">
                Buy together. Save together.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-400 mb-4 sm:mb-0">
              © 2026 Xongle. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Twitter
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                LinkedIn
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
