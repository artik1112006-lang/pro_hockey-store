import React, { useState } from 'react';
import { CartItem, CustomerInfo } from '../types';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  darkMode: boolean;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onRemoveItem: (cartId: string) => void;
  onClearCart: () => void;
  onCheckout: (customer: CustomerInfo) => Promise<boolean>;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  darkMode,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Пожалуйста, укажите ваше имя');
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setErrorMsg('Пожалуйста, укажите корректный контактный телефон');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const ok = await onCheckout({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim() || undefined,
        comment: comment.trim() || undefined,
      });

      if (ok) {
        setName('');
        setPhone('');
        setCity('');
        setComment('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-lg h-full flex flex-col shadow-2xl transition-all duration-300 ${
          darkMode ? 'bg-[#18191c] text-white border-l border-neutral-800' : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#e63946]" />
            <h2 className="text-lg font-black uppercase tracking-wide">Корзина товаров</h2>
            <span className="text-xs bg-[#e63946]/10 text-[#e63946] font-bold px-2 py-0.5 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} шт
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <ShoppingBag className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mb-4 stroke-[1.5]" />
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">
                Ваша корзина пуста
              </h3>
              <p className="text-xs text-gray-500 mb-6 max-w-xs">
                Выберите клюшки, коньки или экипировку из каталога и добавьте в корзину
              </p>
              <button
                onClick={onClose}
                className="bg-[#e63946] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#d02837] transition cursor-pointer shadow-md"
              >
                Перейти к покупкам
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center text-xs text-gray-400 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <span>Список выбранных позиций</span>
                <button
                  onClick={onClearCart}
                  className="text-red-400 hover:text-red-500 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Очистить всё
                </button>
              </div>

              {cart.map((item) => (
                <div
                  key={item.cartId}
                  className={`p-3 rounded-2xl border flex gap-3 items-center ${
                    darkMode
                      ? 'bg-[#202126] border-neutral-800'
                      : 'bg-neutral-50/80 border-neutral-200'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-700">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&w=300&q=80';
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm truncate leading-snug">
                      {item.name}
                    </h4>

                    {/* Specs string */}
                    {(item.selectedHand || item.selectedCurve || item.selectedVariant) && (
                      <div className="flex flex-wrap gap-1 text-[10px] text-gray-400 mt-1">
                        {item.selectedHand && (
                          <span className="bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-800 dark:text-neutral-200 font-medium">
                            {item.selectedHand}
                          </span>
                        )}
                        {item.selectedCurve && (
                          <span className="bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-800 dark:text-neutral-200 font-medium">
                            {item.selectedCurve}
                          </span>
                        )}
                        {item.selectedVariant && (
                          <span className="bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-800 dark:text-neutral-200 font-medium">
                            {item.selectedVariant}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-xs font-black text-[#e63946] mt-1">
                      {item.price.toFixed(2)} BYN
                    </div>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center border rounded-lg border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartId, -1)}
                        className="px-2 py-1 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2 py-1 text-xs font-bold min-w-[1.5rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartId, 1)}
                        className="px-2 py-1 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.cartId)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition cursor-pointer"
                      title="Удалить позицию"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Checkout Form */}
              <form onSubmit={handleSubmitOrder} className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Данные для оформления заказа
                </h3>

                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-300">
                    Ваше ФИО / Имя <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Например: Артем Тараненко"
                    required
                    className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm border outline-none transition ${
                      darkMode
                        ? 'bg-neutral-900 border-neutral-700 focus:border-[#e63946] text-white'
                        : 'bg-white border-neutral-300 focus:border-[#e63946] text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-300">
                    Контактный телефон <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (___) ___-__-__"
                    required
                    className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm border outline-none transition ${
                      darkMode
                        ? 'bg-neutral-900 border-neutral-700 focus:border-[#e63946] text-white'
                        : 'bg-white border-neutral-300 focus:border-[#e63946] text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-300">
                    Город и адрес доставки
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="г. Минск, пр-т Победителей..."
                    className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm border outline-none transition ${
                      darkMode
                        ? 'bg-neutral-900 border-neutral-700 focus:border-[#e63946] text-white'
                        : 'bg-white border-neutral-300 focus:border-[#e63946] text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-300">
                    Комментарий к заказу (необязательно)
                  </label>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Удобное время звонка, пожелания по доставке..."
                    className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm border outline-none transition resize-none ${
                      darkMode
                        ? 'bg-neutral-900 border-neutral-700 focus:border-[#e63946] text-white'
                        : 'bg-white border-neutral-300 focus:border-[#e63946] text-gray-900'
                    }`}
                  />
                </div>

                {/* Telegram notice */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Заказ автоматически отправляется менеджеру в Telegram для мгновенного подтверждения.
                  </span>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer / Total & Checkout button */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141518]">
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase">Итого к оплате:</span>
              <span className="text-2xl font-black text-[#e63946]">
                {total.toFixed(2)} <span className="text-sm font-bold text-gray-400">BYN</span>
              </span>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#e63946] hover:bg-[#d02837] active:scale-98 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-[#e63946]/30 transition-all cursor-pointer disabled:opacity-50 text-sm uppercase tracking-wider"
            >
              {isSubmitting ? (
                <span>Оформляем заказ...</span>
              ) : (
                <>
                  <span>Оформить заказ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
