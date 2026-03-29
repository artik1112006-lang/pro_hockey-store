from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Создаем файл базы данных в папке проекта
SQLALCHEMY_DATABASE_URL = "sqlite:///./database.db"

# Настройка движка базы
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Создаем сессию для работы с данными
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей
Base = declarative_base()

# Описание таблицы товаров
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    price = Column(Float)
    description = Column(String)
    image_url = Column(String)

# Эта строка создает саму базу данных (файл .db), если её еще нет
Base.metadata.create_all(bind=engine)
class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    phone = Column(String)
    items = Column(String) # Список товаров строкой
