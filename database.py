import os
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# Твоя ссылка (External) для работы из PyCharm
RENDER_EXTERNAL_URL = "postgresql://hokey_user:YtP4rX0ZAg1h2wbiHqZT71YLS4nb8U5Y@dpg-d75072q4d50c73e2aa6g-a.ohio-postgres.render.com/hokey"

# Если проект на Render, он подставит Internal URL сам, если на компе — берем твою ссылку
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", RENDER_EXTERNAL_URL)

# Исправляем протокол, если Render выдаст старый формат (на всякий случай)
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Создаем движок для PostgreSQL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    products = relationship("Product", back_populates="category", cascade="all, delete")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    description = Column(String)
    image_url = Column(String)
    has_specs = Column(Boolean, default=False)
    hand_options = Column(String, default="")
    curve_options = Column(String, default="")
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="products")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    phone = Column(String)
    items = Column(String)

# Создаем таблицы в облаке
Base.metadata.create_all(bind=engine)
