import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { tenantsApi } from '../../api/tenants';
import StatusBadge from '../../components/ui/StatusBadge';
import Button      from '../../components/ui/Button';
import DataTable   from '../../components/ui/DataTable';
import Modal       from '../../components/ui/Modal';
import Input       from '../../components/ui/Input';
import { ArrowLeft, School, KeyRound, Users, UserRound, UserPlus } from 'lucide-react';

export default function TenantDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [tenant, setTenant]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [subForm, setSubForm]     = useState({});
  const [saving, setSaving]       = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  useEffect(() => { fetchTenant(); }, [id]);

  async function fetchTenant() {
    setLoading(true);
    try {
      const res = await tenantsApi.get(id);
      setTenant(res.data.tenant);
      setSubForm({
        status:    res.data.tenant.subscription?.status || 'ACTIVE',
        expiresAt: res.data.tenant.subscription?.expiresAt?.split('T')[0] || '',
      });
    } catch {
      toast.error('Failed to load school');
    } finally {
      setLoading(false);
    }
  }

  async function saveSubscription(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await tenantsApi.updateSubscription(id, subForm);
      toast.success('Subscription updated');
      fetchTenant();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddAdmin(e) {
    e.preventDefault();
    setCreatingAdmin(true);
    try {
      await tenantsApi.createAdmin(id, adminForm);
      toast.success('Admin added successfully');
      setShowAddAdmin(false);
      setAdminForm({ fullName: '', email: '', password: '', phone: '' });
      fetchTenant();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add admin');
    } finally {
      setCreatingAdmin(false);
    }
  }

  const daysRemaining = tenant?.subscription?.expiresAt
    ? Math.ceil((new Date(tenant.subscription.expiresAt) - Date.now()) / 86400000)
    : null;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!tenant) return <div className="text-slate-500">School not found.</div>;

  const userColumns = [
    { key: 'fullName', label: 'Name' },
    { key: 'email',    label: 'Email' },
    { key: 'role',     label: 'Role', render: (v) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/super-admin/schools')}
                  className="text-sm text-brand-600 hover:text-brand-800 font-medium mb-1 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Schools
          </button>
          <h1 className="page-title">{tenant.name}</h1>
          <p className="page-subtitle">
            <StatusBadge status={tenant.schoolLevel} /> · Created {new Date(tenant.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Info + Subscription grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* School Info */}
        <div className="card p-6 animate-fade-in-up">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><School className="w-4 h-4" /> School Info</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-semibold text-slate-800">{tenant.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Level</dt>
              <dd><StatusBadge status={tenant.schoolLevel} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Students</dt>
              <dd className="font-semibold text-slate-800">{tenant._count?.students ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Users</dt>
              <dd className="font-semibold text-slate-800">{tenant.users?.length ?? '—'}</dd>
            </div>
          </dl>
        </div>

        {/* Subscription */}
        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><KeyRound className="w-4 h-4" /> Subscription</h2>
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge status={tenant.subscription?.status || 'EXPIRED_LOCKED'} />
            {daysRemaining !== null && (
              <span className={`text-sm font-semibold ${daysRemaining < 0 ? 'text-red-500' : daysRemaining < 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d remaining`}
              </span>
            )}
          </div>

          <form onSubmit={saveSubscription} className="space-y-3">
            <div>
              <label className="label">Status</label>
              <select className="input" value={subForm.status}
                onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED_IN_GRACE">Grace Period</option>
                <option value="EXPIRED_LOCKED">Locked</option>
              </select>
            </div>
            <div>
              <label className="label">Expiry Date</label>
              <input className="input" type="date" value={subForm.expiresAt}
                onChange={(e) => setSubForm({ ...subForm, expiresAt: e.target.value })} />
            </div>
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              Save Subscription
            </Button>
          </form>
        </div>
      </div>

      {/* Users */}
      <div className="card p-6 animate-fade-in-up" style={{ animationDelay: 160 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><Users className="w-4 h-4" /> Users</h2>
          <Button size="sm" variant="primary" onClick={() => setShowAddAdmin(true)}>
            <UserPlus className="w-3.5 h-3.5" /> Add Admin
          </Button>
        </div>
        <DataTable
          columns={userColumns}
          data={tenant.users || []}
          emptyMessage="No users yet"
          emptyIcon={<UserRound className="w-12 h-12" />}
          total={tenant.users?.length || 0}
          pageSize={20}
        />
      </div>

      {/* Add Admin Modal */}
      <AdminForm
        isOpen={showAddAdmin}
        onClose={() => setShowAddAdmin(false)}
        form={adminForm}
        setForm={setAdminForm}
        saving={creatingAdmin}
        onSubmit={handleAddAdmin}
      />
    </div>
  );
}

function AdminForm({ isOpen, onClose, form, setForm, saving, onSubmit }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Admin" size="sm">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name *</label>
          <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="e.g. Grace Asante" required />
        </div>
        <div>
          <label className="label">Email *</label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="e.g. teacher@school.edu.gh" required />
        </div>
        <div>
          <label className="label">Password *</label>
          <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Min 8 characters" required />
        </div>
        <div>
          <label className="label">Phone Number</label>
          <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. 0244123456" />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="primary" loading={saving} className="flex-1">Add Admin</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
