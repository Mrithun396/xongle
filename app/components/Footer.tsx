import Link from 'next/link';

const footerLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#E6E6E6] bg-[#0B2C24] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-start">
          <div>
            <p className="text-xl font-bold text-white">Xongle</p>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Premium community buying for everyday essentials, fashion, home, and lifestyle products with smart savings for every group.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/70">
              <span className="rounded-full bg-white/10 px-3 py-1">Trusted shipping</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Group savings</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Secure checkout</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-bold text-white">Explore</p>
              <div className="mt-3 space-y-2 text-sm text-white/70">
                {footerLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="block transition hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-white">Support</p>
              <div className="mt-3 space-y-2 text-sm text-white/70">
                <p>Email: hello@xongle.com</p>
                <p>Phone: +91 80000 12345</p>
                <p>Mon to Sat • 9AM to 7PM</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/60">
          © 2026 Xongle. Designed for smarter shared shopping.
        </div>
      </div>
    </footer>
  );
}
