import { Link } from 'react-router-dom';
import { Headphones, Heart, Laptop, Monitor, Mouse, Scale, ShoppingCart, Smartphone, Star } from 'lucide-react';
import { api } from '../lib/api';
import { inr } from '../lib/format';
import { useApp } from '../store';

const icons: Record<string, any> = { laptops: Laptop, phones: Smartphone, audio: Headphones, monitors: Monitor, accessories: Mouse };
export const CategoryIcon = ({ category, className = 'h-8 w-8' }: { category: string; className?: string }) => {
  const I = icons[category] || Laptop;
  return <I className={className} />;
};

export function ProductCard({ p, children }: { p: any; children?: React.ReactNode }) {
  const { toast, refresh, compare, toggleCompare } = useApp();
  const add = async () => {
    try { const r = await api('/cart/items', { method: 'POST', body: { productId: p.id, quantity: 1 } }); toast(r.message); refresh(); }
    catch (e: any) { toast(e.message, 'bad'); }
  };
  const wish = async () => {
    try { await api(`/wishlist/${p.id}`, { method: 'POST', body: {} }); toast('Saved to your wishlist'); }
    catch (e: any) { toast(e.message, 'bad'); }
  };
  const off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  return (
    <article className="card flex flex-col overflow-hidden">
      <Link to={`/product/${p.id}`} className="flex h-32 items-center justify-center bg-gradient-to-br from-navy-900 to-navy-700 text-white/90" aria-label={p.name}>
        <CategoryIcon category={p.category} className="h-10 w-10" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-xs text-muted">{p.brand}</div>
        <Link to={`/product/${p.id}`} className="font-display font-semibold leading-snug hover:text-brand">{p.name}</Link>
        <div className="flex items-center gap-2 text-xs text-muted"><Star className="h-3.5 w-3.5 fill-warn text-warn" />{p.rating} ({p.reviews.toLocaleString('en-IN')})</div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg font-semibold">{inr(p.price)}</span>
          {off > 0 && <><span className="text-xs text-muted line-through">{inr(p.mrp)}</span><span className="text-xs font-semibold text-ok">{off}% off</span></>}
        </div>
        {children}
        <div className="mt-auto flex gap-2 pt-2">
          <button className="btn-primary btn-sm flex-1" onClick={add}><ShoppingCart className="h-3.5 w-3.5" />Add to cart</button>
          <button className="btn-ghost btn-sm" onClick={wish} aria-label="Save to wishlist"><Heart className="h-3.5 w-3.5" /></button>
          <button className={`btn-sm ${compare.includes(p.id) ? 'btn bg-brand text-white' : 'btn-ghost'}`} onClick={() => toggleCompare(p.id)} aria-pressed={compare.includes(p.id)} aria-label="Toggle compare"><Scale className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </article>
  );
}
