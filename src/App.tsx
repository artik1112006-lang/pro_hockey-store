import React, { useState, useEffect, useMemo } from 'react';
import {
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_PRODUCTS,
  DEFAULT_TELEGRAM_CONFIG,
  TELEGRAM_LINKS,
} from './data/initialData';
import { Product, Category, Brand, Order, CartItem, CustomerInfo, TelegramConfig } from './types';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { AdminPanel } from './components/AdminPanel';
import { sendTelegramOrderNotification } from './utils/telegram';
import {
  Search,
  SlidersHorizontal,
  Flame,
  Award,
  Truck,
  ShieldCheck,
  RotateCcw,
  Send,
  MessageCircle,
} from 'lucide-react';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('ph_dark_mode');
    return saved !== null ? saved === 'true' : true;
  });

  // Data states with localStorage persistence
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ph_products_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('ph_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem('ph_brands');
    return saved ? JSON.parse(saved) : INITIAL_BRANDS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('ph_orders');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            customerName: 'Артем Тараненко',
            phone: '80333833347',
            city: 'Доставка курьером',
            comment: 'Срочная доставка к игре',
            items: 'Клюшка WARRIOR COVERT QR5 PRO GRIP SR (790.00 BYN)',
            total: 790,
            createdAt: '25.10.2026, 12:00',
            status: 'выполнен' as const,
          },
        ];
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('ph_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => {
    const saved = localStorage.getItem('ph_telegram');
    return saved ? JSON.parse(saved) : DEFAULT_TELEGRAM_CONFIG;
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>(
    'default'
  );

  // UI Modal states
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ph_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('ph_products_v2', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('ph_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('ph_brands', JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem('ph_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('ph_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('ph_telegram', JSON.stringify(telegramConfig));
  }, [telegramConfig]);

  // Cart totals
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          searchQuery.trim() === '' ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCat = selectedCategory === null || p.categoryId === selectedCategory;
        const matchesBrand = selectedBrand === null || p.brandId === selectedBrand;

        return matchesSearch && matchesCat && matchesBrand;
      })
      .sort((a, b) => {
        if (sortOption === 'price-asc') return a.price - b.price;
        if (sortOption === 'price-desc') return b.price - a.price;
        if (sortOption === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, searchQuery, selectedCategory, selectedBrand, sortOption]);

  // Cart operations
  const handleAddToCartWithSpecs = (
    product: Product,
    quantity: number,
    specs: { hand?: string; curve?: string; variant?: string }
  ) => {
    const cartId = `${product.id}-${specs.hand || ''}-${specs.curve || ''}-${specs.variant || ''}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.cartId === cartId);
      if (existing) {
        return prev.map((item) =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          cartId,
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity,
          selectedHand: specs.hand,
          selectedCurve: specs.curve,
          selectedVariant: specs.variant,
        },
      ];
    });
  };

  const handleQuickAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    // If product has complex specs, open modal for customization
    if (product.hasSpecs) {
      setSelectedProduct(product);
      return;
    }
    handleAddToCartWithSpecs(product, 1, {});
  };

  const handleUpdateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Checkout order
  const handleCheckout = async (customer: CustomerInfo): Promise<boolean> => {
    if (cart.length === 0) return false;

    const summaryItems = cart
      .map((item) => {
        const specs = [item.selectedHand, item.selectedCurve, item.selectedVariant]
          .filter(Boolean)
          .join(', ');
        return `${item.name}${specs ? ` (${specs})` : ''} x${item.quantity} (${item.price * item.quantity} BYN)`;
      })
      .join(', ');

    const newOrder: Order = {
      id: orders.length > 0 ? Math.max(...orders.map((o) => o.id)) + 1 : 1,
      customerName: customer.name,
      phone: customer.phone,
      city: customer.city,
      comment: customer.comment,
      items: summaryItems,
      detailedItems: [...cart],
      total: cartTotal,
      createdAt: new Date().toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'новый',
    };

    // Save order
    setOrders((prev) => [newOrder, ...prev]);

    // Send Telegram Notification
    await sendTelegramOrderNotification(newOrder, telegramConfig);

    // Clear cart and show order confirmation modal
    setCart([]);
    setIsCartOpen(false);
    setLastPlacedOrder(newOrder);

    return true;
  };

  // Admin handlers
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const id = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
    setProducts((prev) => [{ id, ...newProd }, ...prev]);
  };

  const handleEditProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddCategory = (name: string) => {
    const id = categories.length > 0 ? Math.max(...categories.map((c) => c.id)) + 1 : 1;
    setCategories((prev) => [...prev, { id, name }]);
  };

  const handleDeleteCategory = (id: number) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddBrand = (name: string) => {
    const id = brands.length > 0 ? Math.max(...brands.map((b) => b.id)) + 1 : 1;
    setBrands((prev) => [...prev, { id, name }]);
  };

  const handleDeleteBrand = (id: number) => {
    setBrands((prev) => prev.filter((b) => b.id !== id));
  };

  const handleDeleteOrder = (id: number) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const handleResetCatalog = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setBrands(INITIAL_BRANDS);
    localStorage.setItem('ph_products_v2', JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem('ph_categories', JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem('ph_brands', JSON.stringify(INITIAL_BRANDS));
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        darkMode ? 'bg-[#0f1013] text-gray-100' : 'bg-[#f4f7f6] text-gray-900'
      }`}
    >
      {/* Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Hero Section Banner */}
      <div className="relative bg-[#141518] text-white border-b border-neutral-800 overflow-hidden">
        {/* Background Accent Gradients */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#e63946]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e63946]/20 border border-[#e63946]/40 text-[#e63946] text-xs font-black tracking-widest uppercase mb-3">
              <Flame className="w-3.5 h-3.5" /> Сезон 2026/2027 • Оригинальная экипировка
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-tight mb-4">
              ПРОФЕССИОНАЛЬНАЯ <br className="hidden sm:inline" />
              <span className="text-[#e63946]">ХОККЕЙНАЯ ЭКИПИРОВКА</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xl mb-6">
              Флагманские клюшки, коньки и защита Bauer, CCM, Warrior и True. Большой выбор жесткостей (Flex), загибов и хватов с быстрой доставкой и гарантией подлинности.
            </p>

            {/* Value badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <Truck className="w-4 h-4 text-[#e63946] shrink-0" />
                <span className="text-[11px] font-semibold text-gray-200">Быстрая доставка</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-semibold text-gray-200">100% Оригинал</span>
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] font-semibold text-gray-200">Оплата при получении</span>
              </div>
            </div>
          </div>

          {/* Direct Telegram Support Card (Replaces phone number) */}
          <div className="w-full md:w-auto shrink-0 flex flex-col items-center">
            <div className="w-full sm:w-80 rounded-2xl bg-neutral-900/95 border border-neutral-700/80 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-800">
                <span className="text-xs uppercase font-extrabold text-gray-400">Связь с нами</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                  Онлайн в Telegram
                </span>
              </div>
              <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                Поможем подобрать хват, загиб и жесткость клюшки, а также размер коньков в Telegram.
              </p>

              {/* Direct Telegram Button */}
              <a
                href={TELEGRAM_LINKS.manager}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#229ED9] hover:bg-[#1b8bc1] active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-[#229ED9]/30 mb-2.5"
              >
                <Send className="w-4 h-4" />
                <span>Написать менеджеру ({TELEGRAM_LINKS.managerUsername})</span>
              </a>

              <a
                href={TELEGRAM_LINKS.channel}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-gray-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition border border-neutral-700"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#229ED9]" />
                <span>Наш Telegram Канал {TELEGRAM_LINKS.channelUsername}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Navigation Bar */}
      <div
        className={`sticky top-[69px] z-30 border-b backdrop-blur-md transition-colors ${
          darkMode
            ? 'bg-[#141518]/95 border-neutral-800'
            : 'bg-white/95 border-neutral-200 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3">
          {/* Top row: Search & Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию (Warrior Covert, Bauer Sync, Trigger, коньки...)"
                className={`w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm outline-none border transition-all ${
                  darkMode
                    ? 'bg-neutral-900 border-neutral-700 text-white focus:border-[#e63946]'
                    : 'bg-neutral-50 border-neutral-300 text-gray-900 focus:border-[#e63946]'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort & Filter Reset */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                  darkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="bg-transparent border-none outline-none cursor-pointer text-xs"
                >
                  <option value="default" className="text-gray-900">
                    Сортировка: По умолчанию
                  </option>
                  <option value="price-asc" className="text-gray-900">
                    Сначала дешевле
                  </option>
                  <option value="price-desc" className="text-gray-900">
                    Сначала дороже
                  </option>
                  <option value="name" className="text-gray-900">
                    По алфавиту
                  </option>
                </select>
              </div>

              {(selectedCategory !== null || selectedBrand !== null || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedBrand(null);
                    setSearchQuery('');
                  }}
                  className="p-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer flex items-center gap-1 font-bold"
                  title="Сбросить все фильтры"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Сброс</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Navigation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === null
                  ? 'bg-[#e63946] text-white shadow-md shadow-[#e63946]/30'
                  : darkMode
                  ? 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
                  : 'bg-neutral-100 text-gray-700 hover:bg-neutral-200'
              }`}
            >
              Все товары ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#e63946] text-white shadow-md shadow-[#e63946]/30'
                      : darkMode
                      ? 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
                      : 'bg-neutral-100 text-gray-700 hover:bg-neutral-200'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Brand Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 border-t border-neutral-200/50 dark:border-neutral-800/80">
            <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 shrink-0 mr-1">
              Бренды:
            </span>
            <button
              onClick={() => setSelectedBrand(null)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer whitespace-nowrap ${
                selectedBrand === null
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Все
            </button>
            {brands.map((b) => {
              const isSelected = selectedBrand === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBrand(isSelected ? null : b.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                    isSelected
                      ? 'bg-[#e63946] text-white border-[#e63946] shadow-sm'
                      : darkMode
                      ? 'bg-neutral-900 border-neutral-800 text-gray-300 hover:border-gray-600'
                      : 'bg-white border-neutral-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Catalog Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <span>Каталог экипировки</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-gray-600 dark:text-gray-300">
              {filteredProducts.length} позиций
            </span>
          </h3>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-800 p-8">
            <Search className="w-12 h-12 mx-auto mb-3 text-neutral-400 opacity-40" />
            <h4 className="text-lg font-bold mb-1">Ничего не найдено</h4>
            <p className="text-xs text-gray-400 mb-6">
              Попробуйте изменить поисковый запрос или сбросить фильтры по бренду и категории.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedBrand(null);
              }}
              className="bg-[#e63946] hover:bg-[#d02837] text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Сбросить все фильтры
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categories={categories}
                brands={brands}
                darkMode={darkMode}
                onOpenDetails={(p) => setSelectedProduct(p)}
                onQuickAddToCart={handleQuickAddToCart}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <ProductModal
        product={selectedProduct}
        categories={categories}
        brands={brands}
        darkMode={darkMode}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCartWithSpecs}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        darkMode={darkMode}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onCheckout={handleCheckout}
      />

      <OrderSuccessModal
        order={lastPlacedOrder}
        darkMode={darkMode}
        onClose={() => setLastPlacedOrder(null)}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        categories={categories}
        brands={brands}
        orders={orders}
        telegramConfig={telegramConfig}
        darkMode={darkMode}
        onAddProduct={handleAddProduct}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDeleteProduct}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        onAddBrand={handleAddBrand}
        onDeleteBrand={handleDeleteBrand}
        onDeleteOrder={handleDeleteOrder}
        onUpdateTelegramConfig={setTelegramConfig}
        onResetCatalog={handleResetCatalog}
      />

      {/* Footer (without exposed passwords and with direct Telegram links from user template) */}
      <footer className="bg-[#111214] border-t border-neutral-800 text-gray-400 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#e63946] flex items-center justify-center font-black text-white text-sm">
                PH
              </div>
              <h4 className="text-white font-black uppercase text-base tracking-wider">
                PRO HOCKEY <span className="text-[#e63946]">STORE</span>
              </h4>
            </div>
            <p className="text-[11px] leading-relaxed text-gray-400">
              Специализированный интернет-магазин оригинальной хоккейной экипировки. Клюшки, коньки,
              защита и аксессуары Bauer, CCM, Warrior, True.
            </p>
          </div>

          <div>
            <h5 className="text-white font-bold uppercase text-xs tracking-wider mb-3">
              Категории экипировки
            </h5>
            <ul className="space-y-1.5 text-[11px]">
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      setSelectedCategory(c.id);
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition cursor-pointer"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold uppercase text-xs tracking-wider mb-3">
              Контакты в Telegram
            </h5>
            <ul className="space-y-2.5 text-[11px]">
              <li>
                <a
                  href={TELEGRAM_LINKS.manager}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                >
                  <Send className="w-3.5 h-3.5 text-[#229ED9]" />
                  <span>💬 Менеджер: {TELEGRAM_LINKS.managerUsername}</span>
                </a>
              </li>
              <li>
                <a
                  href={TELEGRAM_LINKS.channel}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#229ED9]" />
                  <span>✈️ Наш Telegram Канал: {TELEGRAM_LINKS.channelUsername}</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold uppercase text-xs tracking-wider mb-3">
              Администрация
            </h5>
            <p className="text-[11px] text-gray-400 mb-3">
              Управление заказами, товарами, хватами, загибами и ботом.
            </p>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer border border-neutral-700 hover:border-gray-500 flex items-center gap-2"
            >
              <span>Панель администратора</span>
            </button>
          </div>
        </div>

        <div className="border-t border-neutral-900 py-4 text-center text-[10px] text-gray-500">
          © {new Date().getFullYear()} Pro Hockey Store. Все права защищены.
        </div>
      </footer>
    </div>
  );
}
