import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Skin, Cat, PlayerProfile } from '../types';
import { CatRenderer } from './CatRenderer';
import { X, Sparkles, Check, ShoppingBag, CreditCard, ShieldCheck, Star, Sparkle, Percent, Receipt } from 'lucide-react';
import { triggerHaptic } from '../utils/audio';
import { MacCatWindowFrame } from './MacCatWindowFrame';
import { CONSUMABLE_ITEMS } from '../hooks/useGameState';

interface ShopProduct {
  id: string;
  name: string;
  description: string;
  emoji?: string;
  cost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'skins' | 'accessories' | 'food' | 'hygiene';
  subcategory: string;
  originalItem: Skin | typeof CONSUMABLE_ITEMS[0];
}

interface ShopWindowProps {
  profile: PlayerProfile | null;
  activeCat: Cat | undefined;
  allSkins: Skin[];
  onPurchase: (skinId: string) => void;
  onApply: (catId: string, skinId: string) => void;
  onDonatePaws: (amount: number) => void;
  onClose: () => void;
  onMinimize: () => void;
  onRedeemPromo?: (code: string) => { success: boolean; message: string };
}

const DONATION_PACKS = [
  { id: 'pack_100', paws: 100, priceUah: 49, desc: 'Начальный набор лапок для мелких покупок.', badge: 'Популярно', icon: '🪙' },
  { id: 'pack_300', paws: 300, priceUah: 129, desc: 'Хороший старт. Хватит на пару крутых очков!', badge: 'Выгода 12%', icon: '🎒' },
  { id: 'pack_500', paws: 500, priceUah: 199, desc: 'Золотой стандарт. Отличный баланс цены и объема.', badge: 'Рекомендовано', icon: '💼' },
  { id: 'pack_1200', paws: 1200, priceUah: 399, desc: 'Премиум кошелек. Нарядите всех котиков!', badge: 'Скидка 20%', icon: '🏺' },
  { id: 'pack_3000', paws: 3000, priceUah: 799, desc: 'Кошачий олигарх! Разблокируйте вообще всё.', badge: 'Скидка 33%', icon: '🏦' },
];

export const ShopWindow: React.FC<ShopWindowProps> = ({
  profile,
  activeCat,
  allSkins,
  onPurchase,
  onApply,
  onDonatePaws,
  onClose,
  onMinimize,
  onRedeemPromo,
}) => {
  const [activeTab, setActiveTab] = useState<'skins' | 'accessories' | 'food' | 'hygiene' | 'topup'>('skins');
  const [selectedSkinId, setSelectedSkinId] = useState<string>(allSkins[0]?.id || '');

  // Dynamic mapping of all items to a generic structure
  const shopProducts = React.useMemo<ShopProduct[]>(() => {
    const products: ShopProduct[] = [];

    // Add skins and accessories from allSkins
    allSkins.forEach(skin => {
      if (!skin.accessory) {
        products.push({
          id: skin.id,
          name: skin.name,
          description: skin.description,
          cost: skin.cost,
          rarity: skin.rarity,
          category: 'skins',
          subcategory: 'Кошачьи окрасы',
          originalItem: skin
        });
      } else {
        // Detect subcategory for accessory dynamically from its key/id!
        let subcat = 'Другие аксессуары';
        const accId = skin.accessory.toLowerCase();
        if (accId.includes('boots') || accId.includes('footwear') || accId.includes('shoes') || accId.includes('tapochki') || accId.includes('sapozhki')) {
          subcat = 'Обувь и Лапки 🥾';
        } else if (accId.includes('hat') || accId.includes('halo') || accId.includes('crown') || accId.includes('cap') || accId.includes('shlyapa') || accId.includes('kolpak')) {
          subcat = 'Головные уборы 🎩';
        } else if (accId.includes('glasses') || accId.includes('eyewear') || accId.includes('headphones') || accId.includes('ochki') || accId.includes('naushniki')) {
          subcat = 'Очки и Наушники 🕶️';
        } else if (accId.includes('collar') || accId.includes('bell') || accId.includes('ribbon') || accId.includes('bow') || accId.includes('scarf') || accId.includes('osheynik') || accId.includes('bantik') || accId.includes('sharf')) {
          subcat = 'Шейные украшения 🎀';
        } else if (accId.includes('wings') || accId.includes('krylya')) {
          subcat = 'Спина и Крылья 🦋';
        }

        products.push({
          id: skin.id,
          name: skin.name,
          description: skin.description,
          cost: skin.cost,
          rarity: skin.rarity,
          category: 'accessories',
          subcategory: subcat,
          originalItem: skin
        });
      }
    });

    // Add food and hygiene from CONSUMABLE_ITEMS
    CONSUMABLE_ITEMS.forEach(cons => {
      const isFood = cons.type === 'food';
      products.push({
        id: cons.id,
        name: cons.name,
        description: cons.description,
        emoji: cons.emoji,
        cost: cons.cost,
        rarity: cons.rarity,
        category: isFood ? 'food' : 'hygiene',
        subcategory: isFood ? 'Корм и Лакомства 🐟' : cons.type === 'soap' ? 'Мыло и Пенка 🧼' : 'Кошачьи Игрушки 🐭',
        originalItem: cons
      });
    });

    return products;
  }, [allSkins]);

  const [checkoutPack, setCheckoutPack] = useState<typeof DONATION_PACKS[0] | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'maccat_pay_sheet' | 'processing' | 'success'>('idle');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoError, setPromoError] = useState('');

  const [isEditingCard, setIsEditingCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('7777 7777 7777 7777');
  const [cardHolder, setCardHolder] = useState('Maksym Skorina Signature');
  const [cardExpiry, setCardExpiry] = useState('12/30');

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    id: string;
    date: string;
    cardHolder: string;
    cardNumber: string;
    paws: number;
    priceUah: number;
    appliedPromo: string | null;
    discount: number;
    total: number;
  } | null>(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;
    
    if (diffY > 100 && Math.abs(diffX) < 60) {
      onMinimize();
    }
  };

  if (!profile || !activeCat) return null;

  const selectedItem = React.useMemo(() => {
    const found = shopProducts.find(p => p.id === selectedSkinId);
    if (found) return found;
    // Fallback to first product in current active category
    const categoryProducts = shopProducts.filter(p => p.category === activeTab);
    return categoryProducts[0] || shopProducts[0];
  }, [shopProducts, selectedSkinId, activeTab]);

  const categorizedProducts = React.useMemo<Record<string, ShopProduct[]>>(() => {
    if (activeTab === 'topup') return {};
    
    const filtered = shopProducts.filter(p => p.category === activeTab);
    
    // Group by subcategory
    const groups: Record<string, ShopProduct[]> = {};
    filtered.forEach(p => {
      const sub = p.subcategory || 'Общие';
      if (!groups[sub]) {
        groups[sub] = [];
      }
      groups[sub].push(p);
    });
    
    return groups;
  }, [shopProducts, activeTab]);

  const isConsumableProduct = selectedItem.category === 'food' || selectedItem.category === 'hygiene';

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
      case 'epic':
        return 'bg-purple-500/15 border-purple-500/30 text-purple-400';
      case 'rare':
        return 'bg-sky-500/15 border-sky-500/30 text-sky-400';
      default:
        return 'bg-slate-500/15 border-white/10 text-slate-400';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'Легендарный';
      case 'epic': return 'Эпический';
      case 'rare': return 'Редкий';
      default: return 'Обычный';
    }
  };

  const isAccessory = selectedItem.category === 'accessories';
  const previewSkin = isAccessory ? activeCat.skinId : selectedItem.id;
  const previewAccessory = isAccessory ? (selectedItem.originalItem as any).accessory : (activeCat as any).accessory;

  const activeSkinColors = () => {
    const s = allSkins.find((item) => item.id === previewSkin);
    if (s) {
      return { color: s.color, patternColor: s.patternColor, eyeColor: s.eyeColor };
    }
    return { color: '#ffccd5', patternColor: '#ff85a1', eyeColor: '#0ea5e9' };
  };

  const colors = activeSkinColors();

  const handleCheckoutStart = (pack: typeof DONATION_PACKS[0]) => {
    triggerHaptic();
    setCheckoutPack(pack);
    setPromoInput('');
    setPromoError('');
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPaymentStatus('maccat_pay_sheet');
  };

  const applyPromoCode = () => {
    triggerHaptic();
    const cleanPromo = promoInput.trim().toUpperCase();
    if (!cleanPromo) {
      setPromoError('Введите промокод');
      return;
    }

    if (onRedeemPromo) {
      const res = onRedeemPromo(cleanPromo);
      if (res.success) {
        setAppliedPromo(cleanPromo);
        if (cleanPromo === 'ILOVEAMINA') {
          setPromoDiscount(1.0);
        } else if (cleanPromo === 'MAKSMINIMALISM') {
          setPromoDiscount(0.5);
        } else if (cleanPromo === 'MAKSPAY') {
          setPromoDiscount(0.3);
        } else {
          setPromoDiscount(0.2);
        }
        setPromoError('');
      } else {
        setPromoError(res.message);
        setAppliedPromo(null);
        setPromoDiscount(0);
      }
    } else {
      if (cleanPromo === 'ILOVEAMINA') {
        setAppliedPromo('ILOVEAMINA');
        setPromoDiscount(1.0);
        setPromoError('');
      } else if (cleanPromo === 'MAKSMINIMALISM') {
        setAppliedPromo('MAKSMINIMALISM');
        setPromoDiscount(0.5);
        setPromoError('');
      } else if (cleanPromo === 'MAKSPAY') {
        setAppliedPromo('MAKSPAY');
        setPromoDiscount(0.3);
        setPromoError('');
      } else {
        setPromoError('Неверный или уже использованный промокод');
        setAppliedPromo(null);
        setPromoDiscount(0);
      }
    }
  };

  const confirmPayment = () => {
    triggerHaptic();
    setPaymentStatus('processing');

    setTimeout(() => {
      setPaymentStatus('success');
      
      if (checkoutPack) {
        onDonatePaws(checkoutPack.paws);

        const transId = `MP-${Math.floor(100000 + Math.random() * 900000)}`;
        const now = new Date();
        const formattedDate = now.toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        setReceiptData({
          id: transId,
          date: formattedDate,
          cardHolder: cardHolder || 'Maksym Skorina Signature',
          cardNumber: cardNumber || '7777 7777 7777 7777',
          paws: checkoutPack.paws,
          priceUah: checkoutPack.priceUah,
          appliedPromo: appliedPromo,
          discount: promoDiscount,
          total: Math.max(0, Math.round(checkoutPack.priceUah * (1 - promoDiscount))),
        });
      }
    }, 1800);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <MacCatWindowFrame
      id="shop"
      onClose={onClose}
      onMinimize={onMinimize}
      title="Кошачий бутик & Банк"
      subtitle="Магазин"
      headerRight={
        <div className="flex items-center gap-1.5 bg-sky-500/10 border border-sky-400/20 px-3 py-1 rounded-full pointer-events-auto shrink-0">
          <span className="text-xs text-sky-400 font-extrabold font-mono">
            🐾 {profile.paws}
          </span>
        </div>
      }
    >
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
        
        {activeTab !== 'topup' && (
          <div className="w-full lg:w-60 bg-black/25 border-b lg:border-b-0 lg:border-r border-white/5 p-4 flex flex-col items-center justify-center text-center shrink-0 max-lg:py-3">
            {isConsumableProduct ? (
              <>
                <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase mb-2 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                  Карточка товара
                </span>

                <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center shadow-inner relative overflow-hidden animate-fade-in">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10" />
                  <span className="text-6xl filter drop-shadow-md animate-pulse">{selectedItem.emoji}</span>
                  <div className="absolute bottom-2 bg-black/50 border border-white/10 px-2 py-0.5 rounded-full text-[9px] text-slate-300 font-mono">
                    В запасе: <span className="font-bold text-amber-300">{profile.inventory?.[selectedItem.id] || 0} шт</span>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-white mt-3">{selectedItem.name}</h3>
                
                <div className={`mt-1 px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${getRarityStyle(selectedItem.rarity)}`}>
                  {getRarityLabel(selectedItem.rarity)}
                </div>

                <div className="mt-2.5 space-y-1 bg-white/5 border border-white/5 p-2 rounded-xl w-full text-left text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Действие:</span>
                    <span className="font-extrabold text-white">
                      {(selectedItem.originalItem as any).type === 'food' ? '🍗 Насыщение' : (selectedItem.originalItem as any).type === 'soap' ? '🧼 Гигиена' : '🎾 Радость'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Эффект:</span>
                    <span className="font-extrabold text-emerald-400">+{(selectedItem.originalItem as any).boost}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Опыт кота:</span>
                    <span className="font-extrabold text-sky-400">+{(selectedItem.originalItem as any).xpBoost} XP</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 mt-2 max-w-xs leading-normal max-lg:hidden">
                  {selectedItem.description}
                </p>

                <div className="w-full mt-3">
                  <button
                    onClick={() => {
                      triggerHaptic();
                      onPurchase(selectedItem.id);
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-[11px] cursor-pointer flex items-center justify-center gap-1 transition-all active:scale-95 border border-emerald-400/15 shadow-lg shadow-emerald-500/10 min-h-[44px]"
                  >
                    <ShoppingBag size={11} />
                    <span>Купить за 🐾 {selectedItem.cost}</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase mb-2 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                  Кабина примерки
                </span>

                <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shadow-inner relative overflow-hidden">
                  <CatRenderer
                    breed={isAccessory ? activeCat.breed : (selectedItem.originalItem as any).breed}
                    color={colors.color}
                    patternColor={colors.patternColor}
                    eyeColor={colors.eyeColor}
                    accessory={previewAccessory}
                    status="idle"
                    size={110}
                  />
                </div>

                <h3 className="text-xs font-bold text-white mt-3">{selectedItem.name}</h3>
                
                <div className={`mt-1 px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${getRarityStyle(selectedItem.rarity)}`}>
                  {getRarityLabel(selectedItem.rarity)}
                </div>

                <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal max-lg:hidden">
                  {selectedItem.description}
                </p>

                <div className="w-full mt-3">
                  {profile.unlockedSkins.includes(selectedItem.id) ? (
                    <button
                      onClick={() => {
                        triggerHaptic();
                        onApply(activeCat.id, selectedItem.id);
                      }}
                      className={`w-full py-3 rounded-xl font-bold text-[11px] cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-95 border min-h-[44px] ${
                        activeCat.skinId === selectedItem.id || (isAccessory && (activeCat as any).accessory === selectedItem.originalItem.accessory)
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-black'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
                      }`}
                    >
                      {activeCat.skinId === selectedItem.id || (isAccessory && (activeCat as any).accessory === selectedItem.originalItem.accessory) ? (
                        <>
                          <Check size={11} />
                          <span>Надето</span>
                        </>
                      ) : (
                        <span>Надеть</span>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        triggerHaptic();
                        onPurchase(selectedItem.id);
                      }}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold text-[11px] cursor-pointer flex items-center justify-center gap-1 transition-all active:scale-95 border border-sky-400/15 shadow-lg shadow-sky-500/10 min-h-[44px]"
                    >
                      <ShoppingBag size={11} />
                      <span>Купить за 🐾 {selectedItem.cost}</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto flex flex-col bg-slate-950/20 p-4 md:p-5">
          <div className="flex bg-black/40 border border-white/5 rounded-xl p-0.5 max-w-md self-center lg:self-start mb-4 text-[11px] font-bold overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('skins');
                const firstSkin = shopProducts.find(p => p.category === 'skins');
                if (firstSkin) setSelectedSkinId(firstSkin.id);
              }}
              className={`px-4 py-2.5 rounded-lg transition-all cursor-pointer min-h-[44px] whitespace-nowrap ${
                activeTab === 'skins' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Кошачьи окрасы
            </button>
            <button
              onClick={() => {
                setActiveTab('accessories');
                const firstAcc = shopProducts.find(p => p.category === 'accessories');
                if (firstAcc) setSelectedSkinId(firstAcc.id);
              }}
              className={`px-4 py-2.5 rounded-lg transition-all cursor-pointer min-h-[44px] whitespace-nowrap ${
                activeTab === 'accessories' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Аксессуары
            </button>
            <button
              onClick={() => {
                setActiveTab('food');
                const firstFood = shopProducts.find(p => p.category === 'food');
                if (firstFood) setSelectedSkinId(firstFood.id);
              }}
              className={`px-4 py-2.5 rounded-lg transition-all cursor-pointer min-h-[44px] whitespace-nowrap ${
                activeTab === 'food' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Питание
            </button>
            <button
              onClick={() => {
                setActiveTab('hygiene');
                const firstHyg = shopProducts.find(p => p.category === 'hygiene');
                if (firstHyg) setSelectedSkinId(firstHyg.id);
              }}
              className={`px-4 py-2.5 rounded-lg transition-all cursor-pointer min-h-[44px] whitespace-nowrap ${
                activeTab === 'hygiene' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Гигиена
            </button>
            <button
              onClick={() => setActiveTab('topup')}
              className={`px-4 py-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 min-h-[44px] whitespace-nowrap ${
                activeTab === 'topup' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Пополнить</span>
            </button>
          </div>

          {activeTab !== 'topup' ? (
            <div className="flex-1 flex flex-col space-y-6 pb-3">
              {Object.entries(categorizedProducts).map(([subcatName, productsValue]) => {
                const products = productsValue as ShopProduct[];
                return (
                  <div key={subcatName} className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-1 flex items-center gap-1.5">
                      <Sparkle size={10} className="text-sky-400" />
                      {subcatName} ({products.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {products.map((item) => {
                        const isSelected = item.id === selectedSkinId;
                        const isConsumable = item.category === 'food' || item.category === 'hygiene';
                        const currentQty = profile.inventory?.[item.id] || 0;
                        
                        const isUnlocked = profile.unlockedSkins.includes(item.id);
                        const isEquipped = activeCat.skinId === item.id || ((item.originalItem as any).accessory && (activeCat as any).accessory === (item.originalItem as any).accessory);

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              triggerHaptic();
                              setSelectedSkinId(item.id);
                            }}
                            className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center justify-between group h-[135px] ${
                              isSelected
                                ? 'bg-sky-500/10 border-sky-500 shadow-md'
                                : 'bg-white/5 border-transparent hover:bg-white/10'
                            }`}
                          >
                            {isConsumable && currentQty > 0 && (
                              <div className="absolute top-1.5 left-1.5 bg-amber-500 text-black font-extrabold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {currentQty} шт
                              </div>
                            )}

                            {!isConsumable && isEquipped && (
                              <div className="absolute top-1.5 left-1.5 bg-emerald-500 text-white font-extrabold text-[7px] px-1 py-0.5 rounded uppercase tracking-wider">
                                Надето
                              </div>
                            )}

                            {!isConsumable && isUnlocked && !isEquipped && (
                              <div className="absolute top-1.5 right-1.5 bg-slate-500/10 text-slate-300 border border-slate-500/20 text-[7px] font-bold px-1 rounded uppercase">
                                В шкафу
                              </div>
                            )}

                            <div className="w-14 h-14 rounded-xl bg-black/40 flex items-center justify-center my-1.5 group-hover:scale-105 transition-transform overflow-hidden relative">
                              {isConsumable ? (
                                <span className="text-3xl">{item.emoji}</span>
                              ) : (
                                <CatRenderer
                                  breed={(item.originalItem as any).accessory ? activeCat.breed : (item.originalItem as Skin).breed}
                                  color={(item.originalItem as any).accessory ? (allSkins.find(s => s.id === activeCat.skinId) || allSkins[0]).color : (item.originalItem as Skin).color}
                                  patternColor={(item.originalItem as any).accessory ? (allSkins.find(s => s.id === activeCat.skinId) || allSkins[0]).patternColor : (item.originalItem as Skin).patternColor}
                                  eyeColor={(item.originalItem as any).accessory ? (allSkins.find(s => s.id === activeCat.skinId) || allSkins[0]).eyeColor : (item.originalItem as Skin).eyeColor}
                                  accessory={(item.originalItem as any).accessory ? (item.originalItem as Skin).accessory : undefined}
                                  status="idle"
                                  size={64}
                                />
                              )}
                            </div>

                            <div className="w-full">
                              <h4 className="text-[11px] font-bold text-slate-200 truncate leading-tight">{item.name}</h4>
                              <p className="text-[9px] text-sky-400 font-extrabold font-mono mt-0.5">
                                {isConsumable ? `🐾 ${item.cost}` : isUnlocked ? 'В наличии' : `🐾 ${item.cost}`}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="text-left bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div>
                  <h3 className="text-xs font-black text-white flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-400 animate-pulse" />
                    Магазин лапок Care OS
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                    Получайте лапки мгновенно для быстрой прокачки и разблокировки редких аксессуаров. Фиксированный курс: <span className="font-extrabold text-sky-400">500 лапок = 199 грн</span>.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-bold text-emerald-400 shrink-0 self-start sm:self-auto">
                  <ShieldCheck size={11} />
                  <span>Безопасная касса</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-2">
                {DONATION_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 hover:border-white/10 flex flex-col justify-between transition-all relative h-[145px]"
                  >
                    <span className="absolute top-2.5 right-2.5 text-[8px] font-bold bg-amber-500/20 border border-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full uppercase">
                      {pack.badge}
                    </span>

                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{pack.icon}</span>
                      <div className="text-left">
                        <h4 className="text-xs font-black text-white">+{pack.paws} лапок</h4>
                        <span className="text-[9px] text-slate-400 leading-none">{pack.desc}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 border-t border-white/5 pt-2.5">
                      <span className="text-xs font-black text-white">{pack.priceUah} грн</span>
                      <button
                        onClick={() => handleCheckoutStart(pack)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                      >
                        <CreditCard size={11} />
                        <span>Купить</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {checkoutPack && paymentStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-start p-3 sm:p-6 z-50 text-slate-100 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 150 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 150 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-full max-w-[400px] bg-neutral-950 border border-white/10 rounded-[24px] sm:rounded-[32px] p-4 sm:p-5 text-center space-y-3 shadow-2xl relative backdrop-blur-2xl my-auto h-auto shrink-0"
            >
              <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-gradient-to-tr from-amber-500/10 to-rose-500/0 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-tr from-sky-500/10 to-indigo-500/0 blur-2xl pointer-events-none" />

              {paymentStatus !== 'processing' && paymentStatus !== 'success' && (
                <button
                  onClick={() => { triggerHaptic(); setCheckoutPack(null); setPaymentStatus('idle'); }}
                  className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer active:scale-90"
                >
                  <X size={16} />
                </button>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-white font-sans flex items-center gap-1">
                     <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-sky-400 bg-clip-text text-transparent">MaksyPAY</span>
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 tracking-wide font-mono uppercase">
                  Apple-Style Checkout Engine
                </p>
              </div>

              {paymentStatus === 'maccat_pay_sheet' && (
                <div className="space-y-4 text-left">
                  <div className="relative h-38 rounded-2xl bg-gradient-to-tr from-zinc-900 via-neutral-900 to-zinc-950 border border-white/10 p-3 flex flex-col justify-between overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-amber-400/10 via-rose-400/5 to-transparent rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-mono tracking-widest text-slate-500 uppercase">MAKSY CARD</span>
                        {isEditingCard ? (
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-bold text-white focus:outline-none focus:border-amber-500 w-[140px]"
                            placeholder="Имя владельца"
                          />
                        ) : (
                          <h4 className="text-xs font-bold text-slate-300">{cardHolder}</h4>
                        )}
                      </div>
                      <button
                        onClick={() => { triggerHaptic(); setIsEditingCard(!isEditingCard); }}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/15 text-[8px] text-amber-300 font-bold transition-all cursor-pointer active:scale-95"
                      >
                        {isEditingCard ? 'Сохранить' : 'Изменить карту'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-2 py-1.5 rounded-xl h-[36px]">
                      <div className="w-6 h-4 bg-slate-700/50 rounded flex items-center justify-center text-[8px] font-mono text-slate-400 shrink-0">
                        ••••
                      </div>
                      {isEditingCard ? (
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          maxLength={19}
                          className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[11px] font-mono text-white focus:outline-none focus:border-amber-500 w-full"
                          placeholder="0000 0000 0000 0000"
                        />
                      ) : (
                        <span className="text-[11px] font-mono text-slate-300 tracking-wider truncate">
                          {cardNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="flex flex-col text-left">
                        <span className="text-[7px] font-mono text-slate-500 uppercase">EXP DATE</span>
                        {isEditingCard ? (
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            maxLength={5}
                            className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-white focus:outline-none focus:border-amber-500 w-[60px]"
                            placeholder="ММ/ГГ"
                          />
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">{cardExpiry}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                        <ShieldCheck size={11} className="text-emerald-400" /> Secure
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3 sm:p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400 font-medium">ТОВАР</span>
                      <span className="font-extrabold text-white flex items-center gap-1">
                        {checkoutPack.icon} {checkoutPack.paws} 🐾 лапок
                      </span>
                    </div>

                    <div className="h-[1px] bg-white/5" />

                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400 font-medium">АДРЕС</span>
                      <span className="text-slate-200 font-medium text-[11px] text-right truncate max-w-[200px]">
                        Cat Shelter Suite 1, Switzerland
                      </span>
                    </div>

                    {appliedPromo && (
                      <>
                        <div className="h-[1px] bg-white/5" />
                        <div className="flex justify-between items-center py-1 text-emerald-400">
                          <span className="flex items-center gap-1 font-medium">
                            <Percent size={11} /> ПРОМОКОД
                          </span>
                          <span className="font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px]">
                            {appliedPromo} (-{promoDiscount * 100}%)
                          </span>
                        </div>
                      </>
                    )}

                    <div className="h-[1px] bg-white/10" />

                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400 font-medium">ИТОГО К ОПЛАТЕ</span>
                      <div className="text-right">
                        {appliedPromo ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-xs text-slate-500 line-through">
                              {checkoutPack.priceUah} грн
                            </span>
                            <span className="text-sm font-black text-emerald-400">
                              {Math.max(0, Math.round(checkoutPack.priceUah * (1 - promoDiscount)))} грн
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-black text-white">
                            {checkoutPack.priceUah} грн
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 tracking-wide uppercase font-mono">
                      Промокод (попробуйте <span className="text-amber-400 font-extrabold">ILOVEAMINA</span>)
                    </label>
                    <div className="flex gap-2 h-[44px]">
                      <input
                        type="text"
                        placeholder="Промокод"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 uppercase font-mono tracking-wider h-full"
                      />
                      <button
                        onClick={applyPromoCode}
                        className="px-4 bg-white/10 hover:bg-white/15 active:scale-95 text-xs text-white font-bold rounded-xl transition-all cursor-pointer h-full"
                      >
                        Применить
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-[10px] text-rose-400 font-bold">{promoError}</p>
                    )}
                    {appliedPromo && (
                      <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                        ✓ Промокод применен! Скидка активирована.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={confirmPayment}
                    className="w-full h-12 rounded-2xl bg-white text-black hover:bg-slate-100 font-bold text-xs tracking-wide transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg mt-2"
                  >
                    <CreditCard size={13} />
                    <span>Подтвердить оплату с Apple Pay</span>
                  </button>
                </div>
              )}

              {paymentStatus === 'processing' && (
                <div className="py-10 flex flex-col items-center justify-center space-y-5">
                  <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-slate-200">Авторизация транзакции...</p>
                    <p className="text-[10px] text-slate-400">
                      Шлюз MaksyPAY шифрует соединение и проверяет баланс карты. Пожалуйста, не закрывайте окно.
                    </p>
                  </div>
                </div>
              )}

              {paymentStatus === 'success' && (
                <div className="space-y-4 py-4">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl animate-bounce shrink-0">
                      ✓
                    </div>
                    <h3 className="text-md font-bold text-white">Оплата успешно завершена!</h3>
                    <p className="text-xs text-slate-300">
                      На ваш баланс зачислено <span className="font-bold text-sky-400">+{checkoutPack?.paws} 🐾 лапок</span>.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => {
                        triggerHaptic();
                        setShowReceiptModal(true);
                      }}
                      className="w-full h-11 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Receipt size={13} />
                      <span>Посмотреть чек транзакции</span>
                    </button>

                    <button
                      onClick={() => {
                        triggerHaptic();
                        setCheckoutPack(null);
                        setPaymentStatus('idle');
                      }}
                      className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Закрыть</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="text-[9px] text-slate-500 border-t border-white/5 pt-3 flex items-center justify-center gap-1.5 shrink-0">
                <span>🔒 SSL-шифрование • Visa / MasterCard • MaksyPAY</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReceiptModal && receiptData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[60] pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-[340px] bg-zinc-950 border border-white/10 rounded-[28px] p-5 shadow-2xl flex flex-col space-y-4 max-h-[90%] overflow-y-auto"
            >
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center text-xl shrink-0">
                  ✓
                </div>
                <h3 className="text-sm font-bold text-white">Чек транзакции сохранен</h3>
                <p className="text-[9px] text-slate-400">Транзакция успешно обработана через MaksyPAY</p>
              </div>

              <div className="relative bg-white text-slate-900 p-5 rounded-2xl shadow-xl font-mono text-left text-xs border border-slate-200 overflow-hidden w-full">
                <div className="absolute top-0 left-0 right-0 h-2 bg-transparent flex justify-between overflow-hidden">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="w-3.5 h-3.5 bg-zinc-950 rounded-full shrink-0 -translate-y-2" />
                  ))}
                </div>

                <div className="pt-3 space-y-2">
                  <div className="text-center space-y-0.5">
                    <span className="text-sm font-black tracking-widest text-slate-900"> MaksyPAY</span>
                    <p className="text-[8px] text-slate-500 font-bold uppercase">ОФИЦИАЛЬНЫЙ ЧЕК ТРАНЗАКЦИИ</p>
                    <p className="text-[8px] text-slate-400 font-sans">ID: {receiptData.id}</p>
                  </div>

                  <div className="border-t border-dashed border-slate-300 my-1" />

                  <div className="space-y-1 text-[9px] font-semibold text-slate-700">
                    <div className="flex justify-between">
                      <span>ДАТА И ВРЕМЯ:</span>
                      <span className="text-slate-900 font-bold">{receiptData.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ПОСТАВЩИК:</span>
                      <span>MaksyPay-ShelterOS</span>
                    </div>
                    {/* Убрана строка "УСТРОЙСТВО" */}
                    <div className="flex justify-between">
                      <span>КАРТА:</span>
                      <span className="truncate max-w-[150px] font-mono text-slate-900 font-bold">{receiptData.cardNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ВЛАДЕЛЕЦ:</span>
                      <span className="truncate max-w-[150px] text-slate-900 font-bold">{receiptData.cardHolder}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-300 my-1" />

                  <div className="space-y-1 text-[9px] font-semibold text-slate-800">
                    <div className="flex justify-between">
                      <span>ТОВАР:</span>
                      <span className="font-bold text-slate-950">+{receiptData.paws} 🐾 Лапок</span>
                    </div>
                    <div className="flex justify-between">
                      <span>БАЗОВАЯ СУММА:</span>
                      <span>{receiptData.priceUah} UAH</span>
                    </div>
                    {receiptData.appliedPromo && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>СКИДКА ({receiptData.appliedPromo}):</span>
                        <span>-{receiptData.discount * 100}%</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t-2 border-double border-slate-400 my-1" />

                  <div className="flex justify-between text-xs font-black text-slate-900">
                    <span>ИТОГО ОПЛАЧЕНО:</span>
                    <span className="text-emerald-600 text-sm">
                      {receiptData.total} UAH
                    </span>
                  </div>

                  <div className="border-b border-dashed border-slate-300 my-1" />

                  <div className="text-center text-[8px] text-slate-400 space-y-0.5 pt-0.5">
                    <p>Спасибо за вашу щедрость и заботу! ♥</p>
                    <p className="font-bold text-slate-500">Maksym Skorina UI/UX Designs</p>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-2 bg-transparent flex justify-between overflow-hidden">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="w-3.5 h-3.5 bg-zinc-950 rounded-full shrink-0 translate-y-2" />
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic();
                  setShowReceiptModal(false);
                }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
              >
                <span>Закрыть чек и продолжить</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MacCatWindowFrame>
  );
};