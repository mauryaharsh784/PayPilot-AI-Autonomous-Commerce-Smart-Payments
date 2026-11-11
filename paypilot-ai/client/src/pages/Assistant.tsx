import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, ChevronDown, Loader2, Send, Trash2 } from 'lucide-react';
import { api, useFetch } from '../lib/api';
import { inr } from '../lib/format';
import { ProductCard } from '../components/ProductCard';
import { CompareTable } from './Catalog';
import { PageHead } from '../components/ui';
import { useApp } from '../store';

const starters = [
  'I need a laptop under ₹50,000 for programming, multitasking and occasional gaming',
  'Best phone under ₹30,000 with a good camera',
  'Noise cancelling headphones for travel under ₹12,000',
];

function Reply({ m, send }: { m: any; send: (t: string) => void }) {
  const navigate = useNavigate();
  const { toast, refresh } = useApp();
  const [trace, setTrace] = useState(false);
  const [cmp, setCmp] = useState(false);
  const remember = async () => {
    try { await api('/me/preferences/merge', { body: m.remember }); toast('Saved to your shopping memory'); } catch (e: any) { toast(e.message, 'bad'); }
  };
  const goApprove = () => { refresh(); navigate(`/checkout?order=${m.approval.orderId}`); };
  return (
    <div className="space-y-4">
      <div className="card whitespace-pre-line p-4 text-sm leading-relaxed">{m.message || m.content}</div>
      {m.cards?.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {m.cards.map((c: any) => (
            <ProductCard key={c.product.id} p={c.product}>
              <div className="space-y-2 rounded-xl bg-paper p-3 text-xs leading-relaxed">
                {c.explain.isTopPick && <span className="badge bg-brand-soft text-brand">Top pick</span>}
                <p><b>Why:</b> {c.explain.why}</p>
                {c.explain.vsAlternatives && <p><b>Vs. alternatives:</b> {c.explain.vsAlternatives}</p>}
                <p><b>Budget:</b> {c.explain.budgetFit}</p>
                {c.explain.strengths.length > 0 && <p className="text-ok"><b>Strengths:</b> {c.explain.strengths.join(' · ')}</p>}
                {c.explain.limitations.length > 0 && <p className="text-warn"><b>Limits:</b> {c.explain.limitations.join(' · ')}</p>}
                {c.explain.valueScore != null && <p className="text-muted">Value score {c.explain.valueScore}/100</p>}
              </div>
            </ProductCard>
          ))}
        </div>
      )}
      {m.budget && (
        <div className="card p-4 text-sm">
          <div className="font-semibold">Budget check{m.budget.budget ? ` · ${inr(m.budget.budget)} maximum` : ''}</div>
          {m.budget.warnings?.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-warn">{m.budget.warnings.map((w: string) => <li key={w}>{w}</li>)}</ul>}
          {m.budget.cheaperAlternatives?.length > 0 && (
            <p className="mt-2 text-muted">Cheaper alternatives: {m.budget.cheaperAlternatives.map((p: any) => <Link key={p.id} to={`/product/${p.id}`} className="font-semibold text-brand">{p.name} (save {inr(p.saves)})</Link>).reduce((a: any, b: any) => [a, ', ', b])}</p>
          )}
        </div>
      )}
      {m.comparison && (
        <div><button className="btn-ghost btn-sm" onClick={() => setCmp(!cmp)}>{cmp ? 'Hide' : 'Show'} full comparison</button>
          {cmp && <div className="mt-3"><CompareTable data={m.comparison} /></div>}</div>
      )}
      {m.cart && m.cart.items.length > 0 && (
        <div className="card p-4 text-sm">
          <ul className="divide-y divide-line">{m.cart.items.map((i: any) => <li key={i.productId} className="flex justify-between py-2"><span>{i.quantity} × {i.name}</span><span>{inr(i.lineTotal)}</span></li>)}</ul>
          <div className="mt-2 flex items-center justify-between font-semibold"><span>Total {inr(m.cart.total)}</span><Link to="/cart" className="btn-ghost btn-sm">Open cart</Link></div>
        </div>
      )}
      {m.approval && (
        <div className="card border-brand/40 p-4 text-sm">
          <div className="font-semibold">Order ready for your approval</div>
          <ul className="mt-2 text-muted">{m.approval.items.map((i: any) => <li key={i.name}>{i.quantity} × {i.name}</li>)}</ul>
          <div className="mt-2">Total {inr(m.approval.total)} · charged as {m.approval.chargeAmount} {m.approval.chargeCurrency}</div>
          <button className="btn-brand mt-3" onClick={goApprove}>Review and approve payment</button>
        </div>
      )}
      {m.questions?.length > 0 && <div className="flex flex-wrap gap-2">{m.questions.map((q: string) => <button key={q} className="btn-ghost btn-sm" onClick={() => send(q)}>{q}</button>)}</div>}
      {m.remember && <button className="text-xs font-semibold text-brand" onClick={remember}>Remember these preferences for next time</button>}
      {m.trace && (
        <div className="text-xs text-muted">
          <button className="flex items-center gap-1 font-semibold" onClick={() => setTrace(!trace)}>Agent activity ({m.mode}) <ChevronDown className={`h-3 w-3 transition ${trace ? 'rotate-180' : ''}`} /></button>
          {trace && <ul className="mt-2 space-y-1">{m.trace.map((t: any, i: number) => (
            <li key={i}><b>{t.agent}</b> · {t.mode} · {t.ms} ms{t.tools?.length ? ` · tools: ${t.tools.map((x: any) => x.name).join(', ')}` : ''}{t.llmError ? ` · fell back: ${t.llmError}` : ''}</li>))}</ul>}
        </div>
      )}
    </div>
  );
}

export default function Assistant() {
  const { data, loading, reload } = useFetch<any>('/assistant/session');
  const info = useFetch<any>('/config');
  const [items, setItems] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const { refresh } = useApp();

  useEffect(() => { if (data) setItems(data.messages.map((x: any) => (x.role === 'user' ? x : { role: 'assistant', ...(x.data || {}), message: x.content }))); }, [data]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [items, busy]);

  const send = async (msg: string) => {
    if (!msg.trim() || busy) return;
    setItems((p) => [...p, { role: 'user', content: msg }]); setText(''); setBusy(true);
    try { const r = await api('/assistant/message', { body: { message: msg } }); setItems((p) => [...p, { role: 'assistant', ...r }]); refresh(); }
    catch (e: any) { setItems((p) => [...p, { role: 'assistant', message: e.message, error: true }]); }
    finally { setBusy(false); }
  };
  const submit = (e: FormEvent) => { e.preventDefault(); send(text); };
  const clear = async () => { await api('/assistant/session', { method: 'DELETE' }); setItems([]); reload(); };

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[520px] flex-col">
      <PageHead title="AI shopping assistant" sub={`Agents run in ${info.data?.ai === 'rules' ? 'rules mode (add a Gemini or OpenAI key for LLM mode)' : `${info.data?.ai ?? '…'} mode`}. Every product comes from the catalog.`}
        right={items.length > 0 ? <button className="btn-ghost btn-sm" onClick={clear}><Trash2 className="h-3.5 w-3.5" />Clear chat</button> : undefined} />
      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        {loading ? <p className="text-sm text-muted">Loading your conversation…</p> : items.length === 0 && (
          <div className="card p-6">
            <Bot className="h-6 w-6 text-brand" />
            <h2 className="mt-3 font-semibold">What do you want to buy?</h2>
            <p className="mt-1 text-sm text-muted">Describe it in your own words, with a budget if you have one.</p>
            <div className="mt-4 flex flex-col gap-2">{starters.map((s) => <button key={s} className="btn-ghost justify-start text-left" onClick={() => send(s)}>{s}</button>)}</div>
          </div>
        )}
        {items.map((m, i) => m.role === 'user'
          ? <div key={i} className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-br-md bg-navy-900 px-4 py-2.5 text-sm text-white">{m.content}</div></div>
          : <Reply key={i} m={m} send={send} />)}
        {busy && <div className="flex items-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" />The agents are working…</div>}
        <div ref={end} />
      </div>
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input className="input" placeholder="e.g. add the first one to my cart" value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} aria-label="Message" />
        <button className="btn-brand" disabled={busy || !text.trim()} aria-label="Send"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}
