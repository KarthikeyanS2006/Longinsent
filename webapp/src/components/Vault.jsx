import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { discoverIncident } from '../lib/api.js';
import { exportImagesPdf } from '../lib/pdf.js';
import DeepDiveModal from './DeepDiveModal.jsx';

export default function Vault() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState(null);
  const [active, setActive] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const fileRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, isError = false) => {
    setToast({ msg, isError });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('incident_date', { ascending: false });
    if (error) showToast(`Load failed: ${error.message}`, true);
    else setIncidents(data || []);
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function reconstruct(e) {
    e.preventDefault();
    if (!query.trim() || searching) return;
    setSearching(true);
    try {
      const found = await discoverIncident(query.trim());
      if (!found.title) throw new Error('No archival patterns found.');
      const row = {
        title: found.title,
        description: found.description,
        incident_date: found.date,
        image_url: found.image_url,
      };
      let { error } = await supabase.from('incidents').insert(row);
      if (error) {
        delete row.image_url;
        ({ error } = await supabase.from('incidents').insert(row));
        if (error) throw error;
      }
      showToast(`NODE REGISTERED: ${found.title}`);
      setQuery('');
      load();
    } catch (err) {
      showToast(`Discovery error: ${err.message}`, true);
    } finally {
      setSearching(false);
    }
  }

  async function addIncident(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const row = {
      title: form.get('title'),
      description: form.get('description'),
      incident_date: form.get('date') || null,
    };
    if (!row.title.trim()) return;
    const { error } = await supabase.from('incidents').insert(row);
    if (error) showToast(`Insert failed: ${error.message}`, true);
    else {
      setAddOpen(false);
      showToast('Incident added to vault');
      load();
    }
  }

  async function pickImages(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    showToast('Rendering archival PDF...');
    try {
      await exportImagesPdf(files);
      showToast('PDF ready - check your downloads');
    } catch (err) {
      showToast(`PDF error: ${err.message}`, true);
    } finally {
      e.target.value = '';
    }
  }

  const years = incidents.map((i) => i.incident_date?.slice(0, 4)).filter(Boolean);
  const stats = [
    { value: incidents.length, label: 'Archived Nodes' },
    { value: years.length ? years.reduce((a, b) => (a < b ? a : b)) : '—', label: 'Earliest Record' },
    { value: years.length ? years.reduce((a, b) => (a > b ? a : b)) : '—', label: 'Latest Record' },
  ];

  return (
    <div className="vault">
      <div className="stats-strip">
        {stats.map((s) => (
          <div className="stat-chip" key={s.label}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <form className="search-row" onSubmit={reconstruct}>
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Reconstruct history... describe an event (e.g. 'moon landing 1969')"
        />
        <button className="primary-btn" type="submit" disabled={searching || !query.trim()}>
          {searching ? 'RECONSTRUCTING...' : 'RECONSTRUCT'}
        </button>
      </form>
      <p className="search-hint">
        AI probes scan the archival grid and register new incident nodes. Press <kbd>Enter</kbd>{' '}
        to execute.
      </p>

      <div className="toolbar">
        <button className="secondary-btn" onClick={() => setAddOpen(true)}>
          + ADD INCIDENT
        </button>
        <button className="secondary-btn" onClick={() => fileRef.current?.click()}>
          IMAGES &rarr; PDF
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={pickImages}
        />
      </div>

      {searching && (
        <div className="searching-note">
          <div className="spinner small" />
          AI probes are analyzing archival patterns...
        </div>
      )}

      {loading ? (
        <div className="empty">Scanning vault...</div>
      ) : incidents.length === 0 ? (
        <div className="empty">The vault is empty. Reconstruct your first incident above.</div>
      ) : (
        <ul className="incident-list">
          {incidents.map((inc) => (
            <li key={inc.id} className="incident-card" onClick={() => setActive(inc)}>
              {inc.image_url ? (
                <img
                  className="incident-thumb"
                  src={inc.image_url}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="incident-thumb placeholder">&#9635;</div>
              )}
              <div className="incident-date">
                {inc.incident_date
                  ? new Date(inc.incident_date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'UNDATED'}
              </div>
              <div className="incident-body">
                <h3>{inc.title}</h3>
                {inc.description && <p>{inc.description}</p>}
              </div>
              <span className="incident-chevron">&rsaquo;</span>
            </li>
          ))}
        </ul>
      )}

      {addOpen && (
        <div className="modal-backdrop" onClick={() => setAddOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={addIncident}>
            <h2>REGISTER INCIDENT</h2>
            <label>
              Title
              <input name="title" required autoFocus placeholder="Event title" />
            </label>
            <label>
              Description
              <textarea name="description" rows={4} placeholder="What happened?" />
            </label>
            <label>
              Date
              <input name="date" type="date" />
            </label>
            <div className="modal-actions">
              <button type="button" className="link-btn" onClick={() => setAddOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                SAVE TO VAULT
              </button>
            </div>
          </form>
        </div>
      )}

      {active && (
        <DeepDiveModal
          incident={active}
          onClose={() => setActive(null)}
          onError={(m) => showToast(m, true)}
        />
      )}

      {toast && <div className={toast.isError ? 'toast error' : 'toast'}>{toast.msg}</div>}
    </div>
  );
}
