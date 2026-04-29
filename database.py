import os
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# ИСПОЛЬЗУЕМ ПОРТ 6543 И РЕЖИМ PGBOUNCER (это решает проблему "Сеть недоступна")
# Прямая ссылка на случай, если переменная в Render не задана
DEFAULT_SUPABASE_URL = "postgresql://postgres:II7989038ii@db.wfzbuyyffmtucutnjmje.supabase.co:6543/postgres?sslmode=require&pgbouncer=true"

# Пытаемся взять ссылку из переменной SUPABASE_URL, если ее нет — берем DEFAULT_SUPABASE_URL
SQLALCHEMY_DATABASE_URL = os.getenv("SUPABASE_URL", DEFAULT_SUPABASE_URL)

# Исправляем префикс для SQLAlchemy (важно для совместимости)
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Создание движка с настройками пула для работы через прокси
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=300
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

# Создание таблиц (теперь через порт 6543)
Base.metadata.create_all(bind=engine)
