import React from 'react';
import { Order } from '../types';
import { CheckCircle2, ArrowLeft, PackageCheck, PhoneCall } from 'lucide-react';

interface OrderSuccessModalProps {
  order: Order | null;
  darkMode: boolean;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  darkMode,
  onClose,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border text-center transition-all ${
          darkMode ? 'bg-[#1b1c20] border-neutral-800 text-white' : 'bg-white border-neutral-200 text-gray-900'
        }`}
      >
        {/* Animated Check icon */}
        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-black mb-2 tracking-tight">
          Спасибо за заказ!
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Заказ <span className="font-extrabold text-[#e63946]">#{order.id}</span> успешно принят и передан в отдел комплектации.
        </p>

        {/* Details Card */}
        <div
          className={`p-4 rounded-2xl text-left text-xs space-y-2 mb-6 border ${
            darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-gray-400">Получатель:</span>
            <span className="font-bold">{order.customerName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-gray-400">Телефон:</span>
            <span className="font-bold">{order.phone}</span>
          </div>
          {order.city && (
            <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-800">
              <span className="text-gray-400">Доставка:</span>
              <span className="font-bold">{order.city}</span>
            </div>
          )}
          <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-gray-400">Товары:</span>
            <span className="font-medium max-w-[200px] text-right truncate">{order.items}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-gray-400 font-bold uppercase">Сумма к оплате:</span>
            <span className="font-black text-base text-[#e63946]">{order.total.toFixed(2)} BYN</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-emerald-500 mb-6 font-semibold">
          <PhoneCall className="w-4 h-4" />
          <span>Менеджер позвонит вам для подтверждения отправки</span>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#e63946] hover:bg-[#d02837] text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-[#e63946]/30 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Вернуться в каталог</span>
        </button>
      </div>
    </div>
  );
};
