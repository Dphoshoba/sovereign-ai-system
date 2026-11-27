'use client';
import { useState, useEffect } from 'react';

export default function SlackConnectorDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/connectors/slack/status')
      .then(r => r.json())
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  return <div className="p-8"><h1 className="text-3xl font-bold mb-2">Slack Connector</h1>{loading && <p>Loading...</p>}{!loading && summary && <div><p>Status: Healthy</p></div>}</div>;
}
