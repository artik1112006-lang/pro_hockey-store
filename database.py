import os
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# ЖЕСТКОЕ ПОДКЛЮЧЕНИЕ К SUPABASE (чтобы Render не ломился по старым адресам)
# Добавлен параметр ?sslmode=require для стабильности соединения
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:II7989038ii@db.wfzbuyyffmtucutnjmje.supabase.co:5432/postgres?sslmode=require"

# На всякий случай оставляем проверку формата для Render
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Создание движка
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- МОДЕЛИ ---

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

# СОЗДАНИЕ ТАБЛИЦ
Base.metadata.create_all(bind=engine)
