import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import apiClient from '../api/client'
const TONES = [
  { name: 'عاجي', tone: '#F5ECD7' },
  { name: 'رمادي دافئ', tone: '#C4BBAF' },
  { name: 'بيج', tone: '#D4BA96' },
  { name: 'أبيض', tone: '#F8F5F0' },
  { name: 'رمادي بارد', tone: '#B8BEC5' },
  { name: 'ترابي', tone: '#9A8572' },
]

export default function Quote() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [step, setStep] = useState(1)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [quote, setQuote] = useState({ type:'', area:'40', unit:'m²', style:'', photos:0, photos_paths:'', name:'', email:'', phone:'', message:'' })

  const canNext = () => {
    if (step === 1) return !!quote.type
    if (step === 2) return !!quote.area
    if (step === 3) return !!quote.style
    return true
  }

  useEffect(() => {
    apiClient.get('/categories')
      .then(({ data }) => setCategories(data))
      .catch(() => {})
  }, [])

  const estimatedPrice = useMemo(() => {
    const cat = categories.find(c => c.name === quote.type)
    const pricePerMeter = cat ? cat.price_per_meter : 0
    const area = parseFloat(quote.area) || 0
    return pricePerMeter * area
  }, [categories, quote.type, quote.area])

  const submit = async () => {
    setSubmitting(true)
    try {
      let photos_paths = ""
      if (selectedFiles.length > 0) {
        const formData = new FormData()
        selectedFiles.forEach(f => formData.append('files', f))
        const { data: uploadData } = await apiClient.post('/upload', formData)
        photos_paths = uploadData.paths.join(",")
      }

      const finalQuote = { 
        ...quote, 
        photos: selectedFiles.length, 
        photos_paths, 
        budget: estimatedPrice > 0 ? `${estimatedPrice.toLocaleString()} دج` : '—'
      }

      await apiClient.post('/quotes', finalQuote)
      setSent(true)
    } catch {
      alert('حصل خطأ، حاول مرة أخرى')
    }
    setSubmitting(false)
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 8)
    setSelectedFiles(files)
    setQuote(q => ({ ...q, photos: files.length }))
  }

  const pct = `${((step - 1) / 4) * 100}%`

  return (
    <div>
      <div className="noise-overlay" />
      <Navbar />
      <div className="quote-page">
        <div className="quote-inner">
          {sent ? (
            <div style={{textAlign:'center',padding:'60px 20px'}}>
              <div style={{width:74,height:74,borderRadius:'50%',background:'#A7824E',color:'#FBF9F4',display:'grid',placeItems:'center',fontSize:32,margin:'0 auto'}}>✓</div>
              <h1 style={{fontFamily:"'Amiri',serif",fontWeight:500,fontSize:'clamp(30px,4.4vw,48px)',margin:'30px 0 0'}}>وصلني طلبك.</h1>
              <p style={{fontSize:16,lineHeight:1.8,color:'#5C544A',maxWidth:480,margin:'20px auto 0'}}>يعيشك. نشوف كل طلب بروحي و نجاوبك على <strong style={{color:'#29251F'}}>{quote.email}</strong> في <strong style={{color:'#29251F'}}>48 ساعة</strong> بالخطوات الجاية و تقدير أوّلي للسومة.</p>
              <button className="btn-outline" style={{color:'#29251F',border:'1px solid #A7824E',marginTop:36,padding:'15px 32px',fontSize:13,letterSpacing:'.08em',textTransform:'uppercase',cursor:'pointer',fontFamily:'inherit',background:'transparent'}} onClick={() => navigate('/')}>ارجع للرئيسية</button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{textAlign:'center',marginBottom:14}}>
                <div className="section-tag" style={{justifyContent:'center'}}><span/>اطلب السومة<span/></div>
                <h1 style={{fontFamily:"'Amiri',serif",fontWeight:500,fontSize:'clamp(28px,3.8vw,40px)',margin:'14px 0 0'}}>احكيلي على حيطك.</h1>
              </div>

              {/* Stepper */}
              <div className="stepper">
                {['النوع','المساحة','اللون','الصور','التواصل'].map((label, i) => {
                  const num = i + 1
                  const done = step > num
                  const active = step === num
                  return (
                    <div key={label} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                      <div className="step-dot" style={{background: done ? '#A7824E' : active ? '#29251F' : '#DED6C7', color: done||active ? '#FBF9F4' : '#8A8174'}}>{done ? '✓' : num}</div>
                      <div style={{fontSize:10,letterSpacing:'.14em',textTransform:'uppercase',color: active ? '#29251F' : '#8A8174'}}>{label}</div>
                    </div>
                  )
                })}
              </div>
              <div className="stepper-bar">
                <div className="stepper-progress" style={{width: pct}} />
              </div>

              {/* Step Content */}
              <div className="step-box">
                {step === 1 && (
                  <div>
                    <div className="step-title">شنوة نوع المشروع؟</div>
                    <div className="step-sub">نقّي التشطيب اللي أقرب لللي تخيّلتو.</div>
                    <div className="type-grid">
                      {categories.map(c => (
                        <div key={c.id} className={`type-option${quote.type === c.name ? ' selected' : ''}`} onClick={() => setQuote(q => ({...q, type: c.name}))}>
                          <div style={{flexShrink:0,width:20,height:20,borderRadius:'50%',border:`1px solid ${quote.type===c.name?'#A7824E':'#DED6C7'}`,background:quote.type===c.name?'#A7824E':'transparent',marginTop:2}}/>
                          <div>
                            <div style={{fontFamily:"'Amiri',serif",fontSize:17,color:'#29251F'}}>{c.name}</div>
                            <div style={{fontSize:12.5,lineHeight:1.55,color:'#8A8174',marginTop:4}}>{c.desc || 'بدون وصف'}</div>
                            {c.price_per_meter > 0 && (
                                <div style={{fontSize:12,color:'#A7824E',marginTop:4,fontFamily:'Tajawal'}}>السعر: {c.price_per_meter} دج / م²</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <div className="step-title">قدّاش مساحة السطح تقريبًا؟</div>
                    <div className="step-sub">التقدير يكفي — نأكّد القياس في البلاصة.</div>
                    <div style={{display:'flex',alignItems:'flex-end',gap:18,justifyContent:'center',margin:'10px 0 8px'}}>
                      <input type="number" value={quote.area} onChange={e => setQuote(q=>({...q,area:e.target.value}))}
                        style={{width:200,fontFamily:"'Amiri',serif",fontSize:56,color:'#29251F',background:'transparent',border:'none',borderBottom:'2px solid #A7824E',textAlign:'center',padding:'6px 0',outline:'none'}}/>
                      <div style={{display:'flex',border:'1px solid #DED6C7',marginBottom:14}}>
                        {['m²','ft²'].map(u => (
                          <div key={u} onClick={() => setQuote(q=>({...q,unit:u}))}
                            style={{cursor:'pointer',padding:'10px 16px',fontSize:13,background:quote.unit===u?'#29251F':'transparent',color:quote.unit===u?'#FBF9F4':'#5C544A',transition:'all .2s'}}>
                            {u}
                          </div>
                        ))}
                      </div>
                    </div>
                    <input type="range" min="2" max="400" value={quote.area} onChange={e => setQuote(q=>({...q,area:e.target.value}))}
                      style={{width:'100%',marginTop:24,accentColor:'#A7824E'}}/>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#A29A8C',marginTop:6}}>
                      <span>حيط صغير</span><span>فيلا كاملة</span>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <div className="step-title">أنهي لون يعجبك؟</div>
                    <div className="step-sub">نقطة بداية — نحدّدو الدرجة بالضبط مع بعضنا.</div>
                    <div className="color-grid">
                      {TONES.map(o => (
                        <div key={o.name} className="color-swatch" onClick={() => setQuote(q=>({...q,style:o.name}))}>
                          <div className={`color-swatch-box${quote.style===o.name?' selected':''}`} style={{background:o.tone}}>
                            <div style={{position:'absolute',inset:0,opacity:.4,mixBlendMode:'multiply',backgroundImage:'repeating-linear-gradient(115deg, rgba(80,60,40,.16) 0 2px, transparent 2px 9px)'}}/>
                          </div>
                          <div className="color-swatch-label" style={{color:quote.style===o.name?'#29251F':'#8A8174'}}>{o.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <div className="step-title">ورّيني البلاصة.</div>
                    <div className="step-sub">شويّة تصاور بالتيليفون للحيط تعاوني باش نعطيك سومة صحيحة.</div>
                    <div style={{position:'relative',cursor:'pointer',border:'2px dashed #C2B6A2',background:'#F4F0E8',padding:34,textAlign:'center'}}>
                      <input type="file" multiple accept="image/png, image/jpeg" onChange={handleFileChange} style={{position:'absolute',inset:0,opacity:0,cursor:'pointer'}} />
                      <div style={{fontSize:26,color:'#A7824E'}}>↑</div>
                      <div style={{fontSize:14,color:'#5C544A',marginTop:8}}>اضغط باش تزيد تصاور</div>
                      <div style={{fontSize:12,color:'#A29A8C',marginTop:4}}>JPG أو PNG · حتى 8 صور</div>
                    </div>
                    {selectedFiles.length > 0 && (
                      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginTop:16}}>
                        {selectedFiles.map((f,i) => (
                          <div key={i} style={{aspectRatio:'1/1',background:`#C4BBAF`,position:'relative',overflow:'hidden'}}>
                            <img src={URL.createObjectURL(f)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                            <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,0.5)',padding:'4px',fontFamily:'ui-monospace,monospace',fontSize:9,color:'#FBF9F4',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {step === 5 && (
                  <div>
                    <div className="step-title">كيفاش نتواصل معاك؟</div>
                    <div className="step-sub">نجاوبك بروحي في 48 ساعة.</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                      <div style={{gridColumn:'span 2'}}>
                        <label className="form-label">الاسم الكامل</label>
                        <input className="form-input" value={quote.name} onChange={e=>setQuote(q=>({...q,name:e.target.value}))} placeholder="اسمك"/>
                      </div>
                      <div>
                        <label className="form-label">البريد الإلكتروني</label>
                        <input className="form-input" value={quote.email} onChange={e=>setQuote(q=>({...q,email:e.target.value}))} placeholder="you@email.com"/>
                      </div>
                      <div>
                        <label className="form-label">الهاتف</label>
                        <input className="form-input" value={quote.phone} onChange={e=>setQuote(q=>({...q,phone:e.target.value}))} placeholder="+213 …"/>
                      </div>
                      <div style={{gridColumn:'span 2'}}>
                        <label className="form-label">فمّا حاجة أخرى؟</label>
                        <textarea className="form-textarea" value={quote.message} onChange={e=>setQuote(q=>({...q,message:e.target.value}))} placeholder="الوقت، البلاصة، أسئلة…"/>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:24,flexWrap:'wrap',marginTop:22,padding:'16px 18px',background:'#F0EADE',borderRight:'2px solid #A7824E'}}>
                      <div style={{fontSize:13,color:'#6B6258'}}><span style={{color:'#8A8174'}}>المشروع:</span> {quote.type}</div>
                      <div style={{fontSize:13,color:'#6B6258'}}><span style={{color:'#8A8174'}}>المساحة:</span> {quote.area} {quote.unit}</div>
                      <div style={{fontSize:13,color:'#6B6258'}}><span style={{color:'#8A8174'}}>اللون:</span> {quote.style}</div>
                      <div style={{fontSize:13,color:'#6B6258'}}><span style={{color:'#8A8174'}}>الصور:</span> {selectedFiles.length}</div>
                    </div>
                    {estimatedPrice > 0 && (
                      <div style={{ marginTop: 24, padding: '20px', background: '#F4F0E8', border: '1px solid #C2B6A2', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 13, color: '#5C544A', marginBottom: 4 }}>السومة التقديرية (حسب المساحة) تبدأ من</div>
                        <div style={{ fontFamily: "'Amiri',serif", fontSize: 32, color: '#A7824E' }}>{estimatedPrice.toLocaleString()} دج</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Nav Buttons */}
              <div className="step-nav">
                <button className="btn-back" onClick={() => step > 1 ? setStep(s=>s-1) : navigate('/')}>→ رجوع</button>
                {step < 5
                  ? <button className="btn-next" onClick={() => setStep(s=>s+1)} disabled={!canNext()}>كمّل ←</button>
                  : <button className="btn-next" onClick={submit} disabled={submitting || !quote.name}>{submitting ? '…' : 'ابعث الطلب'}</button>
                }
              </div>
              <div style={{textAlign:'center',fontSize:12,color:'#A29A8C',marginTop:22}}>🔒 تصاورك و معلوماتك يشوفهم الصنايعي وحدو. بلا رسائل مزعجة، عمرها.</div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
