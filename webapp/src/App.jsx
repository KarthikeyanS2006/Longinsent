import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase.js';
import Login from './components/Login.jsx';
import Vault from './components/Vault.jsx';
import CurrentAffairs from './components/CurrentAffairs.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  const [page, setPage] = useState('vault');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooting(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (booting) {
    return (
      <div className="boot-screen">
        <img src="/logo_plaque.png" alt="Keyan Groups" />
        <div className="spinner" />
        <p>Initializing archival protocol...</p>
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img src="/logo_plaque.png" alt="" />
          <div>
            <h1>
              KEYAN <em>GROUPS</em>
            </h1>
            <p>Secure Archival Vault &middot; Research Protocol</p>
          </div>
        </div>
        <nav className="nav">
          <button
            className={page === 'vault' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setPage('vault')}
          >
            VAULT
          </button>
          <button
            className={page === 'affairs' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setPage('affairs')}
          >
            ON THIS DAY
          </button>
          <button className="nav-btn ghost" onClick={() => supabase.auth.signOut()}>
            SIGN OUT
          </button>
        </nav>
      </header>
      <main className="content">
        {page === 'vault' ? <Vault /> : <CurrentAffairs />}
      </main>
    </div>
  );
}
