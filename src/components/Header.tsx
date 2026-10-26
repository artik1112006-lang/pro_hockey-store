import React from 'react';
import { ShoppingBag, Moon, Sun, Shield, Send } from 'lucide-react';
import { TELEGRAM_LINKS } from '../data/initialData';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#141517]/95 backdrop-blur-md border-b-2 border-[#e63946] text-white shadow-xl transition-colors">
      {/* Main Header Bar (top banner with "официальный" and "время работы" has been removed) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer flex items-center">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 p-1 flex items-center justify-center shadow-md overflow-hidden group-hover:border-[#e63946] transition-all duration-300">
              <img
                src="/logo.png"
                alt="Pro Hockey Store"
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_0_8px_rgba(230,57,70,0.6)] group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
          <div>
            <a href="#" className="flex items-center gap-1.5 no-underline">
              <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-white font-sans">
                PRO HOCKEY <span className="text-[#e63946]">STORE</span>
              </h1>
            </a>
            <p className="text-[10px] tracking-widest uppercase text-gray-400 font-semibold">
              ORIGINAL HOCKEY GEAR
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Telegram Manager Link */}
          <a
            href={TELEGRAM_LINKS.manager}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 text-[#229ED9] border border-[#229ED9]/30 transition text-xs font-bold"
            title="Связаться с менеджером в Telegram"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Менеджер {TELEGRAM_LINKS.managerUsername}</span>
            <span className="sm:hidden">Telegram</span>
          </a>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Включить светлую тему' : 'Включить темную тему'}
            className="p-2 sm:p-2.5 rounded-xl border border-gray-700 bg-neutral-800/80 hover:bg-neutral-700 text-gray-300 hover:text-white hover:border-[#e63946] transition-all cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          </button>

          {/* Admin Panel Button */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-neutral-700 bg-neutral-800/80 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-neutral-700 transition cursor-pointer text-xs font-semibold"
            title="Панель администратора"
          >
            <Shield className="w-3.5 h-3.5 text-[#e63946]" />
            <span className="hidden md:inline">Админка</span>
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 bg-[#e63946] hover:bg-[#d02d3a] active:scale-95 text-white px-3 sm:px-4 py-2 rounded-xl font-bold shadow-lg shadow-[#e63946]/30 transition-all cursor-pointer relative"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-white text-[#e63946] text-[11px] font-extrabold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-[#e63946] shadow-sm animate-pulse">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-[9px] text-red-100 uppercase font-semibold">Корзина</span>
              <span className="text-xs sm:text-sm font-black">{cartTotal.toFixed(2)} BYN</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
