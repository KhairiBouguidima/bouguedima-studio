import { useNavigate } from 'react-router-dom'

const WHATSAPP_URL = 'https://wa.me/21350756444'
const TIKTOK_URL = 'https://www.tiktok.com/@bouguedima'

export default function Footer() {
  const navigate = useNavigate()
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div style={{fontFamily:"'Amiri',serif",fontSize:20,letterSpacing:'.12em'}}>بوقديمة</div>
          <div style={{fontFamily:"'Amiri',serif",fontSize:16,color:'#A7824E',marginTop:6}}>بوقديمة لديكورات الجبس</div>
          <p style={{fontSize:13,lineHeight:1.7,color:'#6B6258',marginTop:18,maxWidth:260}}>ديكور الجبس و الزخرفة، كل شي حسب الطلب على يد صنايعي واحد.</p>
        </div>
        <div>
          <div style={{fontSize:11,letterSpacing:'.2em',textTransform:'uppercase',color:'#A7824E',marginBottom:16}}>الورشة</div>
          <span className="link-text" onClick={() => navigate('/portfolio')}>خدمتنا</span>
          <span className="link-text" onClick={() => navigate('/quote')}>اطلب عرض سعر</span>
          <span className="link-text" onClick={() => navigate('/admin')}>دخول الورشة</span>
        </div>
        <div>
          <div style={{fontSize:11,letterSpacing:'.2em',textTransform:'uppercase',color:'#A7824E',marginBottom:16}}>تواصل</div>
          <a className="link-text" href={WHATSAPP_URL} target="_blank" rel="noreferrer" dir="ltr">05 07 56 44 44</a>
          <a className="link-text" href={TIKTOK_URL} target="_blank" rel="noreferrer">TikTok</a>
          <span className="link-text">سطيف · الجزائر</span>
        </div>
        <div>
          <div style={{fontSize:11,letterSpacing:'.2em',textTransform:'uppercase',color:'#A7824E',marginBottom:16}}>أوقات العمل</div>
          <span className="link-text">السبت–الخميس · 8–18</span>
          <span className="link-text">نجاوب في 48 ساعة</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 بوقديمة لديكورات الجبس. جميع الحقوق محفوظة.</span>
        <span style={{letterSpacing:'.14em',textTransform:'uppercase'}}>معمول باليد</span>
      </div>
    </footer>
  )
}
