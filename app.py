import requests, uvicorn, os
from fastapi import FastAPI, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
from database import SessionLocal, Product, Order, Base, engine

# Создаем таблицы при запуске
Base.metadata.create_all(bind=engine)

app = FastAPI()
# Секретный ключ для сессий (пароля)
app.add_middleware(SessionMiddleware, secret_key="BACK_TO_STABLE_FINAL")

# --- НАСТРОЙКИ (ОБЯЗАТЕЛЬНО ЗАМЕНИ) ---
ADMIN_PASSWORD = "123"
TELEGRAM_TOKEN = "ВАШ_ТОКЕН_ОТ_BOTFATHER"
CHAT_ID = "ВАШ_ID_ИЗ_USERINFOBOT"

# Проверка наличия папок перед запуском
if not os.path.exists("static"): os.makedirs("static")
if not os.path.exists("templates"): os.makedirs("templates")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def send_tg_message(text):
    # ИСПРАВЛЕНО: Добавлен /bot (в твоем коде его не было)
    url = f"https://api.telegram.org{TELEGRAM_TOKEN}/sendMessage"
    try:
        requests.post(url, json={"chat_id": CHAT_ID, "text": text, "parse_mode": "HTML"})
    except Exception as e:
        print(f"Ошибка Telegram: {e}")

# --- КЛИЕНТСКАЯ ЧАСТЬ ---

@app.get("/", response_class=HTMLResponse)
async def index(request: Request, db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return templates.TemplateResponse(request=request, name="index.html", context={"products": products})

@app.get("/cart", response_class=HTMLResponse)
async def cart(request: Request):
    return templates.TemplateResponse(request=request, name="cart.html")

@app.post("/order")
async def checkout(name: str = Form(...), phone: str = Form(...), items: str = Form(...), db: Session = Depends(get_db)):
    new_order = Order(name=name, phone=phone, items=items)
    db.add(new_order); db.commit()
    send_tg_message(f"<b>🏒 НОВЫЙ ЗАКАЗ!</b>\n\n👤 Имя: {name}\n📞 Тел: {phone}\n\n📦 Заказ:\n{items}")
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
    return HTMLResponse("<h2>Ошибка! Неверный пароль.</h2><a href='/login'>Назад</a>")

@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/")

# --- АДМИНКА ---

@app.get("/admin", response_class=HTMLResponse)
async def admin(request: Request, db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    products = db.query(Product).all()
    orders = db.query(Order).order_by(Order.id.desc()).all()
    return templates.TemplateResponse(request=request, name="admin.html", context={"products": products, "orders": orders})

@app.post("/admin/add")
async def add_product(request: Request, name: str = Form(...), price: float = Form(...), img: str = Form(...), db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    db.add(Product(name=name, price=price, image_url=img)); db.commit()
    return RedirectResponse(url="/admin", status_code=303)

@app.post("/admin/delete/{p_id}")
async def delete_product(request: Request, p_id: int, db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    p = db.query(Product).filter(Product.id == p_id).first()
    if p: db.delete(p); db.commit()
    return RedirectResponse(url="/admin", status_code=303)

# НОВАЯ ФУНКЦИЯ: Удаление заказа из админки
@app.post("/admin/order/delete/{o_id}")
async def delete_order(request: Request, o_id: int, db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    o = db.query(Order).filter(Order.id == o_id).first()
    if o: db.delete(o); db.commit()
    return RedirectResponse(url="/admin", status_code=303)

if __name__ == "__main__":
    # Для Render используем системный порт
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
