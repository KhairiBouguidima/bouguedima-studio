from typing import Optional

from pydantic import BaseModel, Field

STATUSES = ("Lead", "Quoted", "In Progress", "Completed")


class QuoteSubmit(BaseModel):
    type: str
    area: str = "40"
    unit: str = "m²"
    style: str = ""
    photos: int = 0
    photos_paths: str = ""
    name: str
    email: str = ""
    phone: str = ""
    message: str = ""
    budget: str = "—"


class Lead(BaseModel):
    id: int
    name: str
    initials: str
    project: str
    area: str
    style: str
    status: str
    created_at: str
    photos: int
    photos_paths: str
    location: str
    budget: str
    msg: str
    email: str
    phone: str


class LeadCreate(BaseModel):
    name: str
    project: str
    area: str = ""
    style: str = ""
    email: str = ""
    phone: str = ""
    message: str = ""
    photos: int = 0
    photos_paths: str = ""
    location: str = ""
    budget: str = "—"
    status: str = "Lead"


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    project: Optional[str] = None
    area: Optional[str] = None
    style: Optional[str] = None
    status: Optional[str] = None
    budget: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    msg: Optional[str] = None
    photos: Optional[int] = None
    photos_paths: Optional[str] = None
    location: Optional[str] = None


class Project(BaseModel):
    id: str
    title: str
    cat: str
    sub: str
    loc: str
    img: str
    live: bool


class ProjectCreate(BaseModel):
    id: Optional[str] = None
    title: str
    cat: str
    sub: str
    loc: str
    img: str
    live: bool = True


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    cat: Optional[str] = None
    sub: Optional[str] = None
    loc: Optional[str] = None
    img: Optional[str] = None
    live: Optional[bool] = None


class Service(BaseModel):
    id: int
    n: str
    t: str
    d: str
    tag: str


class ServiceCreate(BaseModel):
    n: str
    t: str
    d: str
    tag: str


class ServiceUpdate(BaseModel):
    n: Optional[str] = None
    t: Optional[str] = None
    d: Optional[str] = None
    tag: Optional[str] = None


class Category(BaseModel):
    id: int
    name: str
    desc: str
    price_per_meter: int


class CategoryCreate(BaseModel):
    name: str
    desc: str = ""
    price_per_meter: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    desc: Optional[str] = None
    price_per_meter: Optional[int] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str
