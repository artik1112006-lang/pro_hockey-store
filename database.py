import os
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# Ссылка для подключения
RENDER_EXTERNAL_URL = "postgresql://hokey_user:YtP4rX0ZAg1h2wbiHqZT71YLS4nb8U5Y@dpg-d75072q4d50c73e2aa6g-a.ohio-postgres.render.com/hokey"
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", RENDER_EXTERNAL_URL)

if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Исправлено: добавлены скобки и параметры стабильности
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600
)

# Эти строки ОБЯЗАТЕЛЬНО должны быть здесь:
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    products = relationship("Product", back_populates="category", cascade="all, delete")


# --- НОВАЯ МОДЕЛЬ: БРЕНДЫ ---
class Brand(Base):
    __tablename__ = "brands"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    products = relationship("Product", back_populates="brand", cascade="all, delete")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    description = Column(String)
    image_url = Column(String)

    # --- ДОБАВЛЕНО: Поле для хранения вариантов (размеры/цены) ---
    variants = Column(String, nullable=True, default="")

    has_specs = Column(Boolean, default=False)
    hand_options = Column(String, default="")
    curve_options = Column(String, default="")

    # Связь с категорией
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="products")

    # --- НОВОЕ: Связь с брендом ---
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    brand = relationship("Brand", back_populates="products")


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    phone = Column(String)
    items = Column(String)


# Создаем таблицы
Base.metadata.create_all(bind=engine)


