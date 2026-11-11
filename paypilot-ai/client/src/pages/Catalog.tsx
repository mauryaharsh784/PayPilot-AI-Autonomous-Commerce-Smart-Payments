import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Heart, Scale, ShoppingCart, Star, TrendingDown, X } from 'lucide-react';
import { api, useFetch } from '../lib/api';
import { date, inr } from '../lib/format';
import { Empty, ErrorState, PageHead, Spinner } from '../components/ui';
import { CategoryIcon, ProductCard } from '../components/ProductCard';
import { useApp } from '../store';

export function Discover() {
  const meta = useFetch<any>('/products/meta');
  const [f, setF] = useState({ q: '', category: '', brand: '', maxPrice: '', sort: 'relevance', page: 1 });
  const [qDraft, setQ] = useState('');
  const qs = new URLSearchParams(Object.entries({ ...f, limit: 12 }).filter(([, v]) => v !== '' && v !== 0).map(([k, v]) => [k, String(v)])).toString();
  const { data, loading, error, reload } = useFetch<any>(`/products?${qs}`);
  const { compare, clearCompare } = useApp();
  const navigate = useNavigate();
  useEffect(() => { const t = setTimeout(() => setF((p) => ({ ...p, q: qDraft, page: 1 })), 350); return () => clearTimeout(t); }, [qDraft]);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v, page: 1 }));
  return (
    <>
      <PageHead title="Discover products" sub="Browse the catalog, or ask the AI assistant to shortlist for you." />
      <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input className="input lg:col-span-2" placeholder="Search name, brand or use (gaming, camera…)" value={qDraft} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        <select className="input" value={f.category} onChange={(e) => set('category', e.target.value)} aria-label="Category"><option value="">All categories</option>{meta.data?.categories.map((c: string) => <option key={c} value={c}>{c}</option>)}</select>
        <select className="input" value={f.brand} onChange={(e) => set('brand', e.target.value)} aria-label="Brand"><option value="">All brands</option>{meta.data?.brands.map((c: string) => <option key={c}>{c}</option>)}</select>
        <select className="input" value={f.sort} onChange={(e) => set('sort', e.target.value)} aria-label="Sort"><option value="relevance">Top rated</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select>
        <input className="input" type="number" min={0} placeholder="Max price (₹)" value={f.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} aria-label="Maximum price" />
      </div>
      {loading ? <Spinner /> : error ? <ErrorState message={error} retry={reload} /> : !data.items.length ? <Empty title="No products match" hint="Loosen a filter or clear the search." /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{data.items.map((p: any) => <ProductCard key={p.id} p={p} />)}</div>
          {data.pages > 1 && <div className="mt-6 flex items-center justify-center gap-3 text-sm">
            <button className="btn-ghost btn-sm" disabled={f.page <= 1} onClick={() => setF((p) => ({ ...p, page: p.page - 1 }))}>Previous</button>
            <span>Page {data.page} of {data.pages}</span>
            <button className="btn-ghost btn-sm" disabled={f.page >= data.pages} onClick={() => setF((p) => ({ ...p, page: p.page + 1 }))}>Next</button></div>}
        </>
      )}
      {compare.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-navy-900 px-4 py-3 text-sm text-white shadow-xl">
          {compare.length} selected
          <button className="btn-brand btn-sm" disabled={compare.length < 2} onClick={() => navigate('/compare')}>Compare</button>
          <button aria-label="Clear selection" onClick={clearCompare}><X className="h-4 w-4" /></button>
        </div>
      )}
    </>
  );
}

export function ProductDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch<any>(`/products/${id}`);
  const { toast, refresh, toggleCompare, compare } = useApp();
  const [target, setTarget] = useState('');
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'Product not found'} retry={reload} />;
  const p = data.product;
  const act = async (fn: () => Promise<any>, ok: string) => { try { await fn(); toast(ok); refresh(); } catch (e: any) { toast(e.message, 'bad'); } };
  const watch = () => act(async () => {
    const r = await api(`/watches/${p.id}`, { method: 'PUT', body: { targetPrice: Number(target) } });
    if (r.alreadyBelowTarget) toast('The price is already at or below your target');
  }, 'Price watch saved');
  return (
    <>
      <Link to="/discover" className="mb-4 inline-block text-sm text-muted hover:text-ink">← Back to discover</Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 text-white lg:h-auto"><CategoryIcon category={p.category} className="h-20 w-20" /></div>
        <div>
          <div className="text-sm text-muted">{p.brand} · {p.category}</div>
          <h1 className="mt-1 text-3xl font-semibold">{p.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted"><Star className="h-4 w-4 fill-warn text-warn" />{p.rating} ({p.reviews.toLocaleString('en-IN')} reviews)</div>
          <div className="mt-4 flex items-baseline gap-3"><span className="font-display text-3xl font-semibold">{inr(p.price)}</span>{p.mrp > p.price && <span className="text-muted line-through">{inr(p.mrp)}</span>}</div>
          <p className="mt-1 text-xs text-muted">GST included. Free shipping above ₹1,000.</p>
          <p className="mt-4 text-sm leading-relaxed">{p.description}</p>
          <p className={`mt-3 text-sm font-semibold ${p.stock > 3 ? 'text-ok' : 'text-warn'}`}>{p.stock > 0 ? (p.stock > 3 ? 'In stock' : `Only ${p.stock} left`) : 'Out of stock'}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-primary" disabled={p.stock < 1} onClick={() => act(() => api('/cart/items', { body: { productId: p.id, quantity: 1 } }), 'Added to cart')}><ShoppingCart className="h-4 w-4" />Add to cart</button>
            <button className="btn-ghost" onClick={() => act(() => api(`/wishlist/${p.id}`, { body: {} }), 'Saved to wishlist')}><Heart className="h-4 w-4" />Wishlist</button>
            <button className="btn-ghost" onClick={() => { toggleCompare(p.id); }}><Scale className="h-4 w-4" />{compare.includes(p.id) ? 'Remove from compare' : 'Compare'}</button>
          </div>
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold">Specifications</h2>
          <dl className="mt-3 divide-y divide-line text-sm">{Object.entries(p.specs).map(([k, v]) => <div key={k} className="flex justify-between py-2"><dt className="capitalize text-muted">{k.replace(/_/g, ' ')}</dt><dd className="font-medium">{String(v)}</dd></div>)}</dl>
          <div className="mt-3 flex flex-wrap gap-1.5">{p.tags.map((t: string) => <span key={t} className="badge bg-brand-soft text-brand">{t}</span>)}</div>
        </section>
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-semibold"><TrendingDown className="h-4 w-4 text-brand" />Price history and watch</h2>
          {data.history.length > 1 ? (
            <div className="mt-3 h-44"><ResponsiveContainer><LineChart data={data.history.map((h: any) => ({ at: date(h.at), price: h.price }))}><CartesianGrid vertical={false} stroke="#E2E7F1" /><XAxis dataKey="at" hide /><YAxis domain={['auto', 'auto']} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} /><Tooltip formatter={(v: any) => inr(v)} /><Line type="stepAfter" dataKey="price" stroke="#5B5BF0" strokeWidth={2} dot /></LineChart></ResponsiveContainer></div>
          ) : <p className="mt-3 text-sm text-muted">No price changes recorded yet. Since {date(data.history[0]?.at)} the price has been {inr(data.history[0]?.price)}.</p>}
          <div className="mt-4 flex gap-2">
            <input className="input" type="number" min={1} placeholder="Alert me at or below (₹)" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Target price" />
            <button className="btn-brand" disabled={!target} onClick={watch}>Watch price</button>
          </div>
        </section>
      </div>
    </>
  );
}

export function CompareTable({ data }: { data: any }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[520px] text-left">
        <thead><tr className="border-b border-line"><th className="th" />{data.products.map((p: any) => <th key={p.id} className="th !text-ink"><Link to={`/product/${p.id}`} className="hover:text-brand">{p.name}</Link></th>)}</tr></thead>
        <tbody className="divide-y divide-line">
          {data.rows.map((r: any) => (
            <tr key={r.key}><td className="td text-muted">{r.label}</td>
              {data.products.map((p: any) => {
                const v = r.values[p.id];
                return <td key={p.id} className={`td ${r.bestId === p.id ? 'font-semibold text-ok' : r.worstId === p.id ? 'text-warn' : ''}`}>{v == null ? '–' : r.key === 'price' ? inr(v) : `${v}${r.unit && r.unit !== '/5' ? ' ' + r.unit : ''}`}</td>;
              })}</tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line px-4 py-2 text-xs text-muted">Green marks the best value in a row, amber the weakest.</p>
    </div>
  );
}

export function Compare() {
  const { compare, toggleCompare } = useApp();
  const ids = compare.join(',');
  const { data, loading, error, reload } = useFetch<any>(compare.length >= 2 ? `/compare?ids=${ids}` : null, [ids]);
  const { toast, refresh } = useApp();
  if (compare.length < 2) return <><PageHead title="Compare products" /><Empty title="Pick at least two products" hint="Use the compare button on any product card." action={<Link to="/discover" className="btn-primary">Go to discover</Link>} /></>;
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'Could not compare'} retry={reload} />;
  return (
    <>
      <PageHead title="Compare products" sub="Differences are computed from catalog data." />
      <CompareTable data={data} />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {data.products.map((p: any) => (
          <div key={p.id} className="card p-4 text-sm">
            <div className="font-semibold">{p.name}</div>
            {data.perProduct[p.id]?.pros.length > 0 && <p className="mt-2 text-ok">{data.perProduct[p.id].pros.join(' · ')}</p>}
            {data.perProduct[p.id]?.cons.length > 0 && <p className="mt-1 text-warn">{data.perProduct[p.id].cons.join(' · ')}</p>}
            <div className="mt-3 flex gap-2">
              <button className="btn-primary btn-sm" onClick={async () => { try { const r = await api('/cart/items', { body: { productId: p.id, quantity: 1 } }); toast(r.message); refresh(); } catch (e: any) { toast(e.message, 'bad'); } }}>Add to cart</button>
              <button className="btn-ghost btn-sm" onClick={() => toggleCompare(p.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
