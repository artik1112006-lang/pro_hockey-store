from database import SessionLocal, Product, Base, engine

# Пересоздаем таблицы
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)


def fill_manual():
    db = SessionLocal()

    # Список реальных товаров для старта
    items = [
        {
            "name": "Клюшка BAUER NEXUS SYNC GRIP INT",
            "price": 850.00,
            "img": "https://icecity.by"
        },
        {
            "name": "Клюшка WARRIOR COVERT QR5 PRO GRIP SR",
            "price": 790.00,
            "img": "https://icecity.by"
        },
        {
            "name": "Клюшка CCM RIBCOR TRIGGER 7 PRO INT",
            "price": 820.00,
            "img": "https://icecity.by"
        },
        {
            "name": "Клюшка TRUE HZRDUS 9X GRIP SR",
            "price": 890.00,
            "img": "https://icecity.by"
        }
    ]

    for item in items:
        new_p = Product(
            name=item["name"],
            price=item["price"],
            image_url=item["img"],
            description="Профессиональная хоккейная клюшка"
        )
        db.add(new_p)

    db.commit()
    db.close()
    print("✅ База данных успешно наполнена вручную!")


if __name__ == "__main__":
    fill_manual()
