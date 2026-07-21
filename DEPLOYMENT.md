# دليل النشر — Bouguedima Studio

Architecture:

```text
Frontend (Vercel)  ──HTTPS──▶  api.elwarsha.tn (Oracle VM)
                                    │
                                    ├── Nginx (443)
                                    ├── FastAPI (Docker)
                                    └── PostgreSQL (Docker)
```

---

## الحالة الحالية للمشروع

| المكون | الحالة |
|--------|--------|
| Backend FastAPI + PostgreSQL | ✅ جاهز |
| Dockerfile backend + frontend | ✅ جاهز |
| docker-compose.yml (local) | ✅ جاهز |
| docker-compose.prod.yml (Oracle) | ✅ جاهز |
| CI (lint, tests, build) | ✅ جاهز |
| CD (deploy SSH) | ✅ جاهز |
| Frontend → Vercel | ⚙️ يحتاج إعداد Vercel |
| Git repo | ❌ لم يُنشأ بعد |

---

## المرحلة 1 — GitHub (من جهازك)

```powershell
cd "c:\Users\khair\Desktop\bilel app"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

> أنشئ الـ repo على GitHub أولاً (Private أو Public).

---

## المرحلة 2 — Oracle Cloud VM

### 2.1 إنشاء الـ VM
- Ubuntu 24.04 LTS
- Always Free Shape
- SSH Key (بدون password)

### 2.2 فتح المنافذ (Security List)
- **22** — SSH
- **80** — HTTP
- **443** — HTTPS

### 2.3 الاتصال والإعداد

```bash
ssh ubuntu@YOUR_PUBLIC_IP
bash deploy/setup-server.sh
# سجّل خروجًا ثم ادخل مرة أخرى
exit
ssh ubuntu@YOUR_PUBLIC_IP
```

### 2.4 Clone المشروع

```bash
cd /opt/studio
git clone https://github.com/USERNAME/REPO.git .
cp .env.production.example .env
nano .env   # عدّل SECRET_KEY, ADMIN_PASSWORD_HASH, POSTGRES_PASSWORD, ALLOWED_ORIGINS
```

**توليد القيم:**

```bash
# SECRET_KEY
python3 -c "import secrets; print(secrets.token_hex(32))"

# ADMIN_PASSWORD_HASH (على جهازك المحلي في backend venv)
python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('your-password'))"
```

### 2.5 تشغيل Backend

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker ps
curl http://127.0.0.1:8000/api/services
```

### 2.6 Nginx + HTTPS

```bash
# عدّل deploy/nginx-api.conf: استبدل api.elwarsha.tn بـ domain حقيقي
sudo cp deploy/nginx-api.conf /etc/nginx/sites-available/studio-api
sudo ln -sf /etc/nginx/sites-available/studio-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# HTTPS
sudo certbot --nginx -d api.elwarsha.tn
```

---

## المرحلة 3 — Vercel (Frontend)

1. [vercel.com](https://vercel.com) → Import GitHub repo
2. **Root Directory:** `frontend`
3. **Framework:** Vite
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Environment Variable:**

```env
VITE_API_URL=https://api.elwarsha.tn
```

7. Deploy

> أضف domain Vercel في `ALLOWED_ORIGINS` على السيرفر (مثلاً `https://elwarsha.tn`).

---

## المرحلة 4 — GitHub Secrets (CI/CD)

**Settings → Secrets and variables → Actions**

| Secret | القيمة |
|--------|--------|
| `SSH_HOST` أو `VPS_HOST` | IP الـ Oracle VM |
| `SSH_USER` أو `VPS_USER` | `ubuntu` |
| `SSH_PRIVATE_KEY` أو `VPS_SSH_KEY` | محتوى المفتاح الخاص SSH |
| `VPS_APP_DIR` | `/opt/studio` (اختياري) |

بعد كل `git push origin main`:
1. CI يشغّل tests + lint
2. CD يتصل بالـ VM عبر SSH
3. `git pull` + `docker compose -f docker-compose.prod.yml up -d --build`

---

## المرحلة 5 — DNS

| Record | Type | Value |
|--------|------|-------|
| `api.elwarsha.tn` | A | Oracle VM IP |
| `elwarsha.tn` | CNAME | Vercel (أو A حسب Vercel) |

---

## أوامر مفيدة على السيرفر

```bash
# Logs
docker compose -f docker-compose.prod.yml logs -f backend

# Restart
docker compose -f docker-compose.prod.yml restart backend

# Update يدوي
cd /opt/studio && git pull && docker compose -f docker-compose.prod.yml up -d --build
```

---

## Troubleshooting

| المشكلة | الحل |
|---------|------|
| CORS error من Vercel | أضف domain Vercel في `ALLOWED_ORIGINS` |
| 502 Bad Gateway | `docker ps` — تأكد backend شغّال |
| Certbot فشل | تأكد DNS يشير للـ VM قبل certbot |
| Docker permission denied | `sudo usermod -aG docker $USER` ثم re-login |
