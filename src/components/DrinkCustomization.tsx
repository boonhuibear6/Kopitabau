import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { trackCustomize, trackAddToCart, trackCustomizationChange } from "@/lib/analytics";
import { XCircle, Plus, Minus, Heart, RefreshCw, CupSoda, IceCream, Droplets, Check } from "lucide-react";

interface Drink {
  id: string;
  name: string;
  price: number;
  basePrice: number;
  image: string;
}

interface DrinkCustomizationProps {
  drink: Drink | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  cartItemCount?: number;
}

export interface CartItem {
  drinkId: string;
  name: string;
  image: string;
  basePrice: number;
  quantity: number;
  size: string;
  iceLevel: string;
  sweetness: string;
  addOns: string[];
  totalPrice: number;
}

export const DrinkCustomization = ({ drink, onClose, onAddToCart, cartItemCount = 0 }: DrinkCustomizationProps) => {
  const isMobile = useIsMobile();
  const [size, setSize] = useState("Regular");
  const [ice, setIce] = useState("Normal Ice");
  const [sweetness, setSweetness] = useState("Normal Sweetness");
  const [addOns, setAddOns] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [priceKey, setPriceKey] = useState(0); // For price animation
  const [animatedPrice, setAnimatedPrice] = useState(0);
  const previousDrinkIdRef = useRef<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Track price changes for animation
  useEffect(() => {
    if (!drink) return;
    
    const newPrice = calculatePrice();
    const isNewDrink = previousDrinkIdRef.current !== drink.id;
    previousDrinkIdRef.current = drink.id;
    
    // On new drink, set price immediately (no animation)
    if (isNewDrink || animatedPrice === 0) {
      setAnimatedPrice(newPrice);
      return;
    }
    
    const oldPrice = animatedPrice;
    
    // Trigger animation
    setPriceKey(prev => prev + 1);
    
    // Animate counting from old to new price
    if (oldPrice !== newPrice) {
      const duration = 400; // ms
      const startTime = Date.now();
      const difference = newPrice - oldPrice;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentPrice = oldPrice + (difference * easeOut);
        
        setAnimatedPrice(currentPrice);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setAnimatedPrice(newPrice);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      setAnimatedPrice(newPrice);
    }
  }, [drink, size, addOns, quantity, sweetness]);

  // Track customize step when dialog opens
  useEffect(() => {
    if (drink) {
      trackCustomize();
    }
  }, [drink]);

  // Scroll detection for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop;
        setIsScrolled(scrollTop > 20);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const calculatePrice = () => {
    let price = drink?.basePrice || drink?.price || 0;
    if (size === "Large") price += 2;
    if (addOns.includes("Oat Milk")) price += 2;
    if (addOns.includes("Almond Milk")) price += 2;
    if (addOns.includes("Extra Matcha")) price += 2;
    if (addOns.includes("Cream Cloud")) price += 3;
    return price * quantity;
  };

  const quickPickOptions = [
    { id: "bestseller", label: "Bestseller", icon: "🌟", size: "Regular", ice: "Normal Ice", sweetness: "Normal Sweetness", addOns: [], popular: true },
    { id: "less-sweet", label: "Less Sweet", icon: "🍬", size: "Regular", ice: "Normal Ice", sweetness: "Less Sweet", addOns: [] },
    { id: "zero-ice", label: "Zero Ice", icon: "❄️", size: "Regular", ice: "No Ice", sweetness: "Normal Sweetness", addOns: [] },
    { id: "large-sweet", label: "Large & Sweet", icon: "🍯", size: "Large", ice: "Normal Ice", sweetness: "Extra Sweet", addOns: [] },
  ];
  
  const iceOptions = [
    { id: "No Ice", label: "No Ice", icon: "❄️" },
    { id: "Less Ice", label: "Less Ice", icon: "🧊" },
    { id: "Normal Ice", label: "Normal", icon: "🧊" },
    { id: "Extra Ice", label: "Extra", icon: "🧊" },
  ];
  
  const sweetnessOptions = [
    { id: "Normal Sweetness", label: "100%", icon: "🍯" },
    { id: "Less Sweet", label: "50%", icon: "🍯" },
    { id: "No Sweetness", label: "0%", icon: "🍯" },
    { id: "Extra Sweet", label: "150%", icon: "🍯" },
  ];

  const addOnOptions = [
    { id: "Oat Milk", name: "Oat Milk", price: 2 },
    { id: "Almond Milk", name: "Almond Milk", price: 2 },
    { id: "Extra Matcha", name: "Extra Matcha", price: 2 },
    { id: "Cream Cloud", name: "Cream Cloud", price: 3 },
  ];

  const applyQuickPick = (option: typeof quickPickOptions[0]) => {
    setSize(option.size);
    setIce(option.ice);
    setSweetness(option.sweetness);
    setAddOns(option.addOns);
    trackCustomizationChange();
  };

  // Check if a quick pick matches current selection
  const isQuickPickActive = (option: typeof quickPickOptions[0]) => {
    return (
      size === option.size &&
      ice === option.ice &&
      sweetness === option.sweetness &&
      JSON.stringify(addOns.sort()) === JSON.stringify(option.addOns.sort())
    );
  };

  const resetToDefaults = () => {
    setSize("Regular");
    setIce("Normal Ice");
    setSweetness("Normal Sweetness");
    setAddOns([]);
    setQuantity(1);
  };

  const saveFavorite = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleAddOn = (addOnId: string) => {
    setAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
    trackCustomizationChange();
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  const handleAddToCart = () => {
    if (!drink) return;
    
    const item: CartItem = {
      drinkId: drink.id,
      name: drink.name,
      image: drink.image,
      basePrice: drink.basePrice || drink.price,
      quantity,
      size,
      iceLevel: ice,
      sweetness: sweetness,
      addOns,
      totalPrice: calculatePrice(),
    };
    
    trackAddToCart(item.name);
    onAddToCart(item);
  };

  if (!drink) return null;

  return (
    <Dialog open={!!drink} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md h-[90vh] flex flex-col p-0 bg-white text-foreground">
        {/* Sticky Header */}
        <div className={`sticky top-0 z-20 bg-white border-b transition-all duration-200 ${
          isScrolled ? 'py-3 px-4' : 'py-4 px-6'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className={`font-bold text-foreground truncate ${
                isScrolled ? 'text-lg' : 'text-xl'
              }`}>
                {drink.name}
              </h2>
              {!isScrolled && (
                <p className="text-sm text-muted-foreground mt-1">
                  Start with your matcha, make it yours 💚
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToDefaults}
                className="h-8 px-2 text-xs"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={saveFavorite}
                className="h-8 px-2 text-xs"
              >
                <Heart className={`w-4 h-4 mr-1 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 bg-white">
          <div className="p-6 space-y-6">
            {/* Quick Pick Chips */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Quick Picks</h3>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                  🔥 Most ordered today
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickPickOptions.map((option) => {
                  const isActive = isQuickPickActive(option);
                  return (
                    <Button
                      key={option.id}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => applyQuickPick(option)}
                      className={`text-xs h-8 px-3 ${
                        isActive 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span className="mr-1">{option.icon}</span>
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Step 1: Size */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary text-xs">Step 1</Badge>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CupSoda className="w-4 h-4" />
                  Size
                </h3>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={size === "Regular" ? "default" : "outline"}
                  onClick={() => {
                    setSize("Regular");
                    trackCustomizationChange();
                  }}
                  className={`flex-1 h-10 ${size === "Regular" ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  Regular
                </Button>
                <Button
                  variant={size === "Large" ? "default" : "outline"}
                  onClick={() => {
                    setSize("Large");
                    trackCustomizationChange();
                  }}
                  className={`flex-1 h-10 ${size === "Large" ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  Large <span className="text-xs ml-1">(+RM2.00)</span>
                </Button>
              </div>
            </div>

            {/* Step 2: Ice Level */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary text-xs">Step 2</Badge>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <IceCream className="w-4 h-4" />
                  Ice Level
                </h3>
                {ice && (
                  <Check className="w-4 h-4 text-primary ml-auto" />
                )}
              </div>
              <div className="space-y-2">
                {iceOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      ice === option.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="ios-checkbox green">
                      <input
                        type="radio"
                        name="ice"
                        value={option.id}
                        checked={ice === option.id}
                        onChange={(e) => {
                          setIce(e.target.value);
                          trackCustomizationChange();
                        }}
                      />
                      <div className="checkbox-wrapper">
                        <div className="checkbox-bg"></div>
                        <svg className="checkbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path className="check-path" d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                    <span className="font-medium">{option.icon} {option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 3: Sweetness */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary text-xs">Step 3</Badge>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Droplets className="w-4 h-4" />
                  Sweetness
                </h3>
                {sweetness && (
                  <Check className="w-4 h-4 text-primary ml-auto" />
                )}
              </div>
              <div className="space-y-2">
                {sweetnessOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      sweetness === option.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="ios-checkbox green">
                      <input
                        type="radio"
                        name="sweetness"
                        value={option.id}
                        checked={sweetness === option.id}
                        onChange={(e) => {
                          setSweetness(e.target.value);
                          trackCustomizationChange();
                        }}
                      />
                      <div className="checkbox-wrapper">
                        <div className="checkbox-bg"></div>
                        <svg className="checkbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path className="check-path" d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                    <span className="font-medium">{option.icon} {option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Add-ons</h3>
              <div className="space-y-2">
                {addOnOptions.map((addOn) => {
                  const isSelected = addOns.includes(addOn.id);
                  return (
                    <div
                      key={addOn.id}
                      className={`relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[3px] border-primary bg-primary/15'
                          : 'border-2 border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => toggleAddOn(addOn.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="ios-checkbox green">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAddOn(addOn.id)}
                          />
                          <div className="checkbox-wrapper">
                            <div className="checkbox-bg"></div>
                            <svg className="checkbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path className="check-path" d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                        <span className="font-medium">{addOn.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs font-semibold">
                            Added + RM{addOn.price.toFixed(0)}
                          </Badge>
                        )}
                        <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-primary'}`}>
                          +RM{addOn.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional Promo Row */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥐</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Bundle Deal</p>
                    <p className="text-xs text-amber-600">Add pastry + RM5.00</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Add pastry
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Summary */}
        <div className="flex-shrink-0 bg-white border-t border-border shadow-lg">
          <div className="p-4 space-y-3">
            {/* Progress indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`flex items-center gap-1 ${size ? 'text-primary' : ''}`}>
                {size ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-gray-300"></span>}
                Size
              </span>
              <span>•</span>
              <span className={`flex items-center gap-1 ${ice ? 'text-primary' : ''}`}>
                {ice ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-gray-300"></span>}
                Ice
              </span>
              <span>•</span>
              <span className={`flex items-center gap-1 ${sweetness ? 'text-primary' : ''}`}>
                {sweetness ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-gray-300"></span>}
                Sweetness
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span key={priceKey} className="text-lg font-bold text-foreground price-pop">
                  RM{animatedPrice.toFixed(2)}
                </span>
                <div className="flex items-center border border-border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <div className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                    {quantity}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= 10}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleAddToCart}
                className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium flex-shrink-0"
              >
                Add to Basket
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};