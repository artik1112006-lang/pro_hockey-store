import React from 'react';
import { Product, Category, Brand } from '../types';
import { ShoppingCart, Eye, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  categories: Category[];
  brands: Brand[];
  darkMode: boolean;
  onOpenDetails: (product: Product) => void;
  onQuickAddToCart: (product: Product, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  categories,
  brands,
  darkMode,
  onOpenDetails,
  onQuickAddToCart,
}) => {
  const categoryName = categories.find((c) => c.id === product.categoryId)?.name || 'Хоккей';
  const brandName = brands.find((b) => b.id === product.brandId)?.name;

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className={`group relative flex flex-col rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
        darkMode
          ? 'bg-[#1b1c20] border-neutral-800 hover:border-[#e63946]/60 shadow-lg shadow-black/40 hover:shadow-[#e63946]/10'
          : 'bg-white border-neutral-200 hover:border-[#e63946]/50 shadow-md hover:shadow-xl'
      } hover:-translate-y-1`}
    >
      {/* Top Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 flex-wrap">
          {brandName && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-black/75 text-white backdrop-blur-md border border-neutral-700/60 shadow-sm">
              {brandName}
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e63946]/90 text-white backdrop-blur-md shadow-sm">
            {categoryName}
          </span>
        </div>
      </div>

      {/* Image Container with smooth fallback */}
      <div className={`relative w-full h-52 sm:h-56 p-4 flex items-center justify-center overflow-hidden ${
        darkMode ? 'bg-[#141517]' : 'bg-[#f7f9fa]'
      }`}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-108 transition-transform duration-500 ease-out"
          onError={(e) => {
            // fallback placeholder hockey gear photo
            (e.currentTarget as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&w=600&q=80';
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-[#e63946]" />
            Быстрый просмотр
          </span>
        </div>
      </div>

      {/* Product Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            className={`font-bold text-sm sm:text-base line-clamp-2 leading-snug mb-2 transition-colors ${
              darkMode ? 'text-gray-100 group-hover:text-[#e63946]' : 'text-gray-900 group-hover:text-[#e63946]'
            }`}
          >
            {product.name}
          </h3>

          <p className={`text-xs line-clamp-2 mb-3 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {product.description || 'Профессиональная хоккейная экипировка премиального уровня.'}
          </p>

          {/* Specs tags preview */}
          {product.hasSpecs && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {product.handOptions && (
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                  darkMode ? 'bg-neutral-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  Хват: L / R
                </span>
              )}
              {product.curveOptions && (
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                  darkMode ? 'bg-neutral-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  Загибы: {product.curveOptions.split(',')[0]}...
                </span>
              )}
              {product.variants && (
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                  darkMode ? 'bg-neutral-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  Размеры / Flex
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-neutral-200/50 dark:border-neutral-800 flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="text-[10px] uppercase font-semibold text-gray-400">Цена</div>
            <div className="text-lg sm:text-xl font-extrabold text-[#e63946] tracking-tight">
              {product.price.toFixed(2)} <span className="text-xs font-bold text-gray-500">BYN</span>
            </div>
          </div>

          <button
            onClick={(e) => onQuickAddToCart(product, e)}
            className="flex items-center gap-1.5 bg-[#e63946] hover:bg-[#c92a37] active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#e63946]/20 transition-all cursor-pointer"
            title="Добавить в корзину"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>В корзину</span>
          </button>
        </div>
      </div>
    </div>
  );
};
