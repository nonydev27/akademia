import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { tenantsApi } from '../../api/tenants';
import StatCard      from '../../components/ui/StatCard';
import DataTable     from '../../components/ui/DataTable';
import StatusBadge   from '../../components/ui/StatusBadge';
import Modal         from '../../components/ui/Modal';
import Button        from '../../components/ui/Button';
import Input         from '../../components/ui/Input';

export default function TenantsDashboard() {
  const navigate = useNavigate();
  const [tenants, setTenants]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({
    schoolName: '', schoolLevel: 'JHS',
    adminFullName: '', adminEmail: '', adminPassword: '',
  });
  const [saving, setSaving]     = useState(false);

  useEffect(() => { fetchTenants(); }, []);

  async function fetchTenants() {
    setLoading(true);
    try {
      const res  = await tenantsApi.list();
      setTenants(res.data.tenants);
    } catch {
      toast.error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  }

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:   tenants.length,
    active:  tenants.filter((t) => t.subscription?.status === 'ACTIVE').length,
    grace:   tenants.filter((t) => t.subscription?.status === 'EXPIRED_IN_GRACE').length,
    locked:  tenants.filter((t) => t.subscription?.status === 'EXPIRED_LOCKED').length,
  };

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await tenantsApi.create(form);
      toast.success(`${form.schoolName} added successfully! 🎉`);
      setShowAdd(false);
      setForm({ schoolName: '', schoolLevel: 'JHS', adminFullName: '', adminEmail: '', adminPassword: '' });
      fetchTenants();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add school');
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: 'name',  label: 'School Name' },
    { key: 'schoolLevel', label: 'Level',
      render: (v) => <StatusBadge status={v} /> },
    { key: 'subscription', label: 'Subscription',
      render: (v) => <StatusBadge status={v?.status || 'EXPIRED_LOCKED'} /> },
    { key: 'subscription', label: 'Expires',
      render: (v) => v?.expiresAt
        ? new Date(v.expiresAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
        : '—' },
    { key: '_count', label: 'Students',
      render: (v) => (
        <span className="font-semibold text-slate-700">{v?.students ?? 0}</span>
      ) },
    { key: 'id', label: 'Actions',
      render: (id) => (
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/super-admin/schools/${id}`); }}>
          Manage →
        </Button>
      ) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Schools Dashboard</h1>
          <p className="page-subtitle">Manage all school tenants and subscriptions</p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
          + Add School
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard icon="🏫" label="Total Schools"    value={stats.total}  color="blue"   loading={loading} />
        <StatCard icon="✅" label="Active"           value={stats.active} color="green"  loading={loading} />
        <StatCard icon="⚠️" label="Grace Period"    value={stats.grace}  color="gold"   loading={loading} />
        <StatCard icon="🔒" label="Locked"           value={stats.locked} color="red"    loading={loading} />
      </div>

      {/* Table */}
      <div className="card p-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800">All Schools</h2>
          <input
            className="input max-w-xs"
            placeholder="Search schools…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No schools found"
          emptyIcon="🏫"
          total={filtered.length}
          pageSize={20}
          onRowClick={(row) => navigate(`/super-admin/schools/${row.id}`)}
        />
      </div>

      {/* Add School Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New School">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="School Name" value={form.schoolName}
            onChange={(e) => setForm({ ...form, schoolName: e.target.value })} required />

          <div>
            <label className="label">School Level</label>
            <select className="input" value={form.schoolLevel}
              onChange={(e) => setForm({ ...form, schoolLevel: e.target.value })}>
              <option value="PRIMARY">Primary</option>
              <option value="JHS">Junior High School (JHS)</option>
              <option value="SHS">Senior High School (SHS)</option>
            </select>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-600 mb-3">School Admin Account</p>
            <div className="space-y-3">
              <Input label="Admin Full Name"  value={form.adminFullName}
                onChange={(e) => setForm({ ...form, adminFullName: e.target.value })} required />
              <Input label="Admin Email" type="email" value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} required />
              <Input label="Admin Password" type="password" value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                placeholder="Min 8 characters" required />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={saving} className="flex-1">
              Add School
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
