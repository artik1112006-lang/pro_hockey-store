import React, { useState, useEffect } from 'react';
import { Product, Category, Brand } from '../types';
import { X, ShoppingBag, Check, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  categories: Category[];
  brands: Brand[];
  darkMode: boolean;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    specs: { hand?: string; curve?: string; variant?: string }
  ) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  categories,
  brands,
  darkMode,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const categoryName = categories.find((c) => c.id === product.categoryId)?.name || 'Хоккей';
  const brandName = brands.find((b) => b.id === product.brandId)?.name;

  // Parsed options
  const handOptionsList = product.handOptions
    ? product.handOptions.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const curveOptionsList = product.curveOptions
    ? product.curveOptions.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const variantOptionsList = product.variants
    ? product.variants.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const [selectedHand, setSelectedHand] = useState<string>(handOptionsList[0] || '');
  const [selectedCurve, setSelectedCurve] = useState<string>(curveOptionsList[0] || '');
  const [selectedVariant, setSelectedVariant] = useState<string>(variantOptionsList[0] || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  useEffect(() => {
    setSelectedHand(handOptionsList[0] || '');
    setSelectedCurve(curveOptionsList[0] || '');
    setSelectedVariant(variantOptionsList[0] || '');
    setQuantity(1);
    setAddedSuccess(false);
  }, [product]);

  const handleAdd = () => {
    onAddToCart(product, quantity, {
      hand: selectedHand || undefined,
      curve: selectedCurve || undefined,
      variant: selectedVariant || undefined,
    });
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border transition-all ${
          darkMode ? 'bg-[#1b1c20] border-neutral-800 text-white' : 'bg-white border-neutral-200 text-gray-900'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-10 p-2 rounded-full cursor-pointer transition-colors ${
            darkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
          {/* Left: Product Image */}
          <div className="flex flex-col items-center justify-center">
            <div
              className={`w-full h-72 sm:h-80 rounded-2xl p-6 flex items-center justify-center ${
                darkMode ? 'bg-[#141517]' : 'bg-[#f7f9fa]'
              }`}
            >
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-h-full max-w-full object-contain filter drop-shadow-xl hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&w=600&q=80';
                }}
              />
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> 100% Оригинал
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Truck className="w-4 h-4 text-blue-500" /> Быстрая доставка
              </span>
            </div>
          </div>

          {/* Right: Info & Selectors */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {brandName && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-black/80 text-white border border-neutral-700">
                    {brandName}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e63946] text-white">
                  {categoryName}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black leading-snug mb-3">
                {product.name}
              </h2>

              <div className="text-2xl sm:text-3xl font-extrabold text-[#e63946] mb-4">
                {product.price.toFixed(2)} <span className="text-sm font-bold text-gray-400">BYN</span>
              </div>

              <p className={`text-sm leading-relaxed mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {product.description || 'Профессиональная хоккейная экипировка высочайшего качества.'}
              </p>

              {/* Specs Options */}
              {product.hasSpecs && (
                <div className="space-y-4 mb-6">
                  {/* Hand option */}
                  {handOptionsList.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Хват клюшки:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {handOptionsList.map((hand) => (
                          <button
                            key={hand}
                            type="button"
                            onClick={() => setSelectedHand(hand)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              selectedHand === hand
                                ? 'bg-[#e63946] text-white border-[#e63946] shadow-sm'
                                : darkMode
                                ? 'bg-neutral-800 text-gray-300 border-neutral-700 hover:border-gray-500'
                                : 'bg-gray-100 text-gray-800 border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            {hand}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Curve / Загиб option */}
                  {curveOptionsList.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Загиб / Крюк / Цвет:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {curveOptionsList.map((curve) => (
                          <button
                            key={curve}
                            type="button"
                            onClick={() => setSelectedCurve(curve)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              selectedCurve === curve
                                ? 'bg-[#e63946] text-white border-[#e63946] shadow-sm'
                                : darkMode
                                ? 'bg-neutral-800 text-gray-300 border-neutral-700 hover:border-gray-500'
                                : 'bg-gray-100 text-gray-800 border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            {curve}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Variants / Flex / Size */}
                  {variantOptionsList.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Жесткость (Flex) / Размер:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {variantOptionsList.map((variant) => (
                          <button
                            key={variant}
                            type="button"
                            onClick={() => setSelectedVariant(variant)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              selectedVariant === variant
                                ? 'bg-[#e63946] text-white border-[#e63946] shadow-sm'
                                : darkMode
                                ? 'bg-neutral-800 text-gray-300 border-neutral-700 hover:border-gray-500'
                                : 'bg-gray-100 text-gray-800 border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            {variant}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions: Quantity and Add to Cart */}
            <div className="pt-4 border-t border-neutral-200/50 dark:border-neutral-800 flex items-center gap-4">
              {/* Quantity */}
              <div className="flex items-center border rounded-xl overflow-hidden border-neutral-300 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-sm font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                >
                  -
                </button>
                <span className="px-3 py-2 text-sm font-bold min-w-[2.5rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-2 text-sm font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={addedSuccess}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm sm:text-base text-white shadow-lg transition-all cursor-pointer ${
                  addedSuccess
                    ? 'bg-emerald-600 shadow-emerald-600/30'
                    : 'bg-[#e63946] hover:bg-[#c92a37] shadow-[#e63946]/30 active:scale-98'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Добавлено в корзину!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>В корзину • {(product.price * quantity).toFixed(2)} BYN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
