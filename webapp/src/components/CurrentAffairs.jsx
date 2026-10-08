import { useEffect, useState } from 'react';
import { getCurrentAffairs } from '../lib/api.js';

export default function CurrentAffairs() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    getCurrentAffairs()
      .then((d) => live && setEvents(d))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, []);

  if (error) return <div className="empty">Unable to retrieve timeline data: {error}</div>;
  if (!events)
    return (
      <div className="searching-note">
        <div className="spinner small" />
        Scanning Temporal Lines...
      </div>
    );
  if (!events.length) return <div className="empty">Unable to retrieve timeline data.</div>;

  return (
    <div className="affairs">
      <h2 className="page-title">ON THIS DAY</h2>
      <ul className="affairs-list">
        {events.map((e, i) => (
          <li key={i} className="affair-card" style={{ animationDelay: `${i * 90}ms` }}>
            <div className="affair-year">{e.year}</div>
            <h3>{e.title}</h3>
            <p>{e.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
