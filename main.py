import uvicorn, os
from fastapi import FastAPI, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
# Импортируем всё необходимое из твоего файла database.py
from database import SessionLocal, Product, Order, Category, Base, engine

# --- ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ---
# Base.metadata.drop_all(bind=engine)  <-- ЭТУ СТРОКУ Я УДАЛИЛ, ЧТОБЫ ДАННЫЕ НЕ СТИРАЛИСЬ
Base.metadata.create_all(bind=engine)  # Это только создает таблицы, если их еще нет

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="HOCKEY_SHOP_KEY_FINAL")

# Шаблоны и статика
templates = Jinja2Templates(directory="templates")
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- КЛИЕНТСКИЕ СТРАНИЦЫ ---

@app.get("/", response_class=HTMLResponse)
async def index(request: Request, db: Session = Depends(get_db)):
    products = db.query(Product).all()
    categories = db.query(Category).all()
    return templates.TemplateResponse("index.html", {"request": request, "products": products, "categories": categories})

@app.get("/cart", response_class=HTMLResponse)
async def cart(request: Request):
    return templates.TemplateResponse("cart.html", {"request": request})

@app.post("/order")
async def checkout(name: str = Form(...), phone: str = Form(...), items: str = Form(...), db: Session = Depends(get_db)):
    new_order = Order(name=name, phone=phone, items=items)
    db.add(new_order)
    db.commit()
    return {"status": "success"}

# --- АВТОРИЗАЦИЯ ---

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/login")
async def login(request: Request, password: str = Form(...)):
    if password == "123":
        request.session["admin"] = True
        return RedirectResponse(url="/admin", status_code=303)
    return HTMLResponse("<h2>Ошибка! Неверный пароль.</h2><a href='/login'>Назад</a>")

@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/")

# --- АДМИН-ПАНЕЛЬ ---

@app.get("/admin", response_class=HTMLResponse)
async def admin(request: Request, db: Session = Depends(get_db)):
    if not request.session.get("admin"):
        return RedirectResponse(url="/login")
    products = db.query(Product).all()
    orders = db.query(Order).order_by(Order.id.desc()).all()
    categories = db.query(Category).all()
    return templates.TemplateResponse("admin.html", {"request": request, "products": products, "orders": orders, "categories": categories})

# УПРАВЛЕНИЕ КАТЕГОРИЯМИ
@app.post("/admin/category/add")
async def add_category(request: Request, name: str = Form(...
