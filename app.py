import uvicorn, os
from typing import Optional
from fastapi import FastAPI, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
from database import SessionLocal, Product, Order, Category, Base, engine

# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="HOCKEY_ULTRA_SAFE_KEY")

ADMIN_PASSWORD = "123"

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- ГЛАВНАЯ СТРАНИЦА ---

@app.get("/", response_class=HTMLResponse)
async def index(request: Request, q: str = None, category_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Product)

    if q:
        query = query.filter(Product.name.contains(q))
    if category_id:
        query = query.filter(Product.category_id == category_id)

    products = query.all()
    categories = db.query(Category).all()

    # ПРАВИЛЬНЫЙ СИНТАКСИС: request первым аргументом
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "products": products,
            "categories": categories,
            "search_query": q or ""
        }
    )


@app.get("/cart", response_class=HTMLResponse)
async def cart(request: Request):
    return templates.TemplateResponse(request=request, name="cart.html")


@app.post("/order")
async def checkout(name: str = Form(...), phone: str = Form(...), items: str = Form(...),
                   db: Session = Depends(get_db)):
    db.add(Order(name=name, phone=phone, items=items))
    db.commit()
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
    return HTMLResponse("<h2>Ошибка!</h2><a href='/login'>Назад</a>")


@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/")


# --- АДМИН-ПАНЕЛЬ ---

@app.get("/admin", response_class=HTMLResponse)
async def admin(request: Request, db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    products = db.query(Product).all()
    orders = db.query(Order).order_by(Order.id.desc()).all()
    categories = db.query(Category).all()
    return templates.TemplateResponse(
        request=request,
        name="admin.html",
        context={
            "products": products,
            "orders": orders,
            "categories": categories
        }
    )


@app.post("/admin/category/add")
async def add_category(name: str = Form(...), db: Session = Depends(get_db)):
    db.add(Category(name=name))
    db.commit()
    return RedirectResponse(url="/admin", status_code=303)


@app.post("/admin/category/delete/{c_id}")
async def delete_category(c_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == c_id).first()
    if cat: db.delete(cat); db.commit()
    return RedirectResponse(url="/admin", status_code=303)


@app.post("/admin/add")
async def add_product(
        name: str = Form(...), price: float = Form(...), img: str = Form(...),
        desc: str = Form(...), category_id: int = Form(...),
        has_specs: Optional[str] = Form(None),
        hand_options: str = Form(""), curve_options: str = Form(""),
        db: Session = Depends(get_db)
):
    is_specs = True if has_specs == "on" else False
    db.add(Product(
        name=name, price=price, image_url=img, description=desc,
        category_id=category_id, has_specs=is_specs,
        hand_options=hand_options, curve_options=curve_options
    ))
    db.commit()
    return RedirectResponse(url="/admin", status_code=303)


@app.post("/admin/edit/{p_id}")
async def edit_product(
        p_id: int, name: str = Form(...), price: float = Form(...), img: str = Form(...),
        desc: str = Form(...), category_id: int = Form(...),
        has_specs: Optional[str] = Form(None),
        hand_options: str = Form(""), curve_options: str = Form(""),
        db: Session = Depends(get_db)
):
    p = db.query(Product).filter(Product.id == p_id).first()
    if p:
        p.name, p.price, p.image_url, p.description, p.category_id = name, price, img, desc, category_id
        p.has_specs = True if has_specs == "on" else False
        p.hand_options, p.curve_options = hand_options, curve_options
        db.commit()
    return RedirectResponse(url="/admin", status_code=303)


@app.post("/admin/delete/{p_id}")
async def delete_product(p_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == p_id).first()
    if p: db.delete(p); db.commit()
    return RedirectResponse(url="/admin", status_code=303)


@app.post("/admin/order/delete/{o_id}")
async def delete_order(o_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == o_id).first()
    if order: db.delete(order); db.commit()
    return RedirectResponse(url="/admin", status_code=303)


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=7777)
