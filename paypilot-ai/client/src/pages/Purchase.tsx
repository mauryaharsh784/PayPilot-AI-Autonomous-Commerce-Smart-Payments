import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { AlertTriangle, Minus, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { api, useFetch } from '../lib/api';
import { inr, short } from '../lib/format';
import { Empty, ErrorState, PageHead, Spinner } from '../components/ui';
import { useApp } from '../store';

export function Cart() {
  const { data, loading, error, reload, setData } = useFetch<any>('/cart');
  const { toast, refresh } = useApp();
  const navigate = useNavigate();
  const [budget, setBudget] = useState('');
  useEffect(() => { if (data) setBudget(data.budget ? String(data.budget) : ''); }, [data?.budget]);
  const run = async (fn: () => Promise<any>) => { try { const r = await fn(); setData(r.cart || r); refresh(); } catch (e: any) { toast(e.message, 'bad'); } };
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'Could not load your cart'} retry={reload} />;
  if (!data.items.length) return <><PageHead title="Your cart" /><Empty title="Your cart is empty" hint="Add products yourself or ask the assistant to build a cart." action={<Link to="/assistant" className="btn-brand">Ask the assistant</Link>} /></>;
  return (
    <>
      <PageHead title="Your cart" sub={`${data.itemCount} item${data.itemCount > 1 ? 's' : ''}`} />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="card divide-y divide-line">
          {data.items.map((i: any) => (
            <div key={i.productId} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1"><Link to={`/product/${i.productId}`} className="font-semibold hover:text-brand">{i.name}</Link><div className="text-xs text-muted">{i.brand} · {inr(i.price)} each</div>
                {i.quantity > i.stock && <div className="mt-1 text-xs text-bad">Only {i.stock} in stock</div>}</div>
              <div className="flex items-center gap-2">
                <button className="btn-ghost btn-sm" aria-label="Decrease" onClick={() => run(() => api(`/cart/items/${i.productId}`, { method: 'PATCH', body: { quantity: i.quantity - 1 } }))}><Minus className="h-3 w-3" /></button>
                <span className="w-6 text-center text-sm font-semibold">{i.quantity}</span>
                <button className="btn-ghost btn-sm" aria-label="Increase" onClick={() => run(() => api(`/cart/items/${i.productId}`, { method: 'PATCH', body: { quantity: i.quantity + 1 } }))}><Plus className="h-3 w-3" /></button>
              </div>
              <div className="w-24 text-right font-semibold">{inr(i.lineTotal)}</div>
              <button className="text-muted hover:text-bad" aria-label={`Remove ${i.name}`} onClick={() => run(() => api(`/cart/items/${i.productId}`, { method: 'DELETE' }))}><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <aside className="card h-fit space-y-3 p-5 text-sm">
          <div className="flex justify-between"><span className="text-muted">Subtotal</span>{inr(data.subtotal)}</div>
          <div className="flex justify-between"><span className="text-muted">Shipping</span>{data.shipping ? inr(data.shipping) : 'Free'}</div>
          <div className="flex justify-between border-t border-line pt-3 font-display text-lg font-semibold"><span>Total</span>{inr(data.total)}</div>
          <div className="border-t border-line pt-3">
            <label className="label" htmlFor="b">Cart budget (optional)</label>
            <div className="flex gap-2"><input id="b" className="input" type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="₹" />
              <button className="btn-ghost" onClick={() => run(() => api('/cart/budget', { method: 'PUT', body: { budget: budget ? Number(budget) : null } }))}>Set</button></div>
            {data.budget && <p className={`mt-2 text-xs ${data.budgetRemaining < 0 ? 'text-bad' : 'text-muted'}`}>{data.budgetRemaining >= 0 ? `${inr(data.budgetRemaining)} left of ${inr(data.budget)}` : `${inr(-data.budgetRemaining)} over ${inr(data.budget)}`}</p>}
          </div>
          {data.warnings.map((w: string) => <p key={w} className="flex gap-2 text-xs text-warn"><AlertTriangle className="h-4 w-4 shrink-0" />{w}</p>)}
          <button className="btn-brand w-full" onClick={() => navigate('/checkout')}>Continue to checkout</button>
        </aside>
      </div>
    </>
  );
}

export function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useApp();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const cfg = useFetch<any>('/config');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; started.current = true;
    const id = params.get('order');
    (async () => {
      try {
        if (id) { const r = await api(`/orders/${id}`); if (r.order.status === 'awaiting_approval' || r.order.status === 'awaiting_payment') return setOrder(r.order); }
        setOrder((await api('/checkout/prepare', { body: {} })).order);
      } catch (e: any) { setError(e.message); }
    })();
  }, [params]);

  const approve = async () => {
    setBusy(true);
    try { await api(`/orders/${order._id}/approve`, { body: { confirm: true } }); navigate(`/pay/${order._id}`); }
    catch (e: any) {
      if (e.code === 'PRICE_CHANGED' && e.data?.order) { setOrder(e.data.order); setAgree(false); }
      toast(e.message, 'bad'); setError(e.code === 'PRICE_CHANGED' ? '' : e.message);
    } finally { setBusy(false); }
  };
  if (error && !order) return <ErrorState message={error} retry={() => navigate('/cart')} />;
  if (!order) return <Spinner label="Validating your cart" />;
  return (
    <>
      <PageHead title="Review and approve" sub="Check the order. Nothing is charged until you approve and complete PayPal." />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card divide-y divide-line">
          {order.items.map((i: any) => <div key={i.productId} className="flex justify-between gap-4 p-4 text-sm"><span>{i.quantity} × {i.name}</span><span className="font-semibold">{inr(i.price * i.quantity)}</span></div>)}
        </div>
        <aside className="card h-fit space-y-3 p-5 text-sm">
          <div className="flex justify-between"><span className="text-muted">Subtotal</span>{inr(order.subtotal)}</div>
          <div className="flex justify-between"><span className="text-muted">Shipping</span>{order.shipping ? inr(order.shipping) : 'Free'}</div>
          <div className="flex justify-between border-t border-line pt-3 font-display text-lg font-semibold"><span>Total</span>{inr(order.total)}</div>
          <p className="rounded-xl bg-paper p-3 text-xs text-muted">PayPal will charge <b className="text-ink">{order.chargeAmount?.toFixed(2)} {order.chargeCurrency}</b> (fixed rate ₹{order.fxRate} per {order.chargeCurrency}). The server calculated this amount from live catalog prices.</p>
          {cfg.data && !cfg.data.paypalConfigured && <p className="text-xs text-bad">PayPal sandbox credentials are missing on the server, so payment cannot start.</p>}
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} />I approve this order and want to continue to PayPal.</label>
          {error && <p className="text-xs text-bad" role="alert">{error}</p>}
          <button className="btn-brand w-full" disabled={!agree || busy} onClick={approve}><ShieldCheck className="h-4 w-4" />Approve and continue</button>
          <Link to="/cart" className="block text-center text-xs text-muted hover:text-ink">Back to cart</Link>
        </aside>
      </div>
    </>
  );
}

export function Pay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, refresh } = useApp();
  const cfg = useFetch<any>('/config');
  const { data, loading, error, reload } = useFetch<any>(`/orders/${id}`);
  const [msg, setMsg] = useState('');
  if (loading || cfg.loading) return <Spinner />;
  if (error || !data || !cfg.data) return <ErrorState message={error || cfg.error || 'Could not load this order'} retry={reload} />;
  const o = data.order;
  if (o.status === 'paid') { navigate(`/orders/${o._id}`, { replace: true }); return null; }
  if (o.status !== 'awaiting_payment' || !o.paypalOrderId) return <ErrorState message="This order is not ready for payment. Approve it at checkout first." retry={() => navigate(`/checkout?order=${o._id}`)} />;
  const report = (event: 'cancelled' | 'error', message?: string) => api(`/orders/${o._id}/payment-event`, { body: { event, message } }).catch(() => undefined);
  return (
    <>
      <PageHead title="Pay with PayPal" sub={`Order #${short(o._id)} · ${inr(o.total)}`} />
      <div className="mx-auto max-w-md space-y-4">
        <div className="card p-5 text-sm"><div className="flex justify-between"><span className="text-muted">You will pay</span><span className="font-display text-lg font-semibold">{o.chargeAmount.toFixed(2)} {o.chargeCurrency}</span></div>
          <p className="mt-2 text-xs text-muted">Sandbox payment. Sign in with a PayPal sandbox buyer account. No card details touch this app.</p></div>
        {msg && <p className="rounded-xl border border-bad/30 bg-bad/5 p-3 text-sm text-bad" role="alert">{msg}</p>}
        <div className="card p-5">
          <PayPalScriptProvider options={{ clientId: cfg.data.paypalClientId, currency: o.chargeCurrency, intent: 'capture' }}>
            <PayPalButtons style={{ layout: 'vertical', shape: 'rect' }} forceReRender={[o.paypalOrderId]}
              createOrder={async () => o.paypalOrderId}
              onApprove={async (d) => {
                try {
                  await api(`/orders/${o._id}/capture`, { body: { paypalOrderId: d.orderID } });
                  refresh(); navigate(`/orders/${o._id}`, { state: { justPaid: true } });
                } catch (e: any) { setMsg(e.message); toast(e.message, 'bad'); reload(); }
              }}
              onCancel={() => { setMsg('Payment was cancelled. Your order is still open: you can try again.'); report('cancelled'); }}
              onError={(e: any) => { setMsg('PayPal reported a problem. You have not been charged by this app. Try again.'); report('error', String(e?.message || e)); }} />
          </PayPalScriptProvider>
        </div>
        <Link to="/cart" className="block text-center text-xs text-muted hover:text-ink">Cancel and return to cart</Link>
      </div>
    </>
  );
}
