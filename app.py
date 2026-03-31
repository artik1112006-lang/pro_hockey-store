import uvicorn, os, requests
from typing import Optional, List
from fastapi import FastAPI, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel
from database import SessionLocal, Product, Order, Category, Brand, Base, engine

# --- НАСТРОЙКИ TELEGRAM ---
TELEGRAM_TOKEN = "8686923435:AAEHy9YL6C-fqGejUNZTYDTJ9I9ismbTCMo"
TELEGRAM_CHAT_ID = "1111122600"

def send_telegram_msg(text: str):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        payload = {"chat_id": TELEGRAM_CHAT_ID, "text": text, "parse_mode": "HTML"}
        requests.post(url, data=payload, timeout=10)
    except Exception as e:
        print(f"⚠️ Ошибка Telegram: {e}")

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="HOCKEY_ULTRA_SAFE_KEY")

ADMIN_PASSWORD = "2121"

if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- МОДЕЛИ ДАННЫХ ДЛЯ КОРЗИНЫ ---
class CartItem(BaseModel):
    name: str
    price: str
    img: Optional[str] = None

class OrderData(BaseModel):
    customer: dict
    items: List[CartItem]
    total: str

# --- КЛИЕНТСКАЯ ЧАСТЬ ---

@app.get("/", response_class=HTMLResponse)
async def index(request: Request, q: str = None, category_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Product)
    if q: query = query.filter(Product.name.contains(q))
    if category_id: query = query.filter(Product.category_id == category_id)

    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "products": query.all(),
            "categories": db.query(Category).all(),
            "brands": db.query(Brand).all(),
            "search_query": q or ""
        }
    )

@app.get("/cart", response_class=HTMLResponse)
async def cart_page(request: Request):
    return templates.TemplateResponse(request=request, name="cart.html", context={})

@app.post("/checkout")
async def checkout(order: OrderData, db: Session = Depends(get_db)):
    try:
        name = order.customer.get('name', 'Аноним')
        phone = order.customer.get('phone', 'Нет телефона')
        items_list = ", ".join([f"{item.name} ({item.price} BYN)" for item in order.items])

        new_order = Order(name=name, phone=phone, items=items_list)
        db.add(new_order)
        db.commit()

        msg = f"<b>🚨 НОВЫЙ ЗАКАЗ!</b>\n👤 {name}\n📞 {phone}\n📦 {items_list}\n💰 Итого: {order.total} BYN"
        send_telegram_msg(msg)
        return {"status": "success"}
    except Exception as e:
        print(f"Ошибка оформления: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/order_success", response_class=HTMLResponse)
async def order_success(request: Request):
    return templates.TemplateResponse(request=request, name="order_success.html", context={})

# --- АДМИН-ПАНЕЛЬ ---

@app.get("/admin", response_class=HTMLResponse)
async def admin(request: Request, db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    return templates.TemplateResponse(
        request=request,
        name="admin.html",
        context={
            "products": db.query(Product).all(),
            "orders": db.query(Order).order_by(Order.id.desc()).all(),
            "categories": db.query(Category).all(),
            "brands": db.query(Brand).all()
        }
    )

# --- УПРАВЛЕНИЕ ЗАКАЗАМИ ---

@app.post("/admin/order/delete/{o_id}")
async def delete_order(o_id: int, request: Request, db: Session = Depends(get_db)):
    if not request.session.get("admin"):
        return RedirectResponse(url="/login")

    order = db.query(Order).filter(Order.id == o_id).first()
    if order:
        db.delete(order)
        db.commit()
        print(f"✅ Заказ #{o_id} удален")
    return RedirectResponse(url="/admin", status_code=303)

# --- УПРАВЛЕНИЕ ТОВАРАМИ ---

@app.post("/admin/edit/{p_id}")
async def edit_product(p_id: int, name: str = Form(...), price: float = Form(...), img: str = Form(...),
                      desc: str = Form(""), category_id: int = Form(...), variants: str = Form(""),
                      brand_id: Optional[int] = Form(None), db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == p_id).first()
    if p:
        p.name = name
        p.price = price
        p.image_url = img
        p.description = desc
        p.category_id = category_id
        p.variants = variants
        p.brand_id = brand_id
        db.commit()
    return RedirectResponse(url="/admin", status_code=303)

@app.post("/admin/add")
async def add_product(name: str = Form(...), price: float = Form(...), img: str = Form(...),
                      desc: str = Form(""), category_id: int = Form(...), variants: str = Form(""),
                      brand_id: Optional[int] = Form(None), has_specs: Optional[str] = Form(None),
                      hand_options: str = Form(""), curve_options: str = Form(""), db: Session = Depends(get_db)):
    db.add(Product(name=name, price=price, image_url=img, description=desc, variants=variants,
                   category_id=category_id, brand_id=brand_id, has_specs=(has_specs == "on"),
                   hand_options=hand_options, curve_options=curve_options))
    db.commit()
    return RedirectResponse(url="/admin", status_code=303)

@app.post("/admin/delete/{p_id}")
async def delete_product(p_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == p_id).first()
    if p: db.delete(p); db.commit()
    return RedirectResponse(url="/admin", status_code=303)

# --- КАТЕГОРИИ И БРЕНДЫ ---

@app.post("/admin/category/add")
async def add_category(name: str = Form(...), db: Session = Depends(get_db)):
    db.add(Category(name=name)); db.commit()
    return RedirectResponse(url="/admin", status_code=303)

@app.post("/admin/brand/add")
async def add_brand(name: str = Form(...), db: Session = Depends(get_db)):
    db.add(Brand(name=name)); db.commit()
    return RedirectResponse(url="/admin", status_code=303)

# --- АВТОРИЗАЦИЯ ---

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse(request=request, name="login.html", context={})

@app.post("/login")
async def login(request: Request, password: str = Form(...)):
    if password == ADMIN_PASSWORD:
        request.session["admin"] = True
        return RedirectResponse(url="/admin", status_code=303)
    return HTMLResponse("<h2>Ошибка!</h2><a href='/login'>Назад</a>")

@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=9999)
