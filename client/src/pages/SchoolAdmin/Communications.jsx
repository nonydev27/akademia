import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { communicationsApi } from '../../api/communications';
import CommunicationSend from './CommunicationSend';
import DataTable   from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Button      from '../../components/ui/Button';
import { Inbox, Mail, Smartphone, XCircle, RefreshCw, Send } from 'lucide-react';

const FILTERS = [
  { label: 'All',    Icon: Inbox },
  { label: 'Email',  Icon: Mail },
  { label: 'SMS',    Icon: Smartphone },
  { label: 'Failed', Icon: XCircle },
];

export default function Communications() {
  const [tab, setTab]     = useState(0);
  const [data, setData]   = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState({});
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => { fetchData(); }, [tab, page]); // eslint-disable-line

  async function fetchData() {
    setLoading(true);
    const params = { page, pageSize: 20 };
    if (tab === 1) params.channel = 'EMAIL';
    if (tab === 2) params.channel = 'SMS';
    if (tab === 3) params.status  = 'FAILED';
    try {
      const res = await communicationsApi.list(params);
      setData(res.data.communications);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load communications'); }
    finally { setLoading(false); }
  }

  async function handleRetry(id) {
    setRetrying((r) => ({ ...r, [id]: true }));
    try {
      await communicationsApi.retry(id);
      toast.success('Retry sent');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Retry failed');
    } finally {
      setRetrying((r) => ({ ...r, [id]: false }));
    }
  }

  const columns = [
    { key: 'createdAt', label: 'Date',
      render: (v) => new Date(v).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) },
    { key: 'channel',   label: 'Channel', render: (v) => <StatusBadge status={v} /> },
    { key: 'recipient', label: 'Recipient', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'templateKey', label: 'Template',
      render: (v) => (
        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{v}</span>
      ) },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'id', label: '',
      render: (id, row) => row.status === 'FAILED' ? (
        <Button size="sm" variant="outline" loading={!!retrying[id]} onClick={() => handleRetry(id)}>
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </Button>
      ) : null },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Communications</h1>
          <p className="page-subtitle">Email and SMS delivery log</p>
        </div>
        <Button variant="primary" onClick={() => setShowCompose(true)}>
          <Send className="w-4 h-4" /> Send
        </Button>
      </div>

      {showCompose && (
        <CommunicationSend
          onSent={() => { setShowCompose(false); fetchData(); }}
          onClose={() => setShowCompose(false)}
        />
      )}

      <div className="tab-bar">
        {FILTERS.map((f, i) => (
          <button key={f.label} className={`tab-item inline-flex items-center gap-1.5 ${tab === i ? 'active' : ''}`}
                  onClick={() => { setTab(i); setPage(1); }}>
            <f.Icon className="w-3.5 h-3.5" /> {f.label}
          </button>
        ))}
      </div>

      <div className="card p-5 animate-fade-in-up">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          total={total}
          page={page}
          pageSize={20}
          onPageChange={setPage}
          emptyMessage="No communications yet"
        />
      </div>
    </div>
  );
}
