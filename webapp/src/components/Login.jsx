import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!email || !pass) {
      setNotice({ error: true, msg: 'Please fill all fields' });
      return;
    }
    setLoading(true);
    setNotice(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        setNotice({ error: false, msg: 'Verification email sent! Check your inbox.' });
      }
    } catch (e2) {
      setNotice({ error: true, msg: e2.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <img src="/logo_plaque.png" alt="Keyan Groups" className="logo-img" />
        <h1>
          KEYAN <em>GROUPS</em>
        </h1>
        <h2>SECURE ARCHIVAL VAULT</h2>
        <form onSubmit={submit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="archivist@keyan.groups"
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </label>
          {notice && <div className={notice.error ? 'notice error' : 'notice'}>{notice.msg}</div>}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'AUTHENTICATING...' : isLogin ? 'ENTER THE VAULT' : 'CREATE ARCHIVE ACCOUNT'}
          </button>
        </form>
        <button className="link-btn" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'New here? Request archive access' : 'Already have access? Sign in'}
        </button>
      </div>
    </div>
  );
}
