import { Link } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Trash2 } from 'lucide-react';
import { api, useFetch } from '../lib/api';
import { date, inr } from '../lib/format';
import { Empty, ErrorState, PageHead, Spinner } from '../components/ui';
import { ProductCard } from '../components/ProductCard';
import { useApp } from '../store';

export function Wishlist() {
  const { data, loading, error, reload } = useFetch<any>('/wishlist');
  const { toast } = useApp();
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'Could not load your wishlist'} retry={reload} />;
  const remove = async (id: string) => { try { await api(`/wishlist/${id}`, { method: 'DELETE' }); reload(); } catch (e: any) { toast(e.message, 'bad'); } };
  return (
    <>
      <PageHead title="Wishlist" />
      {!data.items.length ? <Empty title="Nothing saved yet" hint="Tap the heart on any product to keep it here." action={<Link to="/discover" className="btn-primary">Browse products</Link>} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((p: any) => (
          <ProductCard key={p.id} p={p}><button className="text-left text-xs text-muted hover:text-bad" onClick={() => remove(p.id)}>Remove from wishlist</button></ProductCard>))}</div>
      )}
    </>
  );
}

export function PriceWatch() {
  const { data, loading, error, reload } = useFetch<any>('/watches');
  const { toast } = useApp();
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'Could not load price watches'} retry={reload} />;
  const remove = async (id: string) => { try { await api(`/watches/${id}`, { method: 'DELETE' }); reload(); } catch (e: any) { toast(e.message, 'bad'); } };
  return (
    <>
      <PageHead title="Price watch" sub="Alerts fire only when the catalog price really changes. No history is invented." />
      {!data.items.length ? <Empty title="No price watches" hint="Open a product and set a target price." action={<Link to="/discover" className="btn-primary">Find a product</Link>} /> : (
        <div className="space-y-4">{data.items.map((w: any) => {
          const hit = w.product.price <= w.targetPrice;
          return (
            <div key={w._id} className="card grid gap-4 p-5 md:grid-cols-[1.2fr_1fr]">
              <div>
                <Link to={`/product/${w.product.id}`} className="font-display font-semibold hover:text-brand">{w.product.name}</Link>
                <div className="mt-2 text-sm">Now <b>{inr(w.product.price)}</b> · target <b>{inr(w.targetPrice)}</b></div>
                <div className={`mt-1 text-sm font-semibold ${hit ? 'text-ok' : 'text-muted'}`}>{hit ? 'At or below your target' : `${inr(w.product.price - w.targetPrice)} above your target`}</div>
                <div className="mt-1 text-xs text-muted">{w.history.length > 1 ? `${w.history.length - 1} price change${w.history.length > 2 ? 's' : ''} recorded` : `Tracking since ${date(w.history[0]?.at)}`}</div>
                <button className="btn-danger btn-sm mt-3" onClick={() => remove(w.product.id)}><Trash2 className="h-3 w-3" />Stop watching</button>
              </div>
              {w.history.length > 1 && <div className="h-28"><ResponsiveContainer><LineChart data={w.history.map((h: any) => ({ at: date(h.at), price: h.price }))}><CartesianGrid vertical={false} stroke="#E2E7F1" /><XAxis dataKey="at" hide /><YAxis domain={['auto', 'auto']} hide /><Tooltip formatter={(v: any) => inr(v)} /><Line type="stepAfter" dataKey="price" stroke="#5B5BF0" strokeWidth={2} /></LineChart></ResponsiveContainer></div>}
            </div>);
        })}</div>
      )}
    </>
  );
}

export function Notifications() {
  const { data, loading, error, reload } = useFetch<any>('/notifications');
  const { refresh } = useApp();
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'Could not load notifications'} retry={reload} />;
  const readAll = async () => { await api('/notifications/read-all', { body: {} }); refresh(); reload(); };
  const open = async (n: any) => { if (!n.read) { await api(`/notifications/${n._id}/read`, { body: {} }); refresh(); } };
  return (
    <>
      <PageHead title="Notifications" right={data.items.some((n: any) => !n.read) ? <button className="btn-ghost btn-sm" onClick={readAll}>Mark all as read</button> : undefined} />
      {!data.items.length ? <Empty title="You're all caught up" hint="Payment confirmations and price alerts show up here." /> : (
        <ul className="card divide-y divide-line">{data.items.map((n: any) => {
          const body = <><div className="flex items-center gap-2 font-semibold">{!n.read && <span className="h-2 w-2 rounded-full bg-brand" aria-label="Unread" />}{n.title}</div><div className="text-sm text-muted">{n.body}</div><div className="mt-1 text-xs text-muted">{date(n.createdAt)}</div></>;
          return <li key={n._id} className="p-4">{n.link ? <Link to={n.link} onClick={() => open(n)} className="block hover:text-brand">{body}</Link> : <button className="block w-full text-left" onClick={() => open(n)}>{body}</button>}</li>;
        })}</ul>
      )}
    </>
  );
}
