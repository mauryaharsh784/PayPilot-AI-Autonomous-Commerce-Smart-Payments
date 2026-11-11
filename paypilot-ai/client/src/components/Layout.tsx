import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Bot, Info, CreditCard, Eye, Heart, LayoutDashboard, LogOut, Menu, Package, Scale, Search, Settings, Shield, ShoppingCart, TrendingDown, User, X } from 'lucide-react';
import { useApp } from '../store';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assistant', label: 'AI assistant', icon: Bot },
  { to: '/discover', label: 'Discover', icon: Search },
  { to: '/compare', label: 'Compare', icon: Scale },
  { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: 'cart' },
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/transactions', label: 'Transactions', icon: CreditCard },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/watch', label: 'Price watch', icon: TrendingDown },
  { to: '/notifications', label: 'Notifications', icon: Bell, badge: 'unread' },
  { to: '/profile', label: 'Profile & memory', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const { user, cartCount, unread, logout, refresh, toasts, compare } = useApp();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  useEffect(() => { setOpen(false); refresh(); }, [loc.pathname, refresh]);
  const items = user?.role === 'admin' ? [...nav, { to: '/admin', label: 'Admin', icon: Shield }] : nav;
  const counts: Record<string, number> = { cart: cartCount, unread };

  const side = (
    <nav className="flex h-full flex-col bg-navy-950 text-white/80" aria-label="Main">
      <div className="flex items-center gap-2 px-5 py-5 font-display text-lg font-semibold text-white">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand"><Bot className="h-4 w-4" /></span>PayPilot AI
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {items.map(({ to, label, icon: I, badge }: any) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>
            <I className="h-4 w-4" />{label}
            {to === '/compare' && compare.length > 0 && <span className="ml-auto rounded-full bg-white/15 px-2 text-xs">{compare.length}</span>}
            {badge && counts[badge] > 0 && <span className="ml-auto rounded-full bg-brand px-2 text-xs text-white">{counts[badge]}</span>}
          </NavLink>
        ))}
      </div>
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 truncate text-xs text-white/60">{user?.email}</div>
        <button className="flex w-full items-center gap-2 text-sm hover:text-white" onClick={async () => { await logout(); navigate('/'); }}><LogOut className="h-4 w-4" />Sign out</button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 lg:block">{side}</aside>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy-950 px-4 py-3 text-white lg:hidden">
        <span className="font-display font-semibold">PayPilot AI</span>
        <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64">{side}<button className="absolute right-3 top-4 text-white" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button></div>
        </div>
      )}
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8"><div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-2.5 text-xs text-amber-900" role="note">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span><b>Demo data.</b> The catalog is a seeded sample with fictional brands. Prices, specs and stock are not live market data. Payments use the PayPal <b>Sandbox</b>, so no real money moves.</span>
        </div>
        <Outlet /></div></main>
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${t.tone === 'ok' ? 'bg-navy-900' : 'bg-bad'}`}>{t.text}</div>)}
      </div>
    </div>
  );
}
