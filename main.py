# This is a sample Python script.

# Press Shift+F10 to execute it or replace it with your code.
# Press Double Shift to search everywhere for classes, files, tool windows, actions, and settings.


def print_hi(name):
    # Use a breakpoint in the code line below to debug your script.
    print(f'Hi, {name}')  # Press Ctrl+F8 to toggle the breakpoint.


# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    print_hi('PyCharm')

# See PyCharm help at https://www.jetbrains.com/help/pycharm/
@app.post("/admin/order/delete/{o_id}")
async def delete_order(request: Request, o_id: int, db: Session = Depends(get_db)):
    if not request.session.get("admin"):
        return RedirectResponse(url="/login", status_code=303)

    o = db.query(Order).filter(Order.id == o_id).first()
    if o:
        db.delete(o)
        db.commit()

    # status_code=303 ОБЯЗАТЕЛЕН для перенаправления после POST
    return RedirectResponse(url="/admin", status_code=303)
