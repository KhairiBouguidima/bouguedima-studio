import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { API } from '../config'

export default function Portfolio() {
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [active, setActive] = useState('الكل')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch(`${API}/projects`).then(r => r.json()).then(setProjects).catch(() => {})
    fetch(`${API}/categories`).then(r => r.json()).then(data => {
      setCategories([{id: 0, name: 'الكل'}, ...data])
    }).catch(() => {})
  }, [])

  const filtered = active === 'الكل' ? projects : projects.filter(p => p.cat === active)

  return (
    <div>
      <div className="noise-overlay" />
      <Navbar />

      {/* HEADER */}
      <div className="portfolio-header">
        <div className="portfolio-header-inner">
          <div className="section-tag"><span/>من خدمتنا</div>
          <h1 style={{fontFamily:"'Amiri',serif",fontWeight:500,fontSize:'clamp(36px,5vw,64px)',lineHeight:1.04,margin:0,maxWidth:720}}>
            خدمة في الحيطان<br/>و الأرضيات و الواجهات.
          </h1>
          <p style={{fontSize:16,lineHeight:1.7,color:'#5C544A',maxWidth:520,margin:'24px 0 0'}}>كل سطح هوني تحضّر و تجصّص و تصقل باليد. نقّي حسب البلاصة ولا الستيل.</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="portfolio-filters">
        <div className="portfolio-filters-inner">
          {categories.map(c => (
            <button
              key={c.id}
              className={`filter-btn${active === c.name ? ' active' : ''}`}
              onClick={() => setActive(c.name)}
            >
              {c.name}
            </button>
          ))}
          {categories.length === 0 && ['الكل', 'جبس', 'ميكروسمنت', 'واجهات'].map(c => (
            <button key={c} className={`filter-btn${active === c ? ' active' : ''}`} onClick={() => setActive(c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* MASONRY GRID */}
      <div style={{maxWidth:1280,margin:'0 auto',padding:'48px 28px 90px'}}>
        <div className="masonry">
          {filtered.length > 0 ? filtered.map(p => (
            <div key={p.id} className="masonry-item" onClick={() => setSelected(p)}>
              <img src={p.img} alt={p.title} loading="lazy" />
              <div className="masonry-caption">
                <div className="masonry-cat">{p.cat} · {p.sub}</div>
                <div className="masonry-title">{p.title}</div>
                <div className="masonry-loc">{p.loc}</div>
              </div>
              <div style={{position:'absolute',top:14,right:14,width:34,height:34,borderRadius:'50%',background:'rgba(247,242,233,.92)',display:'grid',placeItems:'center',fontSize:15,color:'#A7824E',opacity:0,transition:'opacity .3s'}}
                   onMouseEnter={e => e.currentTarget.style.opacity=1}
                   onMouseLeave={e => e.currentTarget.style.opacity=0}
              >↗</div>
            </div>
          )) : (
            // Skeleton placeholders
            [1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="masonry-item" style={{aspectRatio: i%3===0?'1':'4/3', background:'#DED6C7', opacity:.5}}/>
            ))
          )}
        </div>
      </div>

      {/* CASE STUDY MODAL */}
      {selected && (
        <div className="modal-bg" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            <div className="modal-hero" style={{background:`#3a332b url(${selected.img}) center/cover`}}>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg, rgba(20,16,12,.55), rgba(20,16,12,.05) 45%)'}}/>
              <div style={{position:'absolute',left:30,bottom:26,color:'#F7F2E9'}}>
                <div style={{fontSize:10,letterSpacing:'.24em',textTransform:'uppercase',color:'#E2CFA9'}}>{selected.cat}</div>
                <div style={{fontFamily:"'Amiri',serif",fontSize:34,marginTop:6}}>{selected.title}</div>
              </div>
            </div>
            <div className="modal-body">
              <p style={{fontSize:16,lineHeight:1.8,color:'#5C544A',maxWidth:620}}>
                سطح قديم تبدّل في أربع أيام خدمة. تحت، الثلاث مراحل اللي يعدّي بيهم كل مشروع — مصوّرين في الشانتيي.
              </p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18,marginTop:34}}>
                {[{n:1,t:'التحضير',d:'تنظيف السطح و تطبيق الأساس'},
                  {n:2,t:'التطبيق',d:'وضع طبقات الجبس باليد واحدة واحدة'},
                  {n:3,t:'التشطيب',d:'الصقل و الحماية النهائية'}].map(st => (
                  <div key={st.n}>
                    <div style={{aspectRatio:'1/1',background:'#BCAB92',position:'relative',overflow:'hidden'}}>
                      <div style={{position:'absolute',top:12,left:12,width:26,height:26,borderRadius:'50%',background:'#A7824E',color:'#FBF9F4',display:'grid',placeItems:'center',fontSize:12,fontFamily:"'Amiri',serif"}}>{st.n}</div>
                    </div>
                    <div style={{fontFamily:"'Amiri',serif",fontSize:18,marginTop:14}}>{st.t}</div>
                    <div style={{fontSize:13,lineHeight:1.6,color:'#6B6258',marginTop:6}}>{st.d}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:40,marginTop:36,paddingTop:28,borderTop:'1px solid #DED6C7',flexWrap:'wrap'}}>
                <div><div style={{fontSize:11,letterSpacing:'.18em',textTransform:'uppercase',color:'#8A8174'}}>البلاصة</div><div style={{fontSize:15,color:'#29251F',marginTop:5}}>{selected.loc}</div></div>
                <div><div style={{fontSize:11,letterSpacing:'.18em',textTransform:'uppercase',color:'#8A8174'}}>التصنيف</div><div style={{fontSize:15,color:'#29251F',marginTop:5}}>{selected.sub}</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
