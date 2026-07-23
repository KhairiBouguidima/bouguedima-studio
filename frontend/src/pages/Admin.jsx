import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient, { apiErrorMessage, clearToken, getToken, setToken as saveToken } from '../api/client'
import { assetUrl } from '../config'

const STATUS_COLORS = {
  'Lead':        { bg: 'rgba(167,130,78,.15)', color: '#A7824E' },
  'Quoted':      { bg: 'rgba(59,130,246,.15)', color: '#3b82f6' },
  'In Progress': { bg: 'rgba(245,158,11,.15)', color: '#f59e0b' },
  'Completed':   { bg: 'rgba(34,197,94,.15)',  color: '#22c55e' },
}

const EMPTY_PROJECT = { title: '', cat: '', sub: '', loc: '', img: '', live: true }
const EMPTY_SERVICE = { n: '', t: '', d: '', tag: '' }
const EMPTY_CATEGORY = { name: '', desc: '', price_per_meter: 0 }
const EMPTY_LEAD = { name: '', project: '', area: '', style: '', email: '', phone: '', message: '', photos: 0, location: '', budget: '—', status: 'Lead' }

const adminInput = { background: '#38322A', border: '1px solid #4a4238', color: '#EDE7DC' }

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="form-label" style={{ color: '#7A6F65' }}>{label}</label>
      {children}
    </div>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const [token, setToken] = useState(() => getToken())
  const [tab, setTab] = useState('leads')
  const [leads, setLeads] = useState([])
  const [projects, setProjects] = useState([])
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [leadBudget, setLeadBudget] = useState('')
  const [leadModal, setLeadModal] = useState(null)
  const [creds, setCreds] = useState({ username: '', password: '' })
  const [loginErr, setLoginErr] = useState('')
  const [actionErr, setActionErr] = useState('')
  const [projectModal, setProjectModal] = useState(null)
  const [serviceModal, setServiceModal] = useState(null)
  const [categoryModal, setCategoryModal] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const apiCall = async (path, options = {}) => {
    const { data } = await apiClient.request({
      url: path,
      method: options.method || 'GET',
      data: options.body ? JSON.parse(options.body) : undefined,
      headers: options.headers,
    })
    return data || { ok: true }
  }

  useEffect(() => {
    if (!token) return
    apiClient.get('/auth/me').catch(() => { setToken(''); clearToken() })
  }, [token])

  useEffect(() => {
    if (!token) return
    setActionErr('')
    if (tab === 'leads') {
      apiCall('/leads').then(setLeads).catch(() => {})
    } else if (tab === 'portfolio') {
      Promise.all([apiCall('/admin/projects'), apiCall('/categories')])
        .then(([ps, cats]) => { setProjects(ps); setCategories(cats) })
        .catch(() => {})
    } else if (tab === 'services') {
      apiCall('/services').then(setServices).catch(() => {})
    } else if (tab === 'categories') {
      apiCall('/categories').then(setCategories).catch(() => {})
    }
  }, [token, tab])

  useEffect(() => {
    if (selectedLead) setLeadBudget(selectedLead.budget || '')
  }, [selectedLead])

  const login = async () => {
    setLoginErr('')
    try {
      const { data } = await apiClient.post('/auth/login', creds)
      saveToken(data.token)
      setToken(data.token)
    } catch (e) { setLoginErr(apiErrorMessage(e, 'Invalid username or password')) }
  }
  const updateLeadStatus = async (id, status) => {
    const updated = await apiCall(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    setLeads(ls => ls.map(l => l.id === id ? updated : l))
    if (selectedLead?.id === id) setSelectedLead(updated)
  }

  const updateLeadBudget = async () => {
    if (!selectedLead) return
    const updated = await apiCall(`/leads/${selectedLead.id}`, { method: 'PATCH', body: JSON.stringify({ budget: leadBudget }) })
    setLeads(ls => ls.map(l => l.id === selectedLead.id ? updated : l))
    setSelectedLead(updated)
  }

  const toggleLive = async (p) => {
    const updated = await apiCall(`/admin/projects/${p.id}`, { method: 'PATCH', body: JSON.stringify({ live: !p.live }) })
    setProjects(ps => ps.map(x => x.id === p.id ? updated : x))
  }

  const handleProjectImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setActionErr('')
    try {
      const formData = new FormData()
      formData.append('files', file)
      const { data } = await apiClient.post('/upload', formData)
      const img = data.paths?.[0] || ''
      if (img) {
        setProjectModal(m => ({ ...m, data: { ...m.data, img } }))
      }
    } catch (err) {
      setActionErr(apiErrorMessage(err, 'تعذر رفع الصورة'))
    }
  }

  const saveProject = async () => {
    setActionErr('')
    try {
      if (projectModal.mode === 'create') {
        const created = await apiCall('/admin/projects', { method: 'POST', body: JSON.stringify(projectModal.data) })
        setProjects(ps => [...ps, created])
      } else {
        const updated = await apiCall(`/admin/projects/${projectModal.data.id}`, { method: 'PATCH', body: JSON.stringify(projectModal.data) })
        setProjects(ps => ps.map(x => x.id === updated.id ? updated : x))
      }
      setProjectModal(null)
    } catch (e) { setActionErr(e.message) }
  }

  const saveService = async () => {
    setActionErr('')
    try {
      if (serviceModal.mode === 'create') {
        const created = await apiCall('/admin/services', { method: 'POST', body: JSON.stringify(serviceModal.data) })
        setServices(ss => [...ss, created])
      } else {
        const { id, ...body } = serviceModal.data
        const updated = await apiCall(`/admin/services/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
        setServices(ss => ss.map(x => x.id === updated.id ? updated : x))
      }
      setServiceModal(null)
    } catch (e) { setActionErr(e.message) }
  }

  const saveCategory = async () => {
    setActionErr('')
    try {
      if (categoryModal.mode === 'create') {
        const created = await apiCall('/admin/categories', { method: 'POST', body: JSON.stringify(categoryModal.data) })
        setCategories(cs => cs.some(c => c.id === created.id) ? cs : [...cs, created])
      } else {
        const updated = await apiCall(`/admin/categories/${categoryModal.data.id}`, { method: 'PATCH', body: JSON.stringify({ name: categoryModal.data.name, desc: categoryModal.data.desc, price_per_meter: categoryModal.data.price_per_meter }) })
        setCategories(cs => cs.map(x => x.id === updated.id ? updated : x))
      }
      setCategoryModal(null)
    } catch (e) { setActionErr(e.message) }
  }

  const saveLead = async () => {
    setActionErr('')
    try {
      if (leadModal.mode === 'create') {
        const created = await apiCall('/admin/leads', { method: 'POST', body: JSON.stringify(leadModal.data) })
        setLeads(ls => [created, ...ls])
      } else {
        const { id, when, initials, created_at, ...body } = leadModal.data
        const updated = await apiCall(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
        setLeads(ls => ls.map(l => l.id === updated.id ? updated : l))
        if (selectedLead?.id === id) setSelectedLead(updated)
      }
      setLeadModal(null)
    } catch (e) { setActionErr(e.message) }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setActionErr('')
    try {
      const { type, id } = confirmDelete
      if (type === 'project') {
        await apiCall(`/admin/projects/${id}`, { method: 'DELETE' })
        setProjects(ps => ps.filter(x => x.id !== id))
      } else if (type === 'service') {
        await apiCall(`/admin/services/${id}`, { method: 'DELETE' })
        setServices(ss => ss.filter(x => x.id !== id))
      } else if (type === 'category') {
        await apiCall(`/admin/categories/${id}`, { method: 'DELETE' })
        setCategories(cs => cs.filter(x => x.id !== id))
      } else if (type === 'lead') {
        await apiCall(`/leads/${id}`, { method: 'DELETE' })
        setLeads(ls => ls.filter(x => x.id !== id))
        if (selectedLead?.id === id) setSelectedLead(null)
      }
      setConfirmDelete(null)
    } catch (e) { setActionErr(e.message) }
  }

  const ActionBtn = ({ onClick, children, danger }) => (
    <button
      onClick={onClick}
      className="admin-action-btn"
      style={danger ? { color: '#ef4444', borderColor: 'rgba(239,68,68,.3)' } : undefined}
    >
      {children}
    </button>
  )

  const AddBtn = ({ onClick, label }) => (
    <button onClick={onClick} className="admin-add-btn">+ {label}</button>
  )

  if (!token) return (
    <div className="login-box" dir="rtl">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 44, height: 44, border: '1px solid #A7824E', display: 'grid', placeItems: 'center', fontFamily: "'Amiri',serif", fontSize: 22, color: '#A7824E', margin: '0 auto 16px' }}>ب</div>
          <div style={{ fontFamily: "'Amiri',serif", fontSize: 22, color: '#EDE7DC' }}>الورشة</div>
          <div style={{ fontSize: 13, color: '#7A6F65', marginTop: 6 }}>دخول خاص بالصنايعي</div>
        </div>
        {loginErr && <div style={{ background: 'rgba(239,68,68,.15)', color: '#ef4444', padding: '12px 16px', borderRadius: 6, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{loginErr}</div>}
        <div style={{ marginBottom: 14 }}>
          <label className="form-label" style={{ color: '#7A6F65' }}>اسم المستخدم</label>
          <input className="form-input" style={adminInput} value={creds.username} onChange={e => setCreds(c => ({ ...c, username: e.target.value }))} placeholder="admin" onKeyDown={e => e.key === 'Enter' && login()} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label className="form-label" style={{ color: '#7A6F65' }}>كلمة المرور</label>
          <input className="form-input" type="password" style={adminInput} value={creds.password} onChange={e => setCreds(c => ({ ...c, password: e.target.value }))} placeholder="••••••" onKeyDown={e => e.key === 'Enter' && login()} />
        </div>
        <button onClick={login} style={{ width: '100%', padding: '14px', background: '#A7824E', color: '#FBF9F4', border: 'none', fontSize: 14, letterSpacing: '.06em', cursor: 'pointer', fontFamily: 'inherit' }}>دخول</button>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#5a5048', cursor: 'pointer' }} onClick={() => navigate('/')}>← ارجع للموقع</div>
      </div>
    </div>
  )

  return (
    <div className="admin-wrap">
      <div className="admin-topbar">
        <div className="admin-topbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 32, height: 32, border: '1px solid #A7824E', display: 'grid', placeItems: 'center', fontFamily: "'Amiri',serif", fontSize: 16, color: '#A7824E' }}>ب</div>
              <div style={{ fontFamily: "'Amiri',serif", fontSize: 14, letterSpacing: '.1em' }}>الورشة</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className={`admin-nav-btn${tab === 'leads' ? ' active' : ''}`} onClick={() => setTab('leads')}>🧾 الطلبات</button>
              <button className={`admin-nav-btn${tab === 'portfolio' ? ' active' : ''}`} onClick={() => setTab('portfolio')}>🖼 المشاريع</button>
              <button className={`admin-nav-btn${tab === 'services' ? ' active' : ''}`} onClick={() => setTab('services')}>⚙ الخدمات</button>
              <button className={`admin-nav-btn${tab === 'categories' ? ' active' : ''}`} onClick={() => setTab('categories')}>🏷 التصنيفات</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate('/')} style={{ fontSize: 12, color: '#7A6F65', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>← الموقع</button>
            <button onClick={() => { clearToken(); setToken('') }} style={{ fontSize: 12, color: '#A7824E', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>خروج</button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        {actionErr && (
          <div style={{ background: 'rgba(239,68,68,.15)', color: '#ef4444', padding: '12px 16px', borderRadius: 6, fontSize: 13, marginBottom: 20 }}>
            {actionErr}
            <button onClick={() => setActionErr('')} style={{ float: 'left', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
          </div>
        )}

        {tab === 'leads' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: "'Amiri',serif", fontSize: 26, margin: 0 }}>الطلبات الواردة <span style={{ fontSize: 15, color: '#7A6F65', fontFamily: 'Tajawal' }}>({leads.length})</span></h2>
              <AddBtn label="طلب جديد" onClick={() => setLeadModal({ mode: 'create', data: { ...EMPTY_LEAD } })} />
            </div>
            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 1fr 110px 140px 140px', gap: 16, padding: '12px 20px', borderBottom: '1px solid #38322A', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#7A6F65' }}>
                <div />
                <div>العميل</div>
                <div>المشروع</div>
                <div>الحالة</div>
                <div>التاريخ</div>
                <div />
              </div>
              {leads.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#7A6F65', fontSize: 14 }}>لا يوجد طلبات بعد</div>
              ) : leads.map(lead => (
                <div key={lead.id} style={{ display: 'grid', gridTemplateColumns: '56px 1fr 1fr 110px 140px 140px', gap: 16, padding: '14px 20px', borderBottom: '1px solid #38322A', alignItems: 'center', transition: 'background .2s', cursor: 'pointer' }}
                  onClick={() => setSelectedLead(lead)}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="avatar">{lead.initials}</div>
                  <div>
                    <div style={{ fontSize: 14, color: '#EDE7DC' }}>{lead.name}</div>
                    <div style={{ fontSize: 12, color: '#7A6F65', marginTop: 2 }}>{lead.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: '#EDE7DC' }}>{lead.project}</div>
                    <div style={{ fontSize: 12, color: '#7A6F65', marginTop: 2 }}>{lead.area}</div>
                  </div>
                  <div>
                    <span className="status-badge" style={STATUS_COLORS[lead.status] || { background: 'rgba(255,255,255,.1)', color: '#EDE7DC' }}>{lead.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#7A6F65' }}>{lead.when}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <ActionBtn onClick={e => { e.stopPropagation(); setLeadModal({ mode: 'edit', data: { ...lead } }) }}>تعديل</ActionBtn>
                    <ActionBtn danger onClick={e => { e.stopPropagation(); setConfirmDelete({ type: 'lead', id: lead.id, title: lead.name }) }}>حذف</ActionBtn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'portfolio' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: "'Amiri',serif", fontSize: 26, margin: 0 }}>المشاريع <span style={{ fontSize: 15, color: '#7A6F65', fontFamily: 'Tajawal' }}>({projects.length})</span></h2>
              <AddBtn label="مشروع جديد" onClick={() => setProjectModal({ mode: 'create', data: { ...EMPTY_PROJECT, cat: categories[0]?.name || '' } })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
              {projects.map(p => (
                <div key={p.id} className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ height: 180, background: `#3a332b url(${assetUrl(p.img)}) center/cover` }}>
                    <div style={{ height: '100%', background: 'linear-gradient(0deg,rgba(0,0,0,.5),transparent)', display: 'flex', alignItems: 'flex-end', padding: '14px 16px' }}>
                      <div style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#E2CFA9' }}>{p.cat} · {p.sub}</div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, color: '#EDE7DC', fontFamily: "'Amiri',serif" }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: '#7A6F65', marginTop: 3 }}>{p.loc}</div>
                      </div>
                      <button onClick={() => toggleLive(p)} style={{ cursor: 'pointer', padding: '7px 14px', borderRadius: 99, border: 'none', fontSize: 11, fontFamily: 'inherit', background: p.live ? 'rgba(34,197,94,.15)' : 'rgba(255,255,255,.08)', color: p.live ? '#22c55e' : '#7A6F65', transition: 'all .2s', flexShrink: 0 }}>
                        {p.live ? '● مباشر' : '○ مخفي'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ActionBtn onClick={() => setProjectModal({ mode: 'edit', data: { ...p } })}>تعديل</ActionBtn>
                      <ActionBtn danger onClick={() => setConfirmDelete({ type: 'project', id: p.id, title: p.title })}>حذف</ActionBtn>
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#7A6F65', fontSize: 14, gridColumn: '1/-1' }}>لا يوجد مشاريع بعد</div>
              )}
            </div>
          </div>
        )}

        {tab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: "'Amiri',serif", fontSize: 26, margin: 0 }}>الخدمات <span style={{ fontSize: 15, color: '#7A6F65', fontFamily: 'Tajawal' }}>({services.length})</span></h2>
              <AddBtn label="خدمة جديدة" onClick={() => setServiceModal({ mode: 'create', data: { ...EMPTY_SERVICE } })} />
            </div>
            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 2fr 1fr 120px', gap: 16, padding: '12px 20px', borderBottom: '1px solid #38322A', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#7A6F65' }}>
                <div>رقم</div>
                <div>العنوان</div>
                <div>الوصف</div>
                <div>الوسم</div>
                <div />
              </div>
              {services.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#7A6F65', fontSize: 14 }}>لا يوجد خدمات بعد</div>
              ) : services.map(s => (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 2fr 1fr 120px', gap: 16, padding: '14px 20px', borderBottom: '1px solid #38322A', alignItems: 'center' }}>
                  <div style={{ fontFamily: "'Amiri',serif", fontSize: 18, color: '#A7824E' }}>{s.n}</div>
                  <div style={{ fontSize: 14, color: '#EDE7DC', fontFamily: "'Amiri',serif" }}>{s.t}</div>
                  <div style={{ fontSize: 13, color: '#7A6F65', lineHeight: 1.5 }}>{s.d}</div>
                  <div style={{ fontSize: 12, color: '#A7824E' }}>{s.tag}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <ActionBtn onClick={() => setServiceModal({ mode: 'edit', data: { ...s } })}>تعديل</ActionBtn>
                    <ActionBtn danger onClick={() => setConfirmDelete({ type: 'service', id: s.id, title: s.t })}>حذف</ActionBtn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'categories' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: "'Amiri',serif", fontSize: 26, margin: 0 }}>التصنيفات <span style={{ fontSize: 15, color: '#7A6F65', fontFamily: 'Tajawal' }}>({categories.length})</span></h2>
              <AddBtn label="تصنيف جديد" onClick={() => setCategoryModal({ mode: 'create', data: { ...EMPTY_CATEGORY } })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
              {categories.map(c => (
                <div key={c.id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', marginBottom: 0 }}>
                  <div>
                    <div style={{ fontSize: 16, color: '#EDE7DC', fontFamily: "'Amiri',serif" }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: '#7A6F65', marginTop: 4 }}>{c.desc || 'بدون وصف'}</div>
                    <div style={{ fontSize: 14, color: '#A7824E', marginTop: 4, fontFamily: 'Tajawal' }}>{c.price_per_meter} دج / م²</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <ActionBtn onClick={() => setCategoryModal({ mode: 'edit', data: { ...c } })}>تعديل</ActionBtn>
                    <ActionBtn danger onClick={() => setConfirmDelete({ type: 'category', id: c.id, title: c.name })}>حذف</ActionBtn>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#7A6F65', fontSize: 14, gridColumn: '1/-1' }}>لا يوجد تصنيفات بعد</div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedLead && (
        <div className="modal-bg" onClick={() => setSelectedLead(null)}>
          <div className="modal" style={{ background: '#2E2922', border: '1px solid #38322A', color: '#EDE7DC' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedLead(null)}>✕</button>
            <div style={{ padding: '40px 44px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 30 }}>
                <div className="avatar" style={{ width: 56, height: 56, fontSize: 22 }}>{selectedLead.initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Amiri',serif", fontSize: 26 }}>{selectedLead.name}</div>
                  <div style={{ fontSize: 13, color: '#7A6F65', marginTop: 4 }}>{selectedLead.when}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <ActionBtn onClick={() => { setLeadModal({ mode: 'edit', data: { ...selectedLead } }); setSelectedLead(null) }}>تعديل</ActionBtn>
                  <ActionBtn danger onClick={() => { setConfirmDelete({ type: 'lead', id: selectedLead.id, title: selectedLead.name }); setSelectedLead(null) }}>حذف</ActionBtn>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                {[['المشروع', selectedLead.project], ['المساحة', selectedLead.area], ['الستيل', selectedLead.style], ['البريد', selectedLead.email], ['الهاتف', selectedLead.phone], ['الموقع', selectedLead.location]].map(([k, v]) => (
                  <div key={k} style={{ background: 'rgba(255,255,255,.04)', padding: '14px 16px', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7A6F65', marginBottom: 5 }}>{k}</div>
                    <div style={{ fontSize: 15, color: '#EDE7DC' }}>{v || '—'}</div>
                  </div>
                ))}
                <div style={{ background: 'rgba(255,255,255,.04)', padding: '14px 16px', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7A6F65', marginBottom: 5 }}>الميزانية</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" style={{ ...adminInput, flex: 1 }} value={leadBudget} onChange={e => setLeadBudget(e.target.value)} placeholder="320,000 دج" />
                    <button onClick={updateLeadBudget} style={{ padding: '0 16px', background: '#A7824E', color: '#FBF9F4', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>حفظ</button>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,.04)', padding: '14px 16px', borderRadius: 6, gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7A6F65', marginBottom: 12 }}>الصور</div>
                  {selectedLead.photos_paths ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                      {selectedLead.photos_paths.split(',').map((path, i) => (
                        <a key={i} href={assetUrl(path)} target="_blank" rel="noreferrer" style={{ aspectRatio: '1/1', background: '#3a332b', display: 'block', overflow: 'hidden', borderRadius: 4 }}>
                          <img src={assetUrl(path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#7A6F65' }}>لا توجد صور مرفقة</div>
                  )}
                </div>
              </div>
              {selectedLead.msg && (
                <div style={{ background: 'rgba(255,255,255,.04)', padding: '14px 16px', borderRadius: 6, marginBottom: 24 }}>
                  <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7A6F65', marginBottom: 5 }}>رسالة</div>
                  <div style={{ fontSize: 14, color: '#EDE7DC', lineHeight: 1.7 }}>{selectedLead.msg}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, color: '#7A6F65', marginBottom: 10, letterSpacing: '.12em', textTransform: 'uppercase' }}>تغيير الحالة</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Lead', 'Quoted', 'In Progress', 'Completed'].map(s => (
                    <button key={s} onClick={() => updateLeadStatus(selectedLead.id, s)}
                      style={{ cursor: 'pointer', padding: '9px 18px', border: `1px solid ${selectedLead.status === s ? '#A7824E' : '#38322A'}`, borderRadius: 6, background: selectedLead.status === s ? 'rgba(167,130,78,.15)' : 'transparent', color: selectedLead.status === s ? '#A7824E' : '#7A6F65', fontSize: 13, fontFamily: 'inherit', transition: 'all .2s' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {leadModal && (
        <div className="modal-bg" onClick={() => setLeadModal(null)}>
          <div className="modal" style={{ background: '#2E2922', border: '1px solid #38322A', color: '#EDE7DC', maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setLeadModal(null)}>✕</button>
            <div style={{ padding: '36px 40px' }}>
              <h3 style={{ fontFamily: "'Amiri',serif", fontSize: 22, marginBottom: 24 }}>{leadModal.mode === 'create' ? 'طلب جديد' : 'تعديل الطلب'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="اسم العميل">
                  <input className="form-input" style={adminInput} value={leadModal.data.name} onChange={e => setLeadModal(m => ({ ...m, data: { ...m.data, name: e.target.value } }))} />
                </FormField>
                <FormField label="المشروع">
                  <input className="form-input" style={adminInput} value={leadModal.data.project} onChange={e => setLeadModal(m => ({ ...m, data: { ...m.data, project: e.target.value } }))} />
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="المساحة">
                  <input className="form-input" style={adminInput} value={leadModal.data.area} onChange={e => setLeadModal(m => ({ ...m, data: { ...m.data, area: e.target.value } }))} placeholder="40 m²" />
                </FormField>
                <FormField label="الستيل">
                  <input className="form-input" style={adminInput} value={leadModal.data.style} onChange={e => setLeadModal(m => ({ ...m, data: { ...m.data, style: e.target.value } }))} placeholder="عصري" />
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="البريد الإلكتروني">
                  <input className="form-input" style={adminInput} value={leadModal.data.email} onChange={e => setLeadModal(m => ({ ...m, data: { ...m.data, email: e.target.value } }))} dir="ltr" placeholder="email@example.com" />
                </FormField>
                <FormField label="الهاتف">
                  <input className="form-input" style={adminInput} value={leadModal.data.phone} onChange={e => setLeadModal(m => ({ ...m, data: { ...m.data, phone: e.target.value } }))} dir="ltr" placeholder="+213..." />
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="الموقع">
                  <input className="form-input" style={adminInput} value={leadModal.data.location} onChange={e => setLeadModal(m => ({ ...m, data: { ...m.data, location: e.target.value } }))} />
                </FormField>
                <FormField label="الميزانية">
                  <input className="form-input" style={adminInput} value={leadModal.data.budget} onChange={e => setLeadModal(m => ({ ...m, data: { ...m.data, budget: e.target.value } }))} placeholder="320,000 دج" />
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="عدد الصور">
                  <input className="form-input" type="number" min="0" style={adminInput} value={leadModal.data.photos} onChange={e => setLeadModal(m => ({ ...m, data: { ...m.data, photos: parseInt(e.target.value) || 0 } }))} />
                </FormField>
                <FormField label="الحالة">
                  <select className="form-input" style={adminInput} value={leadModal.data.status} onChange={e => setLeadModal(m => ({ ...m, data: { ...m.data, status: e.target.value } }))}>
                    {['Lead', 'Quoted', 'In Progress', 'Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
              </div>
              <FormField label={leadModal.mode === 'create' ? 'الرسالة' : 'رسالة العميل'}>
                <textarea className="form-textarea" style={{ ...adminInput, minHeight: 80 }} value={leadModal.mode === 'create' ? (leadModal.data.message || '') : (leadModal.data.msg || '')} onChange={e => setLeadModal(m => ({ ...m, data: { ...m.data, [leadModal.mode === 'create' ? 'message' : 'msg']: e.target.value } }))} />
              </FormField>
              <button onClick={saveLead} style={{ width: '100%', padding: '14px', background: '#A7824E', color: '#FBF9F4', border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 6 }}>حفظ</button>
            </div>
          </div>
        </div>
      )}

      {projectModal && (
        <div className="modal-bg" onClick={() => setProjectModal(null)}>
          <div className="modal" style={{ background: '#2E2922', border: '1px solid #38322A', color: '#EDE7DC', maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setProjectModal(null)}>✕</button>
            <div style={{ padding: '36px 40px' }}>
              <h3 style={{ fontFamily: "'Amiri',serif", fontSize: 22, marginBottom: 24 }}>{projectModal.mode === 'create' ? 'مشروع جديد' : 'تعديل المشروع'}</h3>
              <FormField label="العنوان">
                <input className="form-input" style={adminInput} value={projectModal.data.title} onChange={e => setProjectModal(m => ({ ...m, data: { ...m.data, title: e.target.value } }))} />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="التصنيف">
                  <select className="form-input" style={adminInput} value={projectModal.data.cat} onChange={e => setProjectModal(m => ({ ...m, data: { ...m.data, cat: e.target.value } }))}>
                    <option value="">— اختر —</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </FormField>
                <FormField label="الستيل">
                  <input className="form-input" style={adminInput} value={projectModal.data.sub} onChange={e => setProjectModal(m => ({ ...m, data: { ...m.data, sub: e.target.value } }))} placeholder="عصري / كلاسيكي" />
                </FormField>
              </div>
              <FormField label="الموقع">
                <input className="form-input" style={adminInput} value={projectModal.data.loc} onChange={e => setProjectModal(m => ({ ...m, data: { ...m.data, loc: e.target.value } }))} />
              </FormField>
              <FormField label="الصورة">
                <label className="form-input" style={{ ...adminInput, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer', minHeight: 54 }}>
                  <span dir="ltr" style={{ color: projectModal.data.img ? '#EDE7DC' : '#8A8174', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {projectModal.data.img || 'اختار صورة من الجهاز'}
                  </span>
                  <span style={{ flexShrink: 0, color: '#A7824E', fontSize: 13 }}>اختيار</span>
                  <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleProjectImageChange} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
                </label>
                {projectModal.data.img && (
                  <div style={{ marginTop: 10, height: 140, borderRadius: 6, background: `#3a332b url(${assetUrl(projectModal.data.img)}) center/cover`, border: '1px solid #4a4238' }} />
                )}
              </FormField>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#EDE7DC', marginBottom: 24, cursor: 'pointer' }}>
                <input type="checkbox" checked={projectModal.data.live} onChange={e => setProjectModal(m => ({ ...m, data: { ...m.data, live: e.target.checked } }))} />
                عرض في الموقع (مباشر)
              </label>
              <button onClick={saveProject} style={{ width: '100%', padding: '14px', background: '#A7824E', color: '#FBF9F4', border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 6 }}>حفظ</button>
            </div>
          </div>
        </div>
      )}

      {serviceModal && (
        <div className="modal-bg" onClick={() => setServiceModal(null)}>
          <div className="modal" style={{ background: '#2E2922', border: '1px solid #38322A', color: '#EDE7DC', maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setServiceModal(null)}>✕</button>
            <div style={{ padding: '36px 40px' }}>
              <h3 style={{ fontFamily: "'Amiri',serif", fontSize: 22, marginBottom: 24 }}>{serviceModal.mode === 'create' ? 'خدمة جديدة' : 'تعديل الخدمة'}</h3>
              <FormField label="الرقم">
                <input className="form-input" style={adminInput} value={serviceModal.data.n} onChange={e => setServiceModal(m => ({ ...m, data: { ...m.data, n: e.target.value } }))} placeholder="01" />
              </FormField>
              <FormField label="العنوان">
                <input className="form-input" style={adminInput} value={serviceModal.data.t} onChange={e => setServiceModal(m => ({ ...m, data: { ...m.data, t: e.target.value } }))} />
              </FormField>
              <FormField label="الوصف">
                <textarea className="form-textarea" style={{ ...adminInput, minHeight: 90 }} value={serviceModal.data.d} onChange={e => setServiceModal(m => ({ ...m, data: { ...m.data, d: e.target.value } }))} />
              </FormField>
              <FormField label="الوسم">
                <input className="form-input" style={adminInput} value={serviceModal.data.tag} onChange={e => setServiceModal(m => ({ ...m, data: { ...m.data, tag: e.target.value } }))} placeholder="داخلي · مصقول" />
              </FormField>
              <button onClick={saveService} style={{ width: '100%', padding: '14px', background: '#A7824E', color: '#FBF9F4', border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 6 }}>حفظ</button>
            </div>
          </div>
        </div>
      )}

      {categoryModal && (
        <div className="modal-bg" onClick={() => setCategoryModal(null)}>
          <div className="modal" style={{ background: '#2E2922', border: '1px solid #38322A', color: '#EDE7DC', maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setCategoryModal(null)}>✕</button>
            <div style={{ padding: '36px 40px' }}>
              <h3 style={{ fontFamily: "'Amiri',serif", fontSize: 22, marginBottom: 24 }}>{categoryModal.mode === 'create' ? 'تصنيف جديد' : 'تعديل التصنيف'}</h3>
              <FormField label="اسم التصنيف">
                <input className="form-input" style={adminInput} value={categoryModal.data.name} onChange={e => setCategoryModal(m => ({ ...m, data: { ...m.data, name: e.target.value } }))} />
              </FormField>
              <FormField label="وصف التصنيف">
                <textarea className="form-textarea" style={{ ...adminInput, minHeight: 60 }} value={categoryModal.data.desc} onChange={e => setCategoryModal(m => ({ ...m, data: { ...m.data, desc: e.target.value } }))} />
              </FormField>
              <FormField label="سعر المتر (دج)">
                <input type="number" className="form-input" style={adminInput} value={categoryModal.data.price_per_meter} onChange={e => setCategoryModal(m => ({ ...m, data: { ...m.data, price_per_meter: parseInt(e.target.value) || 0 } }))} />
              </FormField>
              <button onClick={saveCategory} style={{ width: '100%', padding: '14px', background: '#A7824E', color: '#FBF9F4', border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 6 }}>حفظ</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-bg" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ background: '#2E2922', border: '1px solid #38322A', color: '#EDE7DC', maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '36px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚠</div>
              <h3 style={{ fontFamily: "'Amiri',serif", fontSize: 20, marginBottom: 10 }}>تأكيد الحذف</h3>
              <p style={{ fontSize: 14, color: '#7A6F65', marginBottom: 28, lineHeight: 1.6 }}>هل تريد حذف «{confirmDelete.title}»؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '12px', background: 'transparent', color: '#7A6F65', border: '1px solid #38322A', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
                <button onClick={handleDelete} style={{ flex: 1, padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>حذف</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
