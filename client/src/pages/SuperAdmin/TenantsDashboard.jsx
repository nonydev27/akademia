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
import PlanPicker    from '../../components/ui/PlanPicker';
import { planById }  from '../../config/plans';
import { School, CheckCircle2, AlertTriangle, Lock, ArrowRight, Plus, Users, GraduationCap, TrendingUp, Clock, Activity, FileSpreadsheet, Mail, BarChart3 } from 'lucide-react';

export default function TenantsDashboard() {
  const navigate = useNavigate();
  const [tenants, setTenants]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({
    schoolName: '', schoolLevel: 'JHS',
    adminFullName: '', adminEmail: '', adminPassword: '',
    adminPhone: '', adminContact: '', plan: 'BASIC',
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

  const totalStudents  = tenants.reduce((s, t) => s + (t._count?.students ?? 0), 0);
  const totalStaff     = tenants.reduce((s, t) => s + (t._count?.users ?? 0), 0);
  const totalClasses   = tenants.reduce((s, t) => s + (t._count?.classes ?? 0), 0);
  const totalSubjects  = tenants.reduce((s, t) => s + (t._count?.subjects ?? 0), 0);
  const totalComm      = tenants.reduce((s, t) => s + (t._count?.communications ?? 0), 0);
  const active         = tenants.filter((t) => t.subscription?.status === 'ACTIVE').length;
  const grace          = tenants.filter((t) => t.subscription?.status === 'EXPIRED_IN_GRACE').length;
  const locked         = tenants.filter((t) => t.subscription?.status === 'EXPIRED_LOCKED').length;
  const basicCount     = tenants.filter((t) => t.subscription?.plan === 'BASIC').length;
  const standardCount  = tenants.filter((t) => t.subscription?.plan === 'STANDARD').length;
  const premiumCount   = tenants.filter((t) => t.subscription?.plan === 'PREMIUM').length;
  const expiringSoon   = tenants.filter((t) => {
    if (!t.subscription?.expiresAt) return false;
    const days = Math.ceil((new Date(t.subscription.expiresAt) - Date.now()) / 86400000);
    return days >= 0 && days <= 14;
  }).length;
  const recent         = [...tenants].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await tenantsApi.create(form);
      toast.success(`${form.schoolName} added successfully!`);
      setShowAdd(false);
      setForm({ schoolName: '', schoolLevel: 'JHS', adminFullName: '', adminEmail: '', adminPassword: '', adminPhone: '', adminContact: '', plan: 'BASIC' });
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
    { key: 'subscription', label: 'Plan',
      render: (v) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="font-semibold text-slate-700">{planById(v?.plan).name}</span>
          <StatusBadge status={v?.status || 'EXPIRED_LOCKED'} />
        </span>
      ) },
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
          Manage <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      ) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Schools Dashboard</h1>
          <p className="page-subtitle">Overview of all school tenants and their activity</p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add School
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard icon={<School />}         label="Total Schools"   value={tenants.length}                  color="blue"   loading={loading} sub="registered" />
        <StatCard icon={<Users />}          label="Total Students"  value={totalStudents}                   color="green"  loading={loading} sub="across all schools" />
        <StatCard icon={<GraduationCap />}  label="Total Staff"     value={totalStaff}                      color="purple" loading={loading} sub="across all schools" />
        <StatCard icon={<TrendingUp />}     label="Active"           value={active}                          color="emerald" loading={loading} sub={`${grace} grace · ${locked} locked`} />
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard icon={<BarChart3 />}       label="Classes"      value={totalClasses}           color="blue"   loading={loading} sub="enrolled" />
        <StatCard icon={<Activity />}        label="Subjects"     value={totalSubjects}          color="pink"   loading={loading} sub="taught" />
        <StatCard icon={<Mail />}            label="Messages"     value={totalComm}              color="orange" loading={loading} sub="sent" />
        <StatCard icon={<Clock />}           label="Expiring Soon" value={expiringSoon}          color="gold"   loading={loading} sub="within 14 days" />
      </div>

      {/* Plan Distribution */}
      <div className="card p-6 animate-fade-in-up">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Subscription Distribution</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-700">{basicCount}</div>
            <div className="text-sm text-blue-500 font-medium">Basic</div>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <div className="text-2xl font-bold text-emerald-700">{standardCount}</div>
            <div className="text-sm text-emerald-500 font-medium">Standard</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <div className="text-2xl font-bold text-purple-700">{premiumCount}</div>
            <div className="text-sm text-purple-500 font-medium">Premium</div>
          </div>
        </div>
      </div>

      {/* Recent Schools + Table */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card p-5 animate-fade-in-up md:col-span-2">
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
            emptyIcon={<School className="w-12 h-12" />}
            total={filtered.length}
            pageSize={20}
            onRowClick={(row) => navigate(`/super-admin/schools/${row.id}`)}
          />
        </div>

        <div className="card p-5 animate-fade-in-up">
          <h2 className="font-bold text-slate-800 mb-4">Recent Activity</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400">No recent schools</p>
          ) : (
            <div className="space-y-3">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => navigate(`/super-admin/schools/${t.id}`)}>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{t.name}</div>
                    <div className="text-xs text-slate-400">
                      {(t._count?.students ?? 0)} students · {(t._count?.users ?? 0)} staff
                    </div>
                  </div>
                  <StatusBadge status={t.subscription?.status || 'EXPIRED_LOCKED'} />
                </div>
              ))}
            </div>
          )}
        </div>
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
              <Input label="Admin Phone Number" type="tel" value={form.adminPhone}
                placeholder="e.g. 0244123456"
                onChange={(e) => setForm({ ...form, adminPhone: e.target.value })} />
              <Input label="Admin Contact / Notes" value={form.adminContact}
                placeholder="e.g. WhatsApp, office extension…"
                onChange={(e) => setForm({ ...form, adminContact: e.target.value })} />
              <Input label="Admin Password" type="password" value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                placeholder="Min 8 characters" required />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-600 mb-3">Subscription Plan</p>
            <PlanPicker value={form.plan} onChange={(plan) => setForm({ ...form, plan })} />
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
