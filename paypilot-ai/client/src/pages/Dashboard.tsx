import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Bot, CheckCircle2, Heart, Package, Receipt, ShoppingBag, ShoppingCart, Sparkles, TrendingDown, Wallet } from 'lucide-react';
import { useFetch } from '../lib/api';
import { date, inr, short } from '../lib/format';
import { Empty, ErrorState, PageHead, Spinner, Status } from '../components/ui';
import { CategoryIcon } from '../components/ProductCard';
import { useApp } from '../store';

const basisText: Record<string, string> = { preferences: 'Based on your saved preferences', activity: 'Based on your wishlist and purchases', top_rated: 'Top rated in the demo catalog. Save preferences to personalise this.' };
const activityIcon: Record<string, any> = { order: Package, ai: Bot, wishlist: Heart, watch: TrendingDown };

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch<any>('/dashboard');
  const user = useApp((s) => s.user);
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'Could not load the dashboard'} retry={reload} />;
  const s = data.stats, b = data.budget;
  const cards = [
    { label: 'Total orders', value: s.orders, icon: Package, to: '/orders' },
    { label: 'Items purchased', value: s.totalPurchases, icon: ShoppingBag, to: '/orders' },
    { label: 'Total spent', value: inr(s.spent), icon: Wallet, to: '/transactions' },
    { label: 'Successful transactions', value: s.successfulTransactions, icon: CheckCircle2, to: '/transactions' },
    { label: 'In your cart', value: `${s.cartItems} · ${inr(s.cartTotal)}`, icon: ShoppingCart, to: '/cart' },
  ];
  const budgetBase = b.cartBudget || b.preferredMaxBudget;
  const used = b.cartBudget ? Math.min(100, Math.round((b.cartTotal / b.cartBudget) * 100)) : 0;
  return (
    <>
      <PageHead title={`Hello, ${user?.name.split(' ')[0]}`} sub="Everything here is calculated from your own orders, transactions and activity." right={<Link to="/assistant" className="btn-brand"><Bot className="h-4 w-4" />Ask the AI assistant</Link>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(({ label, value, icon: I, to }) => (
          <Link key={label} to={to} className="card p-4 transition hover:border-brand/40">
            <I className="h-4 w-4 text-brand" /><div className="mt-3 text-xs text-muted">{label}</div><div className="mt-0.5 font-display font-semibold">{value}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="card p-5">
          <h2 className="font-semibold">Spending by month</h2>
          {data.spendByMonth.length ? (
            <div className="mt-4 h-60" role="img" aria-label="Bar chart of spending by month">
              <ResponsiveContainer><BarChart data={data.spendByMonth}><CartesianGrid vertical={false} stroke="#E2E7F1" /><XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} /><Tooltip formatter={(v: any) => inr(v)} /><Bar dataKey="total" fill="#5B5BF0" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
            </div>
          ) : <p className="mt-6 text-sm text-muted">The chart appears after your first verified payment.</p>}
        </section>
        <section className="card p-5">
          <h2 className="font-semibold">Budget overview</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Cart total</dt><dd className="font-semibold">{inr(b.cartTotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Cart budget</dt><dd className="font-semibold">{b.cartBudget ? inr(b.cartBudget) : 'Not set'}</dd></div>
            {b.cartBudget && <div className="flex justify-between"><dt className="text-muted">{b.cartRemaining! >= 0 ? 'Remaining' : 'Over budget by'}</dt><dd className={`font-semibold ${b.cartRemaining! < 0 ? 'text-bad' : 'text-ok'}`}>{inr(Math.abs(b.cartRemaining))}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted">Saved max budget</dt><dd className="font-semibold">{b.preferredMaxBudget ? inr(b.preferredMaxBudget) : 'Not set'}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Average paid order</dt><dd className="font-semibold">{b.averageOrderValue ? inr(b.averageOrderValue) : '–'}</dd></div>
          </dl>
          {b.cartBudget ? <div className="mt-4" role="img" aria-label={`${used}% of cart budget used`}><div className="h-2 overflow-hidden rounded-full bg-line"><div className={`h-full ${b.cartRemaining! < 0 ? 'bg-bad' : 'bg-brand'}`} style={{ width: `${used}%` }} /></div><div className="mt-1 text-xs text-muted">{used}% of your cart budget</div></div>
            : <p className="mt-4 text-xs text-muted">{budgetBase ? '' : 'Set a budget in your cart to see utilisation here.'}</p>}
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-2 flex items-end justify-between"><div><h2 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-brand" />Recommended for you</h2><p className="text-xs text-muted">{basisText[data.recommendations.basis]}</p></div><Link to="/discover" className="text-sm text-brand hover:underline">Browse all</Link></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.recommendations.items.map((p: any) => (
            <Link key={p.id} to={`/product/${p.id}`} className="card flex flex-col gap-2 p-4 transition hover:border-brand/40">
              <div className="flex items-center justify-between text-muted"><CategoryIcon category={p.category} className="h-5 w-5" /><span className="badge bg-paper text-muted">Demo data</span></div>
              <div className="font-medium">{p.name}</div>
              <div className="font-display font-semibold">{inr(p.price)}</div>
              <ul className="mt-auto space-y-0.5 text-xs text-muted">{p.reasons.slice(0, 2).map((r: string) => <li key={r}>• {r}</li>)}</ul>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold">Transaction analytics</h2>
          {data.transactionsByStatus.length ? (
            <div className="mt-4 h-48" role="img" aria-label="Bar chart of transactions by status">
              <ResponsiveContainer><BarChart data={data.transactionsByStatus}><CartesianGrid vertical={false} stroke="#E2E7F1" /><XAxis dataKey="status" tickLine={false} axisLine={false} fontSize={12} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} /><Tooltip /><Bar dataKey="count" fill="#0E9F6E" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
            </div>
          ) : <p className="mt-6 text-sm text-muted">No transactions yet. They appear after your first PayPal checkout.</p>}
          <Link to="/transactions" className="mt-3 inline-flex items-center gap-1 text-sm text-brand hover:underline"><Receipt className="h-3.5 w-3.5" />All transactions</Link>
        </section>
        <section className="card p-5">
          <h2 className="font-semibold">Shopping activity</h2>
          {data.activity.length ? (
            <ul className="mt-3 divide-y divide-line">
              {data.activity.map((a: any, i: number) => { const I = activityIcon[a.type] || Package; return (
                <li key={i}><Link to={a.link || '#'} className="flex items-start gap-3 py-2.5 text-sm hover:text-brand"><I className="mt-0.5 h-4 w-4 shrink-0 text-muted" /><span className="flex-1">{a.text}</span><span className="shrink-0 text-xs text-muted">{date(a.at)}</span></Link></li>); })}
            </ul>
          ) : <p className="mt-6 text-sm text-muted">Your searches, saves and orders will show up here.</p>}
        </section>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="font-semibold">Recent orders</h2>
        {data.recentOrders.length ? (
          <ul className="mt-3 divide-y divide-line">
            {data.recentOrders.map((o: any) => (
              <li key={o._id}><Link to={`/orders/${o._id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-brand">
                <span><span className="font-semibold">#{short(o._id)}</span><span className="block text-xs text-muted">{date(o.createdAt)}</span></span>
                <span className="flex items-center gap-3">{inr(o.total)}<Status s={o.status} /></span></Link></li>
            ))}
          </ul>
        ) : <div className="mt-4"><Empty title="No orders yet" hint="Ask the assistant to find something and it will build your first cart." /></div>}
      </section>
    </>
  );
}
