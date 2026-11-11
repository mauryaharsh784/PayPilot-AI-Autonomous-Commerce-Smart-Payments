import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './store';
import Layout from './components/Layout';
import { Spinner } from './components/ui';
import Landing from './pages/Landing';
import { Login, Register } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Assistant from './pages/Assistant';
import { Compare, Discover, ProductDetail } from './pages/Catalog';
import { Cart, Checkout, Pay } from './pages/Purchase';
import { OrderDetail, Orders, Transactions } from './pages/History';
import { Notifications, PriceWatch, Wishlist } from './pages/Lists';
import { Profile, Settings } from './pages/Account';
import Admin from './pages/Admin';

function Protected({ admin }: { admin?: boolean }) {
  const { user, ready } = useApp();
  if (!ready) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Layout />;
}

export default function App() {
  const init = useApp((s) => s.init);
  useEffect(() => { init(); }, [init]);
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Protected />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/pay/:id" element={<Pay />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/watch" element={<PriceWatch />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route element={<Protected admin />}><Route path="/admin" element={<Admin />} /></Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
