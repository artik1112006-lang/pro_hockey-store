import os
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# ИСПОЛЬЗУЕМ ПРЯМОЙ IP АДРЕС (это обходит проблему "Сеть недоступна")
# Мы убрали доменное имя и оставили только чистый адрес сервера
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:II7989038ii@15.237.253.181:5432/postgres?sslmode=require"

# Если в Render есть переменная SUPABASE_URL, используем её, но только если она не пустая
env_url = os.getenv("SUPABASE_URL")
if env_url:
    SQLALCHEMY_DATABASE_URL = env_url

# Исправляем префикс для SQLAlchemy
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Создаем движок с длинным ожиданием (timeout), чтобы сеть успела проснуться
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    connect_args={'connect_timeout': 10}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- МОДЕЛИ (БЕЗ ИЗМЕНЕНИЙ) ---

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    products = relationship("Product", back_populates="category", cascade="all, delete")

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
    variants = Column(String, nullable=True, default="")
    has_specs = Column(Boolean, default=False)
    hand_options = Column(String, default="")
    curve_options = Column(String, default="")
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="products")
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    brand = relationship("Brand", back_populates="products")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    phone = Column(String)
    items = Column(String)

# Создание таблиц
Base.metadata.create_all(bind=engine)
