import { Link, useLocation, useParams } from 'react-router-dom';
import { api, useFetch } from '../lib/api';
import { date, inr, short } from '../lib/format';
import { Empty, ErrorState, PageHead, Spinner, Status, Success } from '../components/ui';
import { useApp } from '../store';

export function Orders() {
  const { data, loading, error, reload } = useFetch<any>('/orders');
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'Could not load orders'} retry={reload} />;
  return (
    <>
      <PageHead title="Order history" />
      {!data.items.length ? <Empty title="No orders yet" hint="Orders appear here once you start a checkout." action={<Link to="/assistant" className="btn-brand">Ask the assistant</Link>} /> : (
        <div className="card overflow-x-auto"><table className="w-full min-w-[560px]"><thead><tr className="border-b border-line"><th className="th">Order</th><th className="th">Placed</th><th className="th">Items</th><th className="th">Total</th><th className="th">Status</th></tr></thead>
          <tbody className="divide-y divide-line">{data.items.map((o: any) => (
            <tr key={o._id} className="hover:bg-paper"><td className="td font-semibold"><Link className="text-brand" to={`/orders/${o._id}`}>#{short(o._id)}</Link></td><td className="td">{date(o.createdAt)}</td><td className="td">{o.items.reduce((s: number, i: any) => s + i.quantity, 0)}</td><td className="td">{inr(o.total)}</td><td className="td"><Status s={o.status} /></td></tr>))}</tbody></table></div>
      )}
    </>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const { state } = useLocation() as any;
  const { data, loading, error, reload } = useFetch<any>(`/orders/${id}`);
  const { toast, refresh } = useApp();
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'Order not found'} retry={reload} />;
  const o = data.order;
  const cancel = async () => { try { await api(`/orders/${o._id}/cancel`, { body: {} }); toast('Order cancelled'); refresh(); reload(); } catch (e: any) { toast(e.message, 'bad'); } };
  return (
    <>
      <Link to="/orders" className="mb-4 inline-block text-sm text-muted hover:text-ink">← All orders</Link>
      <PageHead title={`Order #${short(o._id)}`} sub={`Created ${date(o.createdAt)}`} right={<Status s={o.status} />} />
      {state?.justPaid && o.status === 'paid' && <div className="mb-4"><Success><b>Payment confirmed.</b> PayPal captured it and the server verified the amount against your order.</Success></div>}
      {o.status === 'awaiting_payment' && <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-warn/30 bg-warn/5 p-4 text-sm">Payment has not been completed. <Link to={`/pay/${o._id}`} className="btn-brand btn-sm">Resume payment</Link><button className="btn-danger btn-sm" onClick={cancel}>Cancel order</button></div>}
      {o.status === 'awaiting_approval' && <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-warn/30 bg-warn/5 p-4 text-sm">This order is waiting for your approval. <Link to={`/checkout?order=${o._id}`} className="btn-brand btn-sm">Review and approve</Link><button className="btn-danger btn-sm" onClick={cancel}>Cancel order</button></div>}
      {o.failureReason && <p className="mb-4 text-sm text-muted">Note: {o.failureReason}</p>}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="card divide-y divide-line">{o.items.map((i: any) => <div key={i.productId} className="flex justify-between p-4 text-sm"><span>{i.quantity} × {i.name}</span><span className="font-semibold">{inr(i.price * i.quantity)}</span></div>)}</div>
          <section><h2 className="mb-2 font-semibold">Payment activity</h2>
            {!data.transactions.length ? <p className="text-sm text-muted">No payment activity yet.</p> : <ul className="card divide-y divide-line">{data.transactions.map((t: any) => (
              <li key={t._id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm"><span><span className="font-semibold capitalize">{t.kind}</span> <span className="text-muted">via {t.source}</span><span className="block text-xs text-muted">{date(t.createdAt)}{t.captureId ? ` · capture ${t.captureId}` : ''}</span></span><span className="flex items-center gap-3">{t.amount != null && `${t.amount} ${t.currency}`}<Status s={t.status} /></span></li>))}</ul>}
          </section>
        </div>
        <aside className="card h-fit space-y-2 p-5 text-sm">
          <div className="flex justify-between"><span className="text-muted">Subtotal</span>{inr(o.subtotal)}</div>
          <div className="flex justify-between"><span className="text-muted">Shipping</span>{o.shipping ? inr(o.shipping) : 'Free'}</div>
          <div className="flex justify-between border-t border-line pt-2 font-semibold"><span>Total</span>{inr(o.total)}</div>
          <div className="flex justify-between text-muted"><span>Charged via PayPal</span>{o.chargeAmount?.toFixed(2)} {o.chargeCurrency}</div>
          {o.paypalOrderId && <div className="break-all text-xs text-muted">PayPal order {o.paypalOrderId}</div>}
          {o.captureId && <div className="break-all text-xs text-muted">Capture {o.captureId}</div>}
          {o.paidAt && <div className="text-xs text-muted">Paid {date(o.paidAt)}</div>}
          {o.status === 'paid' && <p className="border-t border-line pt-3 text-xs text-muted">Need a refund or help? Ask the <Link to="/assistant" className="font-semibold text-brand">assistant</Link>. Refunds are handled through PayPal and support, not from this app.</p>}
        </aside>
      </div>
    </>
  );
}

export function Transactions() {
  const { data, loading, error, reload } = useFetch<any>('/transactions');
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'Could not load transactions'} retry={reload} />;
  return (
    <>
      <PageHead title="Transaction history" sub="Every PayPal capture, failure and cancellation, from the server's records." />
      {!data.items.length ? <Empty title="No transactions yet" hint="Payments and payment problems are recorded here." /> : (
        <div className="card overflow-x-auto"><table className="w-full min-w-[640px]"><thead><tr className="border-b border-line"><th className="th">When</th><th className="th">Type</th><th className="th">Order</th><th className="th">Amount</th><th className="th">Source</th><th className="th">Status</th></tr></thead>
          <tbody className="divide-y divide-line">{data.items.map((t: any) => (
            <tr key={t._id}><td className="td">{date(t.createdAt)}</td><td className="td capitalize">{t.kind}</td><td className="td"><Link className="text-brand" to={`/orders/${t.orderId}`}>#{short(t.orderId)}</Link></td><td className="td">{t.amount != null ? `${t.amount} ${t.currency}` : '–'}</td><td className="td text-muted">{t.source}</td><td className="td"><Status s={t.status} /></td></tr>))}</tbody></table></div>
      )}
    </>
  );
}
