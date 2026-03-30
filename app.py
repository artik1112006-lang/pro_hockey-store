import uvicorn, os
from fastapi import FastAPI, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
from database import SessionLocal, Product, Order, Category, Base, engine

# 1. Создание таблиц
Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="HOCKEY_SHOP_KEY_FINAL")

# 2. Шаблоны и статика
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
    return templates.TemplateResponse(request=request, name="index.html", context={"products": products, "categories": categories})

@app.get("/cart", response_class=HTMLResponse)
async def cart(request: Request):
    return templates.TemplateResponse(request=request, name="cart.html")

@app.post("/order")
async def checkout(name: str = Form(...), phone: str = Form(...), items: str = Form(...), db: Session = Depends(get_db)):
    new_order = Order(name=name, phone=phone, items=items)
    db.add(new_order)
    db.commit()
    return {"status": "success"}

# --- АВТОРИЗАЦИЯ ---

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse(request=request, name="login.html")

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
    return templates.TemplateResponse(request=request, name="admin.html", context={"products": products, "orders": orders, "categories": categories})

# УПРАВЛЕНИЕ КАТЕГОРИЯМИ
@app.post("/admin/category/add")
async def add_category(request: Request, name: str = Form(...), db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    db.add(Category(name=name))
    db.commit()
    return RedirectResponse(url="/admin", status_code=303)

@app.post("/admin/category/delete/{c_id}")
async def delete_category(request: Request, c_id: int, db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    cat = db.query(Category).filter(Category.id == c_id).first()
    if cat:
        db.delete(cat)
        db.commit()
    return RedirectResponse(url="/admin", status_code=303)

# УПРАВЛЕНИЕ ТОВАРАМИ
@app.post("/admin/add")
async def add_product(request: Request, name: str = Form(...), price: float = Form(...), img: str = Form(...), desc: str = Form(...), category_id: int = Form(...), db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    db.add(Product(name=name, price=price, image_url=img, description=desc, category_id=category_id))
    db.commit()
    return RedirectResponse(url="/admin", status_code=303)

@app.post("/admin/edit/{p_id}")
async def edit_product(request: Request, p_id: int, name: str = Form(...), price: float = Form(...), img: str = Form(...), desc: str = Form(...), category_id: int = Form(...), db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    p = db.query(Product).filter(Product.id == p_id).first()
    if p:
        p.name = name
        p.price = price
        p.image_url = img
        p.description = desc
        p.category_id = category_id
        db.commit()
    return RedirectResponse(url="/admin", status_code=303)

@app.post("/admin/delete/{p_id}")
async def delete_product(request: Request, p_id: int, db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    p = db.query(Product).filter(Product.id == p_id).first()
    if p:
        db.delete(p)
        db.commit()
    return RedirectResponse(url="/admin", status_code=303)

@app.post("/admin/order/delete/{o_id}")
async def delete_order(request: Request, o_id: int, db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    o = db.query(Order).filter(Order.id == o_id).first()
    if o:
        db.delete(o)
        db.commit()
    return RedirectResponse(url="/admin", status_code=303)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=7777)
