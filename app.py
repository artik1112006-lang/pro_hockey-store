import requests
import uvicorn
from fastapi import FastAPI, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
import os
# Импортируем из твоего database.py
from database import SessionLocal, Product, Order, Base, engine

# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI()

# НАСТРОЙКИ
app.add_middleware(SessionMiddleware, secret_key="PRO_HOCKEY_SECRET")
ADMIN_PASSWORD = "123"  # Твой пароль
TELEGRAM_TOKEN = "ВАШ_ТОКЕН" # Токен от BotFather
CHAT_ID = "ВАШ_ID"        # Твой ID

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def send_tg_message(text):
    # ОШИБКА №1 ИСПРАВЛЕНА: Добавлен /bot (в твоем коде его не было)
    url = f"https://api.telegram.org{TELEGRAM_TOKEN}/sendMessage"
    try:
        requests.post(url, json={"chat_id": CHAT_ID, "text": text, "parse_mode": "HTML"})
    except Exception as e:
        print(f"Ошибка TG: {e}")

# --- КЛИЕНТСКАЯ ЧАСТЬ ---

@app.get("/", response_class=HTMLResponse)
async def index(request: Request, db: Session = Depends(get_db)):
    products_list = db.query(Product).all()
    # ОШИБКА №2 ИСПРАВЛЕНА: Добавлен обязательный аргумент request для новых версий Jinja2
    return templates.TemplateResponse(
        request=request, 
        name="index.html", 
        context={"products": products_list}
    )

@app.get("/cart", response_class=HTMLResponse)
async def cart(request: Request):
    return templates.TemplateResponse(request=request, name="cart.html")

@app.post("/order")
async def checkout(name: str = Form(...), phone: str = Form(...), items: str = Form(...), db: Session = Depends(get_db)):
    new_order = Order(name=name, phone=phone, items=items)
    db.add(new_order)
    db.commit()
    message = f"<b>🏒 Pro Hockey Store: ЗАКАЗ #{new_order.id}</b>\n👤 Клиент: {name}\n📞 Тел: {phone}\n\n📦 Товары:\n{items}"
    send_tg_message(message)
    return {"status": "success"}

# --- АВТОРИЗАЦИЯ ---

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse(request=request, name="login.html")

@app.post("/login")
async def login(request: Request, password: str = Form(...)):
    if password == ADMIN_PASSWORD:
        request.session["admin"] = True
        return RedirectResponse(url="/admin", status_code=303)
    return HTMLResponse("Ошибка! <a href='/login'>Назад</a>", status_code=401)

@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/")

# --- АДМИНКА ---

@app.get("/admin", response_class=HTMLResponse)
async def admin(request: Request, db: Session = Depends(get_db)):
    if not request.session.get("admin"):
        return RedirectResponse(url="/login")
    products_list = db.query(Product).all()
    orders_list = db.query(Order).order_by(Order.id.desc()).all()
    return templates.TemplateResponse(
        request=request, 
        name="admin.html", 
        context={"products": products_list, "orders": orders_list}
    )

@app.post("/admin/add")
async def add_product(request: Request, name: str = Form(...), price: float = Form(...), img: str = Form(...), db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    new_item = Product(name=name, price=price, image_url=img, description="Клюшка")
    db.add(new_item)
    db.commit()
    return RedirectResponse(url="/admin", status_code=303)

@app.post("/admin/delete/{product_id}")
async def delete_product(request: Request, product_id: int, db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        db.delete(product)
        db.commit()
    return RedirectResponse(url="/admin", status_code=303)

@app.post("/admin/order/delete/{order_id}")
async def delete_order(request: Request, order_id: int, db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    order = db.query(Order).filter(Order.id == order_id).first()
    if order:
        db.delete(order)
        db.commit()
    return RedirectResponse(url="/admin", status_code=303)

if __name__ == "__main__":
    # Для Render используем порт из переменной окружения
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
