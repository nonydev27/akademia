import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { tenantsApi } from '../../api/tenants';
import StatusBadge from '../../components/ui/StatusBadge';
import Button      from '../../components/ui/Button';
import DataTable   from '../../components/ui/DataTable';
import Modal       from '../../components/ui/Modal';
import Input       from '../../components/ui/Input';
import PlanPicker  from '../../components/ui/PlanPicker';
import { PLAN_LIST, FEATURE_LABELS, planById, detectPlan } from '../../config/plans';
import { ArrowLeft, School, KeyRound, Users, UserRound, UserPlus, Save, BarChart3, Wallet, ClipboardCheck, GraduationCap, Users2, Mail, Phone, FileText, AlertTriangle, Lock, TrendingUp, Activity, FileSpreadsheet, Award } from 'lucide-react';

const FEATURES = Object.keys(FEATURE_LABELS).map((key) => ({ key, label: FEATURE_LABELS[key] }));

export default function TenantDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [tenant, setTenant]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [subForm, setSubForm]     = useState({});
  const [featuresForm, setFeaturesForm] = useState({});
  const [saving, setSaving]       = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [planForm, setPlanForm]   = useState('BASIC');
  const [savingPlan, setSavingPlan] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm]     = useState({ name: '', schoolLevel: 'JHS', slogan: '' });
  const [metrics, setMetrics]       = useState(null);

  useEffect(() => { fetchTenant(); }, [id]);

  async function fetchTenant() {
    setLoading(true);
    try {
      const res = await tenantsApi.get(id);
      const t = res.data.tenant;
      setTenant(t);
      setSubForm({
        status:    t.subscription?.status || 'ACTIVE',
        expiresAt: t.subscription?.expiresAt?.split('T')[0] || '',
      });
      setPlanForm(t.subscription?.plan || detectPlan(t.subscription?.features || {}));
      const feats = t.subscription?.features || {};
      setFeaturesForm({
        students:   true,
        grades:     true,
        fees:       true,
        email:      true,
        attendance: true,
        terms:      true,
        subjects:   true,
        ...feats,
      });
      setInfoForm({ name: t.name, schoolLevel: t.schoolLevel, slogan: t.slogan || '' });
      setMetrics({
        students:       t._count?.students ?? 0,
        users:          t._count?.users ?? 0,
        classes:        t._count?.classes ?? 0,
        subjects:       t._count?.subjects ?? 0,
        academicYears:  t._count?.academicYears ?? 0,
        guardians:      t._count?.guardians ?? 0,
        feeStructures:  t._count?.feeStructures ?? 0,
        communications: t._count?.communications ?? 0,
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

  async function savePlan() {
    setSavingPlan(true);
    try {
      await tenantsApi.updatePlan(id, planForm);
      toast.success('Plan updated');
      fetchTenant();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update plan');
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleSaveInfo(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await tenantsApi.update(id, { name: infoForm.name, schoolLevel: infoForm.schoolLevel });
      toast.success('School info updated');
      fetchTenant();
      setEditingInfo(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  }

  async function saveFeatures(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await tenantsApi.updateFeatures(id, featuresForm);
      toast.success('Feature access updated');
      fetchTenant();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  function toggleFeature(key) {
    setFeaturesForm((prev) => ({ ...prev, [key]: !prev[key] }));
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
  const currentPlan = planById(tenant?.subscription?.plan || detectPlan(tenant?.subscription?.features || {}));

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

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 animate-fade-in-up">
          <div className="card p-4 text-center">
            <Users className="w-5 h-5 mx-auto text-brand-600 mb-1" />
            <div className="text-xl font-bold text-slate-800">{metrics.students}</div>
            <div className="text-xs text-slate-400 uppercase">Students</div>
          </div>
          <div className="card p-4 text-center">
            <UserRound className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
            <div className="text-xl font-bold text-slate-800">{metrics.users}</div>
            <div className="text-xs text-slate-400 uppercase">Staff</div>
          </div>
          <div className="card p-4 text-center">
            <BarChart3 className="w-5 h-5 mx-auto text-blue-600 mb-1" />
            <div className="text-xl font-bold text-slate-800">{metrics.classes}</div>
            <div className="text-xs text-slate-400 uppercase">Classes</div>
          </div>
          <div className="card p-4 text-center">
            <GraduationCap className="w-5 h-5 mx-auto text-pink-600 mb-1" />
            <div className="text-xl font-bold text-slate-800">{metrics.subjects}</div>
            <div className="text-xs text-slate-400 uppercase">Subjects</div>
          </div>
          <div className="card p-4 text-center">
            <Activity className="w-5 h-5 mx-auto text-teal-600 mb-1" />
            <div className="text-xl font-bold text-slate-800">{metrics.academicYears}</div>
            <div className="text-xs text-slate-400 uppercase">Academic Yrs</div>
          </div>
          <div className="card p-4 text-center">
            <FileSpreadsheet className="w-5 h-5 mx-auto text-amber-600 mb-1" />
            <div className="text-xl font-bold text-slate-800">{metrics.feeStructures}</div>
            <div className="text-xs text-slate-400 uppercase">Fee Schedules</div>
          </div>
          <div className="card p-4 text-center">
            <ClipboardCheck className="w-5 h-5 mx-auto text-purple-600 mb-1" />
            <div className="text-xl font-bold text-slate-800">{metrics.guardians}</div>
            <div className="text-xs text-slate-400 uppercase">Guardians</div>
          </div>
          <div className="card p-4 text-center">
            <Mail className="w-5 h-5 mx-auto text-orange-600 mb-1" />
            <div className="text-xl font-bold text-slate-800">{metrics.communications}</div>
            <div className="text-xs text-slate-400 uppercase">Messages</div>
          </div>
        </div>
      )}

      {/* Info + Subscription grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* School Info */}
        <div className="card p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><School className="w-4 h-4" /> School Info</h2>
            <Button size="sm" variant="secondary" onClick={() => {
              setInfoForm({ name: tenant.name, schoolLevel: tenant.schoolLevel, slogan: tenant.slogan || '' });
              setEditingInfo(true);
            }}>
              {editingInfo ? <Save className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
              {editingInfo ? 'Save' : 'Edit'}
            </Button>
          </div>
          {editingInfo ? (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div>
                <label className="label">School Name</label>
                <Input value={infoForm.name} onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">School Level</label>
                <select className="input" value={infoForm.schoolLevel}
                  onChange={(e) => setInfoForm({ ...infoForm, schoolLevel: e.target.value })}>
                  <option value="PRIMARY">Primary</option>
                  <option value="JHS">Junior High (JHS)</option>
                  <option value="SHS">Senior High (SHS)</option>
                </select>
              </div>
              <div>
                <label className="label">Slogan <span className="text-slate-400 font-normal">(optional)</span></label>
                <Input value={infoForm.slogan} onChange={(e) => setInfoForm({ ...infoForm, slogan: e.target.value })}
                  placeholder="e.g. Excellence in Education" maxLength={200} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="sm" loading={saving}>Save</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditingInfo(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
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
                <dt className="text-slate-500">Slogan</dt>
                <dd className="font-medium text-slate-600 italic">{tenant.slogan || <span className="text-slate-300 not-italic">—</span>}</dd>
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
          )}
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

          <div className="mb-3 px-3 py-2 bg-slate-50 rounded-lg text-sm">
            <span className="font-semibold text-slate-700">Plan: {currentPlan.name}</span>
            <span className="text-slate-500 ml-2">GHS {currentPlan.priceGHS.toLocaleString()}/year</span>
          </div>

          <div className="mb-5">
            <label className="label">Subscription Plan</label>
            <div className="space-y-2 mb-3">
              <select className="input" value={planForm} onChange={(e) => setPlanForm(e.target.value)}>
                {PLAN_LIST.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — GHS {p.priceGHS.toLocaleString()}/year</option>
                ))}
              </select>
            </div>
            <Button type="button" variant="primary" size="sm" loading={savingPlan} onClick={savePlan}>
              <Save className="w-3.5 h-3.5" /> Apply Plan
            </Button>
            <p className="text-xs text-slate-400 mt-2">
              Choosing a plan sets the feature access below automatically.
            </p>
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

      {/* Feature Access */}
      <div className="card p-6 animate-fade-in-up">
        <form onSubmit={saveFeatures}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">Feature Access</h2>
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              Save Features
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map(({ key, label, tier }) => (
              <label key={key} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox"
                  checked={featuresForm[key] !== false}
                  onChange={() => toggleFeature(key)}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500" />
                <div>
                  <div className="text-sm font-medium text-slate-800">{label}</div>
                  <div className="text-xs text-slate-400 uppercase">{tier}</div>
                </div>
              </label>
            ))}
          </div>
        </form>
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
