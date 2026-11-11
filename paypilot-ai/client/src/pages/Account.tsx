import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api, useFetch } from '../lib/api';
import { date, inr } from '../lib/format';
import { Field, PageHead, Spinner, Toggle } from '../components/ui';
import { useApp } from '../store';

const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

export function Profile() {
  const { user, setUser, toast } = useApp();
  const hist = useFetch<any>('/me/shopping-history');
  const [name, setName] = useState(user?.name || '');
  const [p, setP] = useState({ brands: '', categories: '', specs: '', maxBudget: '' });
  useEffect(() => {
    const x = user?.preferences || {};
    setP({ brands: (x.brands || []).join(', '), categories: (x.categories || []).join(', '), specs: (x.specs || []).join(', '), maxBudget: x.maxBudget ? String(x.maxBudget) : '' });
  }, [user?.preferences]);
  const savePrefs = async () => {
    try { const r = await api('/me/preferences', { method: 'PUT', body: { brands: list(p.brands), categories: list(p.categories), specs: list(p.specs), maxBudget: p.maxBudget ? Number(p.maxBudget) : null } }); setUser(r.user); toast('Shopping memory updated'); }
    catch (e: any) { toast(e.message, 'bad'); }
  };
  const wipe = async () => { try { const r = await api('/me/preferences', { method: 'DELETE' }); setUser(r.user); toast('Shopping memory deleted'); } catch (e: any) { toast(e.message, 'bad'); } };
  const saveName = async () => { try { const r = await api('/me', { method: 'PUT', body: { name } }); setUser(r.user); toast('Profile saved'); } catch (e: any) { toast(e.message, 'bad'); } };
  return (
    <>
      <PageHead title="Profile and shopping memory" sub="The assistant uses only what you approve here." />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-4 p-5">
          <h2 className="font-semibold">Profile</h2>
          <Field label="Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Email"><input className="input" value={user?.email} disabled /></Field>
          <button className="btn-primary" disabled={name.trim().length < 2 || name === user?.name} onClick={saveName}>Save profile</button>
        </section>
        <section className="card space-y-4 p-5">
          <h2 className="font-semibold">Shopping preferences</h2>
          <Field label="Preferred brands (comma separated)"><input className="input" value={p.brands} onChange={(e) => setP({ ...p, brands: e.target.value })} placeholder="Nexa, Orbit" /></Field>
          <Field label="Categories"><input className="input" value={p.categories} onChange={(e) => setP({ ...p, categories: e.target.value })} placeholder="laptops, phones" /></Field>
          <Field label="Preferred specs"><input className="input" value={p.specs} onChange={(e) => setP({ ...p, specs: e.target.value })} placeholder="16 GB RAM, lightweight" /></Field>
          <Field label="Typical maximum budget (₹)"><input className="input" type="number" min={0} value={p.maxBudget} onChange={(e) => setP({ ...p, maxBudget: e.target.value })} /></Field>
          <div className="flex gap-2"><button className="btn-primary" onClick={savePrefs}>Save preferences</button><button className="btn-danger" onClick={wipe}><Trash2 className="h-4 w-4" />Delete all</button></div>
        </section>
      </div>
      <section className="card mt-6 p-5">
        <h2 className="font-semibold">Shopping history</h2>
        {hist.loading ? <Spinner /> : !hist.data?.items.length ? <p className="mt-2 text-sm text-muted">Verified purchases will be listed here.</p> : (
          <ul className="mt-3 divide-y divide-line text-sm">{hist.data.items.map((i: any, n: number) => <li key={n} className="flex justify-between py-2"><span>{i.quantity} × {i.name}</span><span className="text-muted">{inr(i.price * i.quantity)} · {date(i.at)}</span></li>)}</ul>
        )}
      </section>
    </>
  );
}

export function Settings() {
  const { user, setUser, toast } = useApp();
  const cfg = useFetch<any>('/config');
  if (!user) return null;
  const save = async (patch: Partial<typeof user.settings>) => {
    try { const r = await api('/me/settings', { method: 'PUT', body: { ...user.settings, ...patch } }); setUser(r.user); }
    catch (e: any) { toast(e.message, 'bad'); }
  };
  const rows = [
    { key: 'aiMemory', title: 'Let the assistant use my shopping memory', hint: 'Saved brands, budget and categories fill gaps in your requests.' },
    { key: 'priceAlerts', title: 'Price alerts', hint: 'Notify me when a watched product changes price.' },
  ] as const;
  return (
    <>
      <PageHead title="Settings" />
      <div className="card divide-y divide-line">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-6 p-5"><div><div className="font-semibold">{r.title}</div><div className="text-sm text-muted">{r.hint}</div></div>
            <Toggle on={(user.settings as any)[r.key]} label={r.title} onChange={(v) => save({ [r.key]: v })} /></div>
        ))}
      </div>
      <section className="card mt-6 p-5 text-sm">
        <h2 className="font-semibold">Environment</h2>
        {cfg.loading ? <Spinner /> : cfg.data && <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div><dt className="text-muted">PayPal sandbox</dt><dd className="font-semibold">{cfg.data.paypalConfigured ? 'Credentials set' : 'Credentials missing'}</dd></div>
          <div><dt className="text-muted">Webhook verification</dt><dd className="font-semibold">{cfg.data.webhookConfigured ? 'Webhook ID set' : 'Webhook ID missing'}</dd></div>
          <div><dt className="text-muted">Agents</dt><dd className="font-semibold">{cfg.data.ai === 'rules' ? 'Rules mode (no AI key)' : `LLM: ${cfg.data.ai}`}</dd></div>
          <div><dt className="text-muted">Charge currency</dt><dd className="font-semibold">{cfg.data.currency} at ₹{cfg.data.inrPerUnit} per unit</dd></div></dl>}
      </section>
    </>
  );
}
