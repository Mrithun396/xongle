'use client';

import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { Mail, Phone, Clock, MapPin, ArrowLeft } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Navbar showSearch={false} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#1d9e75]">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-gray-100 sm:p-12">
          <h1 className="text-4xl font-bold text-gray-950">Contact us</h1>
          <p className="mt-3 text-gray-600">
            Have a question, feedback, or need help with an order? We&rsquo;re here to help.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#F4FAF8] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d9e75] text-white">
                <Mail className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-bold text-gray-950">Email</p>
              <p className="mt-1 text-sm text-gray-600">hello@xongle.com</p>
              <p className="mt-0.5 text-xs text-gray-500">We reply within 24 hours</p>
            </div>

            <div className="rounded-2xl bg-[#F4FAF8] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d9e75] text-white">
                <Phone className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-bold text-gray-950">Phone</p>
              <p className="mt-1 text-sm text-gray-600">+91 80000 12345</p>
              <p className="mt-0.5 text-xs text-gray-500">Toll-free</p>
            </div>

            <div className="rounded-2xl bg-[#F4FAF8] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d9e75] text-white">
                <Clock className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-bold text-gray-950">Business hours</p>
              <p className="mt-1 text-sm text-gray-600">Monday &ndash; Saturday</p>
              <p className="mt-0.5 text-xs text-gray-500">9:00 AM &ndash; 7:00 PM IST</p>
            </div>

            <div className="rounded-2xl bg-[#F4FAF8] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d9e75] text-white">
                <MapPin className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-bold text-gray-950">Address</p>
              <p className="mt-1 text-sm text-gray-600">Xongle Technologies</p>
              <p className="mt-0.5 text-xs text-gray-500">Bengaluru, Karnataka, India</p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-[#E6E6E6] bg-white p-6">
            <h2 className="text-lg font-bold text-gray-950">Frequently asked questions</h2>
            <div className="mt-4 space-y-4 text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-900">How do group buys work?</p>
                <p className="mt-1">Start or join a group for a product, invite friends, and everyone saves more when more people join.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">What is the return policy?</p>
                <p className="mt-1">Most products are covered by a 30-day return policy. Contact us to initiate a return.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">How long does delivery take?</p>
                <p className="mt-1">Standard delivery takes 3&ndash;5 business days. Free delivery on orders above ₹499.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
