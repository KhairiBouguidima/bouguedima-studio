import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { API } from '../config'

const SLIDES = [
  { bg: '#3a332b' },
  { bg: '#4a3e30' },
  { bg: '#2e2820' },
]

const DISCIPLINES = ['ماربورينو', 'ميكروسمنت', 'تادلاكت', 'كرانيش', 'ترافرتين', 'واجهات']

export default function Home() {
  const navigate = useNavigate()
  const [slide, setSlide] = useState(0)
  const [ba, setBa] = useState(50)
  const [services, setServices] = useState([])

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    fetch(`${API}/services`)
      .then(r => r.json())
      .then(setServices)
      .catch(() => {})
  }, [])

  return (
    <div>
      <div className="noise-overlay" />
      <Navbar />

      {/* HERO */}
      <div className="hero">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className="hero-slide"
            style={{ background: s.bg, opacity: i === slide ? 1 : 0 }}
          />
        ))}
        <div className="hero-overlay-radial" />
        <div className="hero-overlay-linear" />

        <div style={{position:'absolute',top:22,right:26,display:'flex',alignItems:'center',gap:10,color:'rgba(251,249,244,.7)',fontSize:10,letterSpacing:'.28em',textTransform:'uppercase'}}>
          <span style={{width:30,height:1,background:'rgba(251,249,244,.4)'}}></span>فيديو · لقطات من الخدمة
        </div>

        <div className="hero-content">
          <div style={{maxWidth:760}}>
            <div className="hero-tag"><span/>ديكور الجبس · زخرفة فنية</div>
            <h1>حيطان و أسقف<br/>معمولين<br/><em>بيد وحدة.</em></h1>
            <p className="hero-desc">جبس فيني، ميكروسمون، كرانيش مصبوبين باليد و واجهات — كل شي يتعمل حسب الطلب على يد صنايعي واحد، هو اللي يجاوبك، يقيس، و يكمّل كل حيط بيدو.</p>
            <div className="hero-btns">
              <button className="btn-primary" onClick={() => navigate('/quote')}>اطلب السومة</button>
              <button className="btn-outline" onClick={() => navigate('/portfolio')}>شوف خدمتنا</button>
            </div>
            <div className="hero-dots">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setSlide(i)}
                  style={{
                    cursor:'pointer', height:8,
                    width: i === slide ? 28 : 8,
                    borderRadius:99,
                    background: i === slide ? '#FBF9F4' : 'rgba(251,249,244,.4)',
                    transition: 'all .4s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="scroll-cue">
          <span>أنزل لتحت</span>
          <span className="line" />
        </div>
      </div>

      {/* DISCIPLINE STRIP */}
      <div className="discipline-strip">
        <div className="discipline-strip-inner">
          {DISCIPLINES.map((d, i) => (
            <span key={d}>{d}{i < DISCIPLINES.length - 1 && <><span className="sep"> / </span></>}</span>
          ))}
        </div>
      </div>

      {/* ARTISAN */}
      <div className="artisan">
        <div className="artisan-img" style={{backgroundImage:'url(/assets/hero-2.jpg)'}}>
          <div className="artisan-img-overlay" />
        </div>
        <div>
          <div className="section-tag"><span/>الصنايعي</div>
          <h2 className="section-h2">صنايعي واحد. كل طبقة،<br/>من البداية للنهاية.</h2>
          <p style={{fontSize:16,lineHeight:1.8,color:'#5C544A',margin:'26px 0 0'}}>ما فماش مقاولين آخرين، ما فماش فرق تتبدّل. اليد اللي تعطيك السومة هي نفس اليد اللي تحطّ آخر طبقة — يعني تشطيب ثابت، وقت محدّد بالصح، و شخص واحد تحكي معاه يهتمّ بالضو كيفاش يطيح على حيطك.</p>
          <p style={{fontSize:16,lineHeight:1.8,color:'#5C544A',margin:'18px 0 0'}}>عشرين سنة و أنا نخدم في الجير و الجبس و الإسمنت، باش نعمل أسطح تتلمس بنفس الإتقان اللي تتشاف بيه.</p>
          <div className="artisan-stats">
            <div><div className="stat-num">20+</div><div className="stat-label">سنة خبرة</div></div>
            <div><div className="stat-num">340</div><div className="stat-label">حيط مكمّل</div></div>
            <div><div className="stat-num">1</div><div className="stat-label">يد وحدة</div></div>
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <div className="services-section">
        <div className="services-inner">
          <div className="services-header">
            <div>
              <div className="section-tag"><span/>شنوة نعمل</div>
              <h2 className="section-h2">ستة اختصاصات، جودة وحدة.</h2>
            </div>
            <div onClick={() => navigate('/quote')} style={{cursor:'pointer',fontSize:13,letterSpacing:'.06em',color:'#29251F',borderBottom:'1px solid #A7824E',paddingBottom:4}}>احكي معايا على مشروعك ←</div>
          </div>
          <div className="services-grid">
            {services.length > 0 ? services.map(s => (
              <div className="service-card" key={s.id}>
                <div className="service-num">{s.n}</div>
                <h3 className="service-title">{s.t}</h3>
                <p className="service-desc">{s.d}</p>
                <div className="service-tag">{s.tag}</div>
              </div>
            )) : [1,2,3,4,5,6].map(i => (
              <div className="service-card" key={i} style={{opacity:.4}}>
                <div className="service-num">0{i}</div>
                <div className="service-title" style={{background:'#DED6C7',height:28,marginTop:20,width:'60%',borderRadius:4}}/>
                <div className="service-desc" style={{background:'#DED6C7',height:60,marginTop:14,borderRadius:4}}/>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BEFORE / AFTER */}
      <div className="ba-section">
        <div style={{textAlign:'center',marginBottom:46}}>
          <div className="section-tag" style={{justifyContent:'center'}}>
            <span/>الفرق قبل و بعد<span/>
          </div>
          <h2 className="section-h2">اسحب باش تشوف التشطيب.</h2>
        </div>
        <div className="ba-container">
          <div className="ba-before" style={{backgroundImage:'url(/assets/gallery-1.jpg)',filter:'grayscale(60%)'}}/>
          <div
            className="ba-after"
            style={{
              backgroundImage:'url(/assets/gallery-2.jpg)',
              clipPath:`polygon(${ba}% 0, 100% 0, 100% 100%, ${ba}% 100%)`
            }}
          />
          <div className="ba-handle" style={{left:`${ba}%`}}/>
          <div className="ba-circle" style={{left:`${ba}%`}}>⟷</div>
          <input type="range" min="0" max="100" value={ba} onChange={e => setBa(+e.target.value)} className="ba-range" />
          <div style={{position:'absolute',left:18,top:16,fontFamily:'ui-monospace,monospace',fontSize:11,color:'#F4F0E8',letterSpacing:'.1em',background:'rgba(20,16,12,.45)',padding:'5px 10px'}}>قبل — حيط خام</div>
          <div style={{position:'absolute',right:18,top:16,fontFamily:'ui-monospace,monospace',fontSize:11,color:'#3a2c18',letterSpacing:'.1em',background:'rgba(247,242,233,.6)',padding:'5px 10px'}}>بعد — سقف جبس بالضو</div>
        </div>
      </div>

      {/* CTA BAND */}
      <div className="cta-band">
        <div style={{position:'absolute',inset:0,opacity:.5,background:'radial-gradient(100% 140% at 80% 0%, #5a4c3a, #241f1a 70%)'}}/>
        <div style={{position:'absolute',inset:0,opacity:.35,mixBlendMode:'overlay',backgroundImage:'repeating-linear-gradient(100deg, rgba(255,245,225,.12) 0 2px, transparent 2px 12px)'}}/>
        <div className="cta-band-inner">
          <h2>عندك حيط في بالك؟</h2>
          <p>ابعثلي شويّة تصاور و قياسات تقريبية. نشوف كل طلب بروحي و نجاوبك في 48 ساعة — بلا سونتر داتيل، بلا روبوات.</p>
          <button className="btn-primary" style={{marginTop:38,display:'inline-block'}} onClick={() => navigate('/quote')}>ابدأ طلبك</button>
        </div>
      </div>

      <Footer />
    </div>
  )
}
