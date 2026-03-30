import uvicorn, os
from fastapi import FastAPI, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
from database import SessionLocal, Product, Order, Category, Base, engine

# ВАЖНО: Мы убрали Base.metadata.drop_all!
# Теперь база создается только если её нет.
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


# --- КЛИЕНТСКАЯ ЧАСТЬ С ПОИСКОМ ---

@app.get("/", response_class=HTMLResponse)
async def index(request: Request, q: str = None, db: Session = Depends(get_db)):
    query = db.query(Product)

    # ЛОГИКА ПОИСКА
    if q:
        query = query.filter(Product.name.contains(q))

    products = query.all()
    categories = db.query(Category).all()
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"products": products, "categories": categories, "search_query": q or ""}
    )


# ... (остальные роуты: /cart, /order, /login, /admin — остаются без изменений) ...

@app.get("/cart", response_class=HTMLResponse)
async def cart(request: Request):
    return templates.TemplateResponse(request=request, name="cart.html")


@app.post("/order")
async def checkout(name: str = Form(...), phone: str = Form(...), items: str = Form(...),
                   db: Session = Depends(get_db)):
    db.add(Order(name=name, phone=phone, items=items))
    db.commit()
    return {"status": "success"}


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse(request=request, name="login.html")


@app.post("/login")
async def login(request: Request, password: str = Form(...)):
    if password == ADMIN_PASSWORD:
        request.session["admin"] = True
        return RedirectResponse(url="/admin", status_code=303)
    return HTMLResponse("<h2>Ошибка!</h2><a href='/login'>Назад</a>")


@app.get("/admin", response_class=HTMLResponse)
async def admin(request: Request, db: Session = Depends(get_db)):
    if not request.session.get("admin"): return RedirectResponse(url="/login")
    products = db.query(Product).all()
    orders = db.query(Order).order_by(Order.id.desc()).all()
    categories = db.query(Category).all()
    return templates.TemplateResponse(request=request, name="admin.html",
                                      context={"products": products, "orders": orders, "categories": categories})


@app.post("/admin/category/add")
async def add_category(request: Request, name: str = Form(...), db: Session = Depends(get_db)):
    db.add(Category(name=name))
    db.commit()
    return RedirectResponse(url="/admin", status_code=303)


@app.post("/admin/category/delete/{c_id}")
async def delete_category(c_id: int, db: Session = Depends(get_db), request: Request = None):
    cat = db.query(Category).filter(Category.id == c_id).first()
    if cat: db.delete(cat); db.commit()
    return RedirectResponse(url="/admin", status_code=303)


@app.post("/admin/add")
async def add_product(request: Request, name: str = Form(...), price: float = Form(...), img: str = Form(...),
                      desc: str = Form(...), category_id: int = Form(...), db: Session = Depends(get_db)):
    db.add(Product(name=name, price=price, image_url=img, description=desc, category_id=category_id))
    db.commit()
    return RedirectResponse(url="/admin", status_code=303)


@app.post("/admin/delete/{p_id}")
async def delete_product(p_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == p_id).first()
    if p: db.delete(p); db.commit()
    return RedirectResponse(url="/admin", status_code=303)


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=7777)
