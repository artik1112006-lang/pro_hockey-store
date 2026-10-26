import React, { useState } from 'react';
import { Product, Category, Brand, Order, TelegramConfig } from '../types';
import { testTelegramMessage } from '../utils/telegram';
import {
  X,
  Package,
  ShoppingBag,
  Layers,
  Send,
  Plus,
  Trash2,
  Lock,
  LogOut,
  Save,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  brands: Brand[];
  orders: Order[];
  telegramConfig: TelegramConfig;
  darkMode: boolean;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: number) => void;
  onAddBrand: (name: string) => void;
  onDeleteBrand: (id: number) => void;
  onDeleteOrder: (id: number) => void;
  onUpdateTelegramConfig: (config: TelegramConfig) => void;
  onResetCatalog: () => void;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  brands,
  orders,
  telegramConfig,
  darkMode,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAddCategory,
  onDeleteCategory,
  onAddBrand,
  onDeleteBrand,
  onDeleteOrder,
  onUpdateTelegramConfig,
  onResetCatalog,
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('ph_admin_logged') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Active tab
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'telegram'>('products');

  // Custom In-App Confirmation Dialog state (replaces window.confirm which is blocked by iframe sandbox)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add Product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdCat, setNewProdCat] = useState<number>(categories[0]?.id || 1);
  const [newProdBrand, setNewProdBrand] = useState<string>('');
  const [newProdHasSpecs, setNewProdHasSpecs] = useState(true);
  const [newProdHand, setNewProdHand] = useState('Левый, Правый');
  const [newProdCurve, setNewProdCurve] = useState('P92, P28, P88');
  const [newProdVariants, setNewProdVariants] = useState('Flex 65, Flex 75, Flex 85');

  // Inline edited products local state
  const [editedProducts, setEditedProducts] = useState<Record<number, Product>>({});
  const [savedRowId, setSavedRowId] = useState<number | null>(null);

  // New category & brand input
  const [newCatName, setNewCatName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  // Telegram test state
  const [localTg, setLocalTg] = useState<TelegramConfig>(telegramConfig);
  const [tgTestStatus, setTgTestStatus] = useState<{ loading: boolean; message?: string; success?: boolean }>({
    loading: false,
  });

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '2121') {
      setIsAuthenticated(true);
      sessionStorage.setItem('ph_admin_logged', 'true');
      setAuthError('');
      setPasswordInput('');
      showToast('Успешный вход в панель управления');
    } else {
      setAuthError('Неверный пароль администратора');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('ph_admin_logged');
    setPasswordInput('');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;

    onAddProduct({
      name: newProdName.trim(),
      price: parseFloat(newProdPrice) || 0,
      imageUrl: newProdImage.trim() || 'https://icecity.by/thumb-product/286657_0_3569.png',
      description: newProdDesc.trim(),
      categoryId: Number(newProdCat),
      brandId: newProdBrand ? Number(newProdBrand) : undefined,
      hasSpecs: newProdHasSpecs,
      handOptions: newProdHasSpecs ? newProdHand.trim() : '',
      curveOptions: newProdHasSpecs ? newProdCurve.trim() : '',
      variants: newProdVariants.trim(),
    });

    showToast(`Товар "${newProdName.trim()}" добавлен в каталог`);

    // Reset fields
    setNewProdName('');
    setNewProdPrice('');
    setNewProdImage('');
    setNewProdDesc('');
  };

  // Helper for inline editing
  const getProductState = (p: Product): Product => {
    return editedProducts[p.id] || p;
  };

  const updateProductField = <K extends keyof Product>(id: number, field: K, value: Product[K]) => {
    const original = products.find((p) => p.id === id);
    if (!original) return;
    const current = editedProducts[id] || { ...original };
    setEditedProducts({
      ...editedProducts,
      [id]: {
        ...current,
        [field]: value,
      },
    });
  };

  const handleSaveInlineProduct = (id: number) => {
    const updated = editedProducts[id];
    if (updated) {
      onEditProduct(updated);
      setSavedRowId(id);
      showToast('Изменения товара сохранены');
      setTimeout(() => setSavedRowId(null), 1500);
    }
  };

  const handleTestTelegram = async () => {
    setTgTestStatus({ loading: true });
    const res = await testTelegramMessage(localTg);
    setTgTestStatus({ loading: false, success: res.success, message: res.message });
  };

  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTelegramConfig(localTg);
    setTgTestStatus({ loading: false, success: true, message: 'Настройки Telegram сохранены!' });
    showToast('Настройки Telegram успешно сохранены');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-7xl h-[95vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden relative ${
          darkMode ? 'bg-[#151619] border-neutral-800 text-white' : 'bg-white border-neutral-200 text-gray-900'
        }`}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 right-16 z-70 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Navbar */}
        <div className="bg-[#0f1012] px-6 py-3.5 border-b border-neutral-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#e63946] flex items-center justify-center font-black text-white text-sm">
              PH
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide uppercase">
                Панель управления <span className="text-[#e63946]">PRO HOCKEY</span>
              </h2>
              <p className="text-[10px] text-gray-400">Управление заказами, товарами, хватами, загибами</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer font-bold"
              >
                <LogOut className="w-4 h-4" /> Выйти
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-800 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!isAuthenticated ? (
          /* Login Screen — SECURE WITHOUT SHOWING ANY PASSWORDS */
          <div className="flex-1 flex items-center justify-center p-6 bg-[#0f1012]/40">
            <div className="w-full max-w-sm p-8 rounded-3xl bg-neutral-900 border border-neutral-800 text-white text-center shadow-2xl">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#e63946]/10 border border-[#e63946]/30 flex items-center justify-center text-[#e63946]">
                <Lock className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-bold mb-1">Вход для администратора</h3>
              <p className="text-xs text-gray-400 mb-6">
                Для доступа к панели управления введите секретный ключ
              </p>

              {authError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs mb-4">
                  {authError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Введите пароль"
                  autoFocus
                  required
                  className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-center text-sm outline-none focus:border-[#e63946] transition font-mono tracking-widest"
                />

                <button
                  type="submit"
                  className="w-full bg-[#e63946] hover:bg-[#d02837] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#e63946]/30 transition cursor-pointer text-sm"
                >
                  Войти в систему
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Admin Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6 bg-neutral-50 dark:bg-neutral-900/60 overflow-x-auto">
              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'products'
                    ? 'border-[#e63946] text-[#e63946]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Каталог товаров ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'orders'
                    ? 'border-[#e63946] text-[#e63946]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Поступившие заказы ({orders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'categories'
                    ? 'border-[#e63946] text-[#e63946]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Категории & Бренды</span>
              </button>

              <button
                onClick={() => setActiveTab('telegram')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'telegram'
                    ? 'border-[#e63946] text-[#e63946]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Telegram Бот</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* TAB 1: PRODUCTS (with full хват, загиб, варианты inline editing) */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  {/* Form: Add product */}
                  <div
                    className={`p-5 rounded-3xl border ${
                      darkMode ? 'bg-neutral-900/90 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2 text-[#e63946]">
                      <Plus className="w-4 h-4" /> Добавить новый товар в магазин
                    </h3>

                    <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block font-bold mb-1">Название товара *</label>
                          <input
                            type="text"
                            value={newProdName}
                            onChange={(e) => setNewProdName(e.target.value)}
                            placeholder="Например: Клюшка WARRIOR COVERT QR5 PRO GRIP SR"
                            required
                            className="w-full p-2.5 rounded-xl border dark:bg-neutral-800 dark:border-neutral-700 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">Базовая цена (BYN) *</label>
                          <input
                            type="number"
                            step="0.01"
                            value={newProdPrice}
                            onChange={(e) => setNewProdPrice(e.target.value)}
                            placeholder="790.00"
                            required
                            className="w-full p-2.5 rounded-xl border font-bold text-[#e63946] dark:bg-neutral-800 dark:border-neutral-700 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block font-bold mb-1">URL фото товара (прямая ссылка) *</label>
                          <input
                            type="url"
                            value={newProdImage}
                            onChange={(e) => setNewProdImage(e.target.value)}
                            placeholder="https://icecity.by/thumb-product/286657_0_3569.png"
                            required
                            className="w-full p-2.5 rounded-xl border dark:bg-neutral-800 dark:border-neutral-700 outline-none font-mono text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">Категория</label>
                          <select
                            value={newProdCat}
                            onChange={(e) => setNewProdCat(Number(e.target.value))}
                            className="w-full p-2.5 rounded-xl border dark:bg-neutral-800 dark:border-neutral-700 outline-none"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold mb-1">Бренд</label>
                          <select
                            value={newProdBrand}
                            onChange={(e) => setNewProdBrand(e.target.value)}
                            className="w-full p-2.5 rounded-xl border dark:bg-neutral-800 dark:border-neutral-700 outline-none"
                          >
                            <option value="">Без бренда</option>
                            {brands.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold mb-1">
                            Варианты (Размеры, Жесткость, Flex через запятую)
                          </label>
                          <input
                            type="text"
                            value={newProdVariants}
                            onChange={(e) => setNewProdVariants(e.target.value)}
                            placeholder="Flex 65, Flex 75, Flex 85, Flex 100"
                            className="w-full p-2.5 rounded-xl border dark:bg-neutral-800 dark:border-neutral-700 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Описание товара</label>
                        <textarea
                          rows={2}
                          value={newProdDesc}
                          onChange={(e) => setNewProdDesc(e.target.value)}
                          placeholder="Характеристики, технологии, уровень экипировки..."
                          className="w-full p-2.5 rounded-xl border dark:bg-neutral-800 dark:border-neutral-700 outline-none resize-none"
                        />
                      </div>

                      {/* Specs section (хват / загиб) */}
                      <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30">
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={newProdHasSpecs}
                            onChange={(e) => setNewProdHasSpecs(e.target.checked)}
                            className="w-4 h-4 rounded text-[#e63946]"
                          />
                          <span className="font-bold text-sm text-[#e63946]">
                            Дополнительные спец. параметры (хват / загиб)
                          </span>
                        </label>

                        {newProdHasSpecs && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-red-500/20">
                            <div>
                              <label className="block font-bold mb-1 text-gray-300">
                                Хваты (через запятую):
                              </label>
                              <input
                                type="text"
                                value={newProdHand}
                                onChange={(e) => setNewProdHand(e.target.value)}
                                placeholder="Левый, Правый"
                                className="w-full p-2 rounded-lg border text-xs dark:bg-neutral-800 dark:border-neutral-700 outline-none"
                              />
                            </div>

                            <div>
                              <label className="block font-bold mb-1 text-gray-300">
                                Загибы / Крюки (через запятую):
                              </label>
                              <input
                                type="text"
                                value={newProdCurve}
                                onChange={(e) => setNewProdCurve(e.target.value)}
                                placeholder="P92, P28, P88, W03..."
                                className="w-full p-2 rounded-lg border text-xs dark:bg-neutral-800 dark:border-neutral-700 outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="py-3 px-6 bg-[#e63946] hover:bg-[#d02837] text-white font-bold rounded-xl transition cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#e63946]/30"
                      >
                        <Plus className="w-4 h-4" /> Опубликовать товар в каталог
                      </button>
                    </form>
                  </div>

                  {/* Table of products with full inline editing (matching admin.html) */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-black uppercase tracking-wide">
                          Все товары в базе ({products.length})
                        </h3>
                        <p className="text-xs text-gray-400">
                          Редактируйте прямо в таблице (хваты, загибы, фото, цены) и нажимайте 💾 Сохранить
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Сброс каталога к исходным',
                            message: 'Вы уверены, что хотите восстановить исходный список товаров и категорий? Все вручную добавленные товары будут сброшены.',
                            confirmLabel: 'Сбросить каталог',
                            onConfirm: () => {
                              onResetCatalog();
                              setEditedProducts({});
                              showToast('Каталог сброшен к исходным товарам');
                              setConfirmDialog(null);
                            },
                          });
                        }}
                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800"
                        title="Восстановить исходный каталог"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Сбросить к исходным
                      </button>
                    </div>

                    <div className="overflow-x-auto border rounded-2xl border-neutral-200 dark:border-neutral-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-gray-400 uppercase font-bold text-[11px]">
                          <tr>
                            <th className="p-3 w-40">Фото & URL</th>
                            <th className="p-3">Название, Описание и Варианты</th>
                            <th className="p-3 w-56">Спецификации (Хват / Загиб)</th>
                            <th className="p-3 w-44">Категория / Цена</th>
                            <th className="p-3 w-28 text-center">Действие</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                          {products.map((p) => {
                            const cur = getProductState(p);
                            const isSaved = savedRowId === p.id;
                            return (
                              <tr
                                key={p.id}
                                className={`transition-colors ${
                                  isSaved
                                    ? 'bg-emerald-500/10'
                                    : 'hover:bg-neutral-500/5'
                                }`}
                              >
                                {/* Column 1: Photo & Image URL */}
                                <td className="p-3 align-top">
                                  <div className="w-20 h-20 rounded-xl bg-white p-1 border border-neutral-300 dark:border-neutral-700 mb-2 flex items-center justify-center overflow-hidden">
                                    <img
                                      src={cur.imageUrl}
                                      alt={cur.name}
                                      className="max-h-full max-w-full object-contain"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src =
                                          'https://icecity.by/thumb-product/286657_0_3569.png';
                                      }}
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={cur.imageUrl}
                                    onChange={(e) =>
                                      updateProductField(p.id, 'imageUrl', e.target.value)
                                    }
                                    placeholder="URL фото"
                                    className="w-full p-1.5 rounded border text-[10px] font-mono dark:bg-neutral-800 dark:border-neutral-700"
                                  />
                                </td>

                                {/* Column 2: Name, Description, Variants */}
                                <td className="p-3 align-top space-y-1.5">
                                  <input
                                    type="text"
                                    value={cur.name}
                                    onChange={(e) =>
                                      updateProductField(p.id, 'name', e.target.value)
                                    }
                                    className="w-full p-1.5 rounded border font-bold text-xs dark:bg-neutral-800 dark:border-neutral-700"
                                    placeholder="Название товара"
                                  />
                                  <textarea
                                    rows={2}
                                    value={cur.description}
                                    onChange={(e) =>
                                      updateProductField(p.id, 'description', e.target.value)
                                    }
                                    className="w-full p-1.5 rounded border text-[11px] dark:bg-neutral-800 dark:border-neutral-700 resize-none"
                                    placeholder="Описание товара"
                                  />
                                  <div>
                                    <span className="text-[10px] text-gray-400 block font-semibold">
                                      Варианты (Flex, размеры):
                                    </span>
                                    <input
                                      type="text"
                                      value={cur.variants || ''}
                                      onChange={(e) =>
                                        updateProductField(p.id, 'variants', e.target.value)
                                      }
                                      placeholder="Flex 65, Flex 75, Flex 85..."
                                      className="w-full p-1.5 rounded border text-[11px] dark:bg-neutral-800 dark:border-neutral-700"
                                    />
                                  </div>
                                </td>

                                {/* Column 3: Specs (Хват / Загиб) */}
                                <td className="p-3 align-top space-y-2 bg-neutral-500/5 rounded-xl">
                                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-[#e63946]">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(cur.hasSpecs)}
                                      onChange={(e) =>
                                        updateProductField(p.id, 'hasSpecs', e.target.checked)
                                      }
                                      className="rounded"
                                    />
                                    <span>Вкл. хват / загиб</span>
                                  </label>

                                  <div>
                                    <span className="text-[10px] text-gray-400 block font-semibold">
                                      Хваты:
                                    </span>
                                    <input
                                      type="text"
                                      value={cur.handOptions || ''}
                                      onChange={(e) =>
                                        updateProductField(p.id, 'handOptions', e.target.value)
                                      }
                                      placeholder="Левый, Правый"
                                      className="w-full p-1.5 rounded border text-[11px] dark:bg-neutral-800 dark:border-neutral-700"
                                    />
                                  </div>

                                  <div>
                                    <span className="text-[10px] text-gray-400 block font-semibold">
                                      Загибы:
                                    </span>
                                    <input
                                      type="text"
                                      value={cur.curveOptions || ''}
                                      onChange={(e) =>
                                        updateProductField(p.id, 'curveOptions', e.target.value)
                                      }
                                      placeholder="P92, P28, P88, W03..."
                                      className="w-full p-1.5 rounded border text-[11px] dark:bg-neutral-800 dark:border-neutral-700"
                                    />
                                  </div>
                                </td>

                                {/* Column 4: Category, Brand, Price */}
                                <td className="p-3 align-top space-y-2">
                                  <select
                                    value={cur.categoryId}
                                    onChange={(e) =>
                                      updateProductField(p.id, 'categoryId', Number(e.target.value))
                                    }
                                    className="w-full p-1.5 rounded border text-xs dark:bg-neutral-800 dark:border-neutral-700"
                                  >
                                    {categories.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>

                                  <select
                                    value={cur.brandId || ''}
                                    onChange={(e) =>
                                      updateProductField(
                                        p.id,
                                        'brandId',
                                        e.target.value ? Number(e.target.value) : undefined
                                      )
                                    }
                                    className="w-full p-1.5 rounded border text-xs dark:bg-neutral-800 dark:border-neutral-700"
                                  >
                                    <option value="">Без бренда</option>
                                    {brands.map((b) => (
                                      <option key={b.id} value={b.id}>
                                        {b.name}
                                      </option>
                                    ))}
                                  </select>

                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={cur.price}
                                      onChange={(e) =>
                                        updateProductField(
                                          p.id,
                                          'price',
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-full p-1.5 rounded border text-xs font-black text-[#e63946] dark:bg-neutral-800 dark:border-neutral-700"
                                    />
                                    <span className="font-bold text-[10px] text-gray-400">BYN</span>
                                  </div>
                                </td>

                                {/* Column 5: Save & Delete Buttons */}
                                <td className="p-3 align-top text-center space-y-1.5">
                                  <button
                                    onClick={() => handleSaveInlineProduct(p.id)}
                                    className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-sm transition"
                                    title="Сохранить изменения товара"
                                  >
                                    {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                                    <span>{isSaved ? 'Сохранено' : 'Сохранить'}</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setConfirmDialog({
                                        isOpen: true,
                                        title: 'Удаление товара',
                                        message: `Удалить товар "${cur.name}" из каталога безвозвратно?`,
                                        confirmLabel: 'Удалить товар',
                                        onConfirm: () => {
                                          onDeleteProduct(p.id);
                                          setEditedProducts((prev) => {
                                            const copy = { ...prev };
                                            delete copy[p.id];
                                            return copy;
                                          });
                                          showToast(`Товар "${cur.name}" удалён`);
                                          setConfirmDialog(null);
                                        },
                                      });
                                    }}
                                    className="w-full py-1.5 px-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition"
                                    title="Удалить товар"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Удалить</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-black uppercase">Поступившие заказы</h3>
                      <p className="text-xs text-gray-400">
                        Все поступающие заказы отображаются здесь и отправляются в Telegram
                      </p>
                    </div>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-semibold">Заказов пока нет</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border rounded-2xl border-neutral-200 dark:border-neutral-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-gray-400 uppercase font-bold">
                          <tr>
                            <th className="p-3 w-16"># ID</th>
                            <th className="p-3 w-28">Дата</th>
                            <th className="p-3 w-36">Клиент</th>
                            <th className="p-3 w-36">Телефон</th>
                            <th className="p-3">Состав заказа & Детали</th>
                            <th className="p-3 text-right w-28">Сумма</th>
                            <th className="p-3 text-center w-24">Действие</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                          {orders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-neutral-500/5">
                              <td className="p-3 font-mono font-bold text-[#e63946]">#{ord.id}</td>
                              <td className="p-3 text-gray-400 whitespace-nowrap">{ord.createdAt}</td>
                              <td className="p-3 font-bold">{ord.customerName}</td>
                              <td className="p-3 font-mono">
                                <a
                                  href={`tel:${ord.phone}`}
                                  className="text-blue-400 hover:underline"
                                >
                                  {ord.phone}
                                </a>
                              </td>
                              <td className="p-3">
                                <div className="font-medium whitespace-pre-line">{ord.items}</div>
                                {ord.city && (
                                  <div className="text-[11px] text-gray-400 mt-1">
                                    📍 Адрес: {ord.city}
                                  </div>
                                )}
                                {ord.comment && (
                                  <div className="text-[11px] text-amber-400 italic mt-0.5">
                                    💬 "{ord.comment}"
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-right font-black text-sm text-[#e63946] whitespace-nowrap">
                                {ord.total.toFixed(2)} BYN
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      title: 'Удаление заказа',
                                      message: `Удалить заказ #${ord.id} клиента ${ord.customerName} на сумму ${ord.total.toFixed(2)} BYN?`,
                                      confirmLabel: 'Удалить заказ',
                                      onConfirm: () => {
                                        onDeleteOrder(ord.id);
                                        showToast(`Заказ #${ord.id} удален`);
                                        setConfirmDialog(null);
                                      },
                                    });
                                  }}
                                  className="py-1 px-2.5 bg-neutral-700 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                  title="Удалить заказ"
                                >
                                  Удалить
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CATEGORIES & BRANDS */}
              {activeTab === 'categories' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Categories */}
                  <div
                    className={`p-5 rounded-3xl border ${
                      darkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#e63946]" /> Управление категориями
                    </h3>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (newCatName.trim()) {
                          onAddCategory(newCatName.trim());
                          showToast(`Категория "${newCatName.trim()}" добавлена`);
                          setNewCatName('');
                        }
                      }}
                      className="flex gap-2 mb-4"
                    >
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Новая категория..."
                        className="flex-1 p-2 rounded-xl border text-xs dark:bg-neutral-800 dark:border-neutral-700 outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#e63946] text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Добавить
                      </button>
                    </form>

                    <div className="space-y-1.5">
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex justify-between items-center p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                        >
                          <span className="font-bold">{cat.name}</span>
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Удаление категории',
                                message: `Удалить категорию "${cat.name}"?`,
                                confirmLabel: 'Удалить',
                                onConfirm: () => {
                                  onDeleteCategory(cat.id);
                                  showToast(`Категория "${cat.name}" удалена`);
                                  setConfirmDialog(null);
                                },
                              });
                            }}
                            className="text-gray-400 hover:text-red-500 cursor-pointer p-1"
                            title="Удалить категорию"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Brands */}
                  <div
                    className={`p-5 rounded-3xl border ${
                      darkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#e63946]" /> Управление брендами
                    </h3>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (newBrandName.trim()) {
                          onAddBrand(newBrandName.trim());
                          showToast(`Бренд "${newBrandName.trim()}" добавлен`);
                          setNewBrandName('');
                        }
                      }}
                      className="flex gap-2 mb-4"
                    >
                      <input
                        type="text"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        placeholder="Новый бренд..."
                        className="flex-1 p-2 rounded-xl border text-xs dark:bg-neutral-800 dark:border-neutral-700 outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#e63946] text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Добавить
                      </button>
                    </form>

                    <div className="space-y-1.5">
                      {brands.map((br) => (
                        <div
                          key={br.id}
                          className="flex justify-between items-center p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                        >
                          <span className="font-bold">{br.name}</span>
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Удаление бренда',
                                message: `Удалить бренд "${br.name}"?`,
                                confirmLabel: 'Удалить',
                                onConfirm: () => {
                                  onDeleteBrand(br.id);
                                  showToast(`Бренд "${br.name}" удален`);
                                  setConfirmDialog(null);
                                },
                              });
                            }}
                            className="text-gray-400 hover:text-red-500 cursor-pointer p-1"
                            title="Удалить бренд"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: TELEGRAM SETTINGS */}
              {activeTab === 'telegram' && (
                <div className="max-w-xl mx-auto space-y-6">
                  <div
                    className={`p-6 rounded-3xl border ${
                      darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">Интеграция с Telegram Ботом</h3>
                        <p className="text-xs text-gray-400">
                          При каждом новом заказе бот отправляет уведомление в указанный чат
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveTelegram} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-bold mb-1">Telegram Bot Token</label>
                        <input
                          type="text"
                          value={localTg.botToken}
                          onChange={(e) => setLocalTg({ ...localTg, botToken: e.target.value })}
                          placeholder="8686923435:AAEHy9YL..."
                          className="w-full p-2.5 rounded-lg border font-mono dark:bg-neutral-800 dark:border-neutral-700 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Telegram Chat ID</label>
                        <input
                          type="text"
                          value={localTg.chatId}
                          onChange={(e) => setLocalTg({ ...localTg, chatId: e.target.value })}
                          placeholder="1111122600"
                          className="w-full p-2.5 rounded-lg border font-mono dark:bg-neutral-800 dark:border-neutral-700 outline-none"
                        />
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localTg.enabled}
                          onChange={(e) => setLocalTg({ ...localTg, enabled: e.target.checked })}
                          className="rounded text-[#e63946]"
                        />
                        <span className="font-bold">Включить автоматическую отправку уведомлений</span>
                      </label>

                      {tgTestStatus.message && (
                        <div
                          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                            tgTestStatus.success
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}
                        >
                          {tgTestStatus.success ? (
                            <CheckCircle className="w-4 h-4 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                          )}
                          <span>{tgTestStatus.message}</span>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-[#e63946] hover:bg-[#d02837] text-white font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Save className="w-4 h-4" /> Сохранить настройки
                        </button>

                        <button
                          type="button"
                          onClick={handleTestTelegram}
                          disabled={tgTestStatus.loading}
                          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          <span>{tgTestStatus.loading ? 'Проверка...' : 'Тест'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Confirmation Modal (Replaces window.confirm) */}
        {confirmDialog && confirmDialog.isOpen && (
          <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div
              className={`w-full max-w-md p-6 rounded-3xl shadow-2xl border text-center ${
                darkMode ? 'bg-[#1e1f24] border-neutral-700 text-white' : 'bg-white border-neutral-300 text-gray-900'
              }`}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
                <AlertCircle className="w-6 h-6" />
              </div>

              <h4 className="text-base font-black mb-1">{confirmDialog.title}</h4>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                {confirmDialog.message}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-600 hover:bg-neutral-700 text-xs font-bold cursor-pointer transition"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-red-600/30 transition"
                >
                  {confirmDialog.confirmLabel || 'Удалить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
