import os
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# Используем специальный домен для IPv4 и порт 6543 (PgBouncer)
# Это ЕДИНСТВЕННЫЙ способ заставить Render работать с внешней базой без IPv6
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:II7989038ii@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Если в Render настроена переменная, берем её
env_url = os.getenv("SUPABASE_URL")
if env_url:
    SQLALCHEMY_DATABASE_URL = env_url

# Фикс для SQLAlchemy
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Создаем движок с очень агрессивными настройками переподключения
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=0,
    connect_args={'connect_timeout': 30}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- МОДЕЛИ (ОСТАВЛЯЕМ БЕЗ ИЗМЕНЕНИЙ) ---

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
