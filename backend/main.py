import os
import uuid
from datetime import datetime
from typing import List

from fastapi import Depends, FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from dotenv import load_dotenv
load_dotenv()

from logging_config import setup_logging
setup_logging()

from auth import create_token, ensure_default_admin, require_admin, verify_password
from db import db_cursor, init_db
from schemas import (
    Category, CategoryCreate, CategoryUpdate, Lead, LeadCreate, LeadUpdate, LoginRequest, LoginResponse, Project,
    ProjectCreate, ProjectUpdate, QuoteSubmit, Service, ServiceCreate, ServiceUpdate, STATUSES,
)
from seed_data import seed_if_empty

app = FastAPI(title="Bouguedima Studio API")

# Serve the uploads directory statically
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()
    ensure_default_admin()
    seed_if_empty()


def relative_when(created_at: str) -> str:
    created = datetime.fromisoformat(created_at)
    delta = datetime.utcnow() - created
    minutes = int(delta.total_seconds() // 60)
    if minutes < 1:
        return "الآن"
    if minutes < 60:
        return f"قبل {minutes} دقيقة"
    hours = minutes // 60
    if hours < 24:
        return f"قبل {hours} ساعة"
    days = hours // 24
    if days < 14:
        return f"قبل {days} يوم"
    weeks = days // 7
    return f"قبل {weeks} أسبوع"


def row_to_lead(row) -> dict:
    d = dict(row)
    d["when"] = relative_when(d["created_at"])
    return d


def row_to_project(row) -> dict:
    d = dict(row)
    d["live"] = bool(d["live"])
    return d

@app.post("/api/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    paths = []
    for file in files:
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join("uploads", unique_name)
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)
        paths.append(f"/uploads/{unique_name}")
    return {"paths": paths}

# ---------- Public: quote submission ----------

@app.post("/api/quotes", response_model=Lead)
def submit_quote(quote: QuoteSubmit):
    initials = "".join([p[0] for p in quote.name.strip().split()[:2]]) or "؟؟"
    now = datetime.utcnow().isoformat(timespec="seconds")
    with db_cursor() as cur:
        cur.execute(
            """INSERT INTO leads (name, initials, project, area, style, status, created_at,
                                   photos, photos_paths, location, budget, msg, email, phone)
               VALUES (%s, %s, %s, %s, %s, 'Lead', %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (quote.name, initials, quote.type, f"{quote.area} {quote.unit}", quote.style, now,
             quote.photos, quote.photos_paths, "", quote.budget, quote.message, quote.email, quote.phone),
        )
        new_id = cur.fetchone()["id"]
        cur.execute("SELECT * FROM leads WHERE id = %s", (new_id,))
        row = cur.fetchone()
    return row_to_lead(row)


# ---------- Public: portfolio ----------

@app.get("/api/projects", response_model=List[Project])
def list_public_projects():
    with db_cursor() as cur:
        cur.execute("SELECT * FROM projects WHERE live = 1")
        rows = cur.fetchall()
    return [row_to_project(r) for r in rows]


@app.get("/api/services", response_model=List[Service])
def list_services():
    with db_cursor() as cur:
        cur.execute("SELECT * FROM services ORDER BY sort_order")
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.get("/api/categories", response_model=List[Category])
def list_categories():
    with db_cursor() as cur:
        cur.execute("SELECT * FROM categories ORDER BY sort_order")
        rows = cur.fetchall()
    return [dict(r) for r in rows]


# ---------- Admin: auth ----------

@app.post("/api/auth/login", response_model=LoginResponse)
def login(body: LoginRequest):
    with db_cursor() as cur:
        cur.execute("SELECT * FROM admin_users WHERE username = %s", (body.username,))
        user = cur.fetchone()
    if user is None or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="اسم المستخدم أو كلمة المرور غير صحيحة")
    return LoginResponse(token=create_token(user["username"]), username=user["username"])


@app.get("/api/auth/me")
def me(username: str = Depends(require_admin)):
    return {"username": username}


# ---------- Admin: leads (CRM) ----------

@app.get("/api/leads", response_model=List[Lead])
def list_leads(username: str = Depends(require_admin)):
    with db_cursor() as cur:
        cur.execute("SELECT * FROM leads ORDER BY created_at DESC")
        rows = cur.fetchall()
    return [row_to_lead(r) for r in rows]


@app.get("/api/leads/{lead_id}", response_model=Lead)
def get_lead(lead_id: int, username: str = Depends(require_admin)):
    with db_cursor() as cur:
        cur.execute("SELECT * FROM leads WHERE id = %s", (lead_id,))
        row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return row_to_lead(row)


@app.post("/api/admin/leads", response_model=Lead)
def create_lead(body: LeadCreate, username: str = Depends(require_admin)):
    if body.status not in STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {STATUSES}")
    initials = "".join([p[0] for p in body.name.strip().split()[:2]]) or "؟؟"
    now = datetime.utcnow().isoformat(timespec="seconds")
    with db_cursor() as cur:
        cur.execute(
            """INSERT INTO leads (name, initials, project, area, style, status, created_at,
                                   photos, photos_paths, location, budget, msg, email, phone)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (body.name, initials, body.project, body.area, body.style, body.status, now,
             body.photos, body.photos_paths, body.location, body.budget, body.message, body.email, body.phone),
        )
        new_id = cur.fetchone()["id"]
        cur.execute("SELECT * FROM leads WHERE id = %s", (new_id,))
        row = cur.fetchone()
    return row_to_lead(row)


@app.patch("/api/leads/{lead_id}", response_model=Lead)
def update_lead(lead_id: int, body: LeadUpdate, username: str = Depends(require_admin)):
    if body.status is not None and body.status not in STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {STATUSES}")
    with db_cursor() as cur:
        cur.execute("SELECT * FROM leads WHERE id = %s", (lead_id,))
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Lead not found")
        updated = dict(row)
        for field in ("name", "project", "area", "style", "status", "budget", "email", "phone", "msg", "location"):
            val = getattr(body, field, None)
            if val is not None:
                updated[field] = val
        if body.photos is not None:
            updated["photos"] = body.photos
        if body.photos_paths is not None:
            updated["photos_paths"] = body.photos_paths
        # Recalculate initials if name changed
        if body.name is not None:
            updated["initials"] = "".join([p[0] for p in body.name.strip().split()[:2]]) or "؟؟"
        cur.execute(
            """UPDATE leads SET name=%s, initials=%s, project=%s, area=%s, style=%s, status=%s,
                               budget=%s, email=%s, phone=%s, msg=%s, photos=%s, photos_paths=%s, location=%s
               WHERE id=%s""",
            (updated["name"], updated["initials"], updated["project"], updated["area"],
             updated["style"], updated["status"], updated["budget"], updated["email"],
             updated["phone"], updated["msg"], updated["photos"], updated["photos_paths"], updated["location"], lead_id),
        )
        cur.execute("SELECT * FROM leads WHERE id = %s", (lead_id,))
        row = cur.fetchone()
    return row_to_lead(row)


@app.delete("/api/leads/{lead_id}")
def delete_lead(lead_id: int, username: str = Depends(require_admin)):
    with db_cursor() as cur:
        cur.execute("DELETE FROM leads WHERE id = %s", (lead_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Lead not found")
    return {"ok": True}


# ---------- Admin: portfolio management ----------

@app.get("/api/admin/projects", response_model=List[Project])
def list_all_projects(username: str = Depends(require_admin)):
    with db_cursor() as cur:
        cur.execute("SELECT * FROM projects")
        rows = cur.fetchall()
    return [row_to_project(r) for r in rows]


@app.post("/api/admin/projects", response_model=Project)
def create_project(body: ProjectCreate, username: str = Depends(require_admin)):
    project_id = body.id or f"p{int(datetime.utcnow().timestamp())}"
    with db_cursor() as cur:
        cur.execute("SELECT id FROM projects WHERE id = %s", (project_id,))
        if cur.fetchone() is not None:
            raise HTTPException(status_code=409, detail="Project id already exists")
        cur.execute(
            "INSERT INTO projects (id, title, cat, sub, loc, img, live) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (project_id, body.title, body.cat, body.sub, body.loc, body.img, int(body.live)),
        )
        cur.execute("SELECT * FROM projects WHERE id = %s", (project_id,))
        row = cur.fetchone()
    return row_to_project(row)


@app.patch("/api/admin/projects/{project_id}", response_model=Project)
def update_project(project_id: str, body: ProjectUpdate, username: str = Depends(require_admin)):
    with db_cursor() as cur:
        cur.execute("SELECT * FROM projects WHERE id = %s", (project_id,))
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")
        updated = dict(row)
        for field in ("title", "cat", "sub", "loc", "img"):
            val = getattr(body, field)
            if val is not None:
                updated[field] = val
        if body.live is not None:
            updated["live"] = int(body.live)
        cur.execute(
            "UPDATE projects SET title=%s, cat=%s, sub=%s, loc=%s, img=%s, live=%s WHERE id=%s",
            (updated["title"], updated["cat"], updated["sub"], updated["loc"], updated["img"],
             updated["live"], project_id),
        )
        cur.execute("SELECT * FROM projects WHERE id = %s", (project_id,))
        row = cur.fetchone()
    return row_to_project(row)


@app.delete("/api/admin/projects/{project_id}")
def delete_project(project_id: str, username: str = Depends(require_admin)):
    with db_cursor() as cur:
        cur.execute("DELETE FROM projects WHERE id = %s", (project_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}


# ---------- Admin: services ----------

@app.post("/api/admin/services", response_model=Service)
def create_service(body: ServiceCreate, username: str = Depends(require_admin)):
    with db_cursor() as cur:
        cur.execute("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM services")
        next_order = cur.fetchone()["next_order"]
        cur.execute(
            "INSERT INTO services (n, t, d, tag, sort_order) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (body.n, body.t, body.d, body.tag, next_order),
        )
        new_id = cur.fetchone()["id"]
        cur.execute("SELECT * FROM services WHERE id = %s", (new_id,))
        row = cur.fetchone()
    return dict(row)


@app.patch("/api/admin/services/{service_id}", response_model=Service)
def update_service(service_id: int, body: ServiceUpdate, username: str = Depends(require_admin)):
    with db_cursor() as cur:
        cur.execute("SELECT * FROM services WHERE id = %s", (service_id,))
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Service not found")
        updated = dict(row)
        for field in ("n", "t", "d", "tag"):
            val = getattr(body, field)
            if val is not None:
                updated[field] = val
        cur.execute(
            "UPDATE services SET n=%s, t=%s, d=%s, tag=%s WHERE id=%s",
            (updated["n"], updated["t"], updated["d"], updated["tag"], service_id),
        )
        cur.execute("SELECT * FROM services WHERE id = %s", (service_id,))
        row = cur.fetchone()
    return dict(row)


@app.delete("/api/admin/services/{service_id}")
def delete_service(service_id: int, username: str = Depends(require_admin)):
    with db_cursor() as cur:
        cur.execute("DELETE FROM services WHERE id = %s", (service_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Service not found")
    return {"ok": True}


# ---------- Admin: categories ----------

@app.post("/api/admin/categories", response_model=Category)
def create_category(body: CategoryCreate, username: str = Depends(require_admin)):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name required")
    with db_cursor() as cur:
        cur.execute("SELECT * FROM categories WHERE name = %s", (name,))
        existing = cur.fetchone()
        if existing is not None:
            return dict(existing)
        cur.execute("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM categories")
        next_order = cur.fetchone()["next_order"]
        cur.execute(
            "INSERT INTO categories (name, desc, price_per_meter, sort_order) VALUES (%s, %s, %s, %s) RETURNING id",
            (name, body.desc, body.price_per_meter, next_order)
        )
        new_id = cur.fetchone()["id"]
        cur.execute("SELECT * FROM categories WHERE id = %s", (new_id,))
        row = cur.fetchone()
    return dict(row)


@app.patch("/api/admin/categories/{category_id}", response_model=Category)
def update_category(category_id: int, body: CategoryUpdate, username: str = Depends(require_admin)):
    if body.name is not None and not body.name.strip():
        raise HTTPException(status_code=400, detail="Category name required")
    with db_cursor() as cur:
        cur.execute("SELECT * FROM categories WHERE id = %s", (category_id,))
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Category not found")
        new_name = body.name.strip() if body.name is not None else row["name"]
        if body.name is not None:
            cur.execute("SELECT id FROM categories WHERE name = %s AND id != %s", (new_name, category_id))
            if cur.fetchone() is not None:
                raise HTTPException(status_code=409, detail="Category name already exists")
        
        new_desc = body.desc if body.desc is not None else row["desc"]
        new_price = body.price_per_meter if body.price_per_meter is not None else row["price_per_meter"]

        cur.execute(
            "UPDATE categories SET name = %s, desc = %s, price_per_meter = %s WHERE id = %s",
            (new_name, new_desc, new_price, category_id)
        )
        cur.execute("SELECT * FROM categories WHERE id = %s", (category_id,))
        row = cur.fetchone()
    return dict(row)


@app.delete("/api/admin/categories/{category_id}")
def delete_category(category_id: int, username: str = Depends(require_admin)):
    with db_cursor() as cur:
        cur.execute("DELETE FROM categories WHERE id = %s", (category_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Category not found")
    return {"ok": True}
