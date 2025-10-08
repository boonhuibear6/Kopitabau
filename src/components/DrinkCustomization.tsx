import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { trackCustomize, trackAddToCart, trackCustomizationChange } from "@/lib/analytics";

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
  const [ice, setIce] = useState("50%");
  const [sweetness, setSweetness] = useState("50%");
  const [milk, setMilk] = useState("Fresh");
  const [toppings, setToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [deltaFlash, setDeltaFlash] = useState<string>("");
  const [lastPrice, setLastPrice] = useState<number>(0);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [disabledItems, setDisabledItems] = useState<{[key: string]: string}>({});
  const [showNotes, setShowNotes] = useState(false);
  const [showMoreCustomizations, setShowMoreCustomizations] = useState(false);
  const [focusedControl, setFocusedControl] = useState<string>("");
  const [prepTime, setPrepTime] = useState<number>(3);
  const [stockLevel, setStockLevel] = useState<'high' | 'medium' | 'low'>('high');
  const [savedCombos, setSavedCombos] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [holdInterval, setHoldInterval] = useState<NodeJS.Timeout | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  
  // Max toppings selection limit
  const MAX_TOPPINGS = 2;
  
  // Auto-focus notes textarea when dialog opens
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    // Auto-focus the notes textarea when dialog opens
    if (drink && notesTextareaRef.current) {
      // Small delay to ensure dialog is fully rendered
      const timer = setTimeout(() => {
        if (notesTextareaRef.current) {
          notesTextareaRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [drink]);

  // Track customize step when dialog opens
  useEffect(() => {
    if (drink) {
      trackCustomize();
    }
  }, [drink]);

  const calculatePrice = () => {
    let price = drink.basePrice || drink.price;
    if (size === "Large") price += 2;
    if (milk === "Oat") price += 2;
    if (milk === "Soy") price += 1;
    if (toppings.includes("Azuki")) price += 2;
    if (toppings.includes("Cream Cloud")) price += 3;
    return price * quantity;
  };

  const presetApply = (preset: "bestseller" | "less-sweet" | "zero-ice") => {
    setActivePreset(preset);
    
    if (preset === "bestseller") { 
      setSize("Regular"); 
      setIce("50%"); 
      setSweetness("50%"); 
      setMilk("Fresh"); 
      setToppings([]); 
      announceChange("Bestseller preset applied: Regular size, 50% ice, 50% sweetness, Fresh milk");
    }
    if (preset === "less-sweet") { 
      setSize("Regular");
      setIce("50%");
      setSweetness("25%"); 
      setMilk("Fresh");
      setToppings([]);
      announceChange("Less Sweet preset applied: Regular size, 50% ice, 25% sweetness, Fresh milk");
    }
    if (preset === "zero-ice") { 
      setSize("Regular");
      setIce("0%");
      setSweetness("50%");
      setMilk("Fresh");
      setToppings([]);
      announceChange("Zero Ice preset applied: Regular size, 0% ice, 50% sweetness, Fresh milk");
    }
  };

  const resetDefaults = () => {
    setSize("Regular"); 
    setIce("50%"); 
    setSweetness("50%"); 
    setMilk("Fresh"); 
    setToppings([]);
    setActivePreset("bestseller");
    setToastMessage("Options cleared");
    setTimeout(() => setToastMessage(""), 2000);
  };

  const favoriteKey = `favorite:${drink.id}`;
  const saveFavorite = () => {
    const fav = { size, ice, sweetness, milk, toppings };
    try { 
      localStorage.setItem(favoriteKey, JSON.stringify(fav)); 
      setIsSaved(true);
      setSavedCombos(prev => prev + 1);
      setToastMessage("Saved ✓");
      setTimeout(() => setToastMessage(""), 2000);
    } catch (error) {
      console.warn('Failed to save favorite:', error);
    }
  };

  const announceChange = (message: string) => {
    setAriaAnnouncement(message);
    // Clear the announcement after a short delay to allow for re-announcement
    setTimeout(() => setAriaAnnouncement(""), 100);
  };

  const handleToppingToggle = (toppingName: string) => {
    const isSelected = toppings.includes(toppingName);
    
    if (isSelected) {
      // Remove topping
      setToppings(prev => prev.filter(t => t !== toppingName));
    } else {
      // Add topping if under limit
      if (toppings.length < MAX_TOPPINGS) {
        setToppings(prev => [...prev, toppingName]);
      } else {
        setToastMessage(`Maximum ${MAX_TOPPINGS} toppings allowed`);
        setTimeout(() => setToastMessage(""), 2000);
      }
    }
  };
  
  useEffect(() => {
    try {
      // First try to load saved favorites
      const raw = localStorage.getItem(favoriteKey);
      if (raw) {
        const fav = JSON.parse(raw);
        if (fav?.size) setSize(fav.size);
        if (fav?.ice) setIce(fav.ice);
        if (fav?.sweetness) setSweetness(fav.sweetness);
        if (fav?.milk) setMilk(fav.milk);
        if (Array.isArray(fav?.toppings)) setToppings(fav.toppings);
        // If user has saved favorites, don't override the preset
      } else {
        // Try to load last customization for this drink
        const lastCustomizationKey = `lastCustomization:${drink?.id}`;
        const lastCustomization = localStorage.getItem(lastCustomizationKey);
        if (lastCustomization) {
          const customization = JSON.parse(lastCustomization);
          if (customization?.size) setSize(customization.size);
          if (customization?.ice) setIce(customization.ice);
          if (customization?.sweetness) setSweetness(customization.sweetness);
          if (customization?.milk) setMilk(customization.milk);
          if (Array.isArray(customization?.toppings)) setToppings(customization.toppings);
          if (customization?.quantity) setQuantity(customization.quantity);
        } else {
          // No saved preferences, use bestseller preset by default
          setSize("Regular");
          setIce("50%");
          setSweetness("50%");
          setMilk("Fresh");
          setToppings([]);
          setActivePreset("bestseller");
        }
      }
    } catch (error) {
      console.warn('Failed to load preferences:', error);
      // On error, use bestseller preset by default
      setSize("Regular");
      setIce("50%");
      setSweetness("50%");
      setMilk("Fresh");
      setToppings([]);
      setActivePreset("bestseller");
    }
    // init last price
    setLastPrice(calculatePrice());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drink?.id]);

  // Save current customization when it changes
  useEffect(() => {
    if (drink?.id) {
      const customization = {
        size,
        ice,
        sweetness,
        milk,
        toppings,
        quantity
      };
      localStorage.setItem(`lastCustomization:${drink.id}`, JSON.stringify(customization));
    }
  }, [size, ice, sweetness, milk, toppings, quantity, drink?.id]);

  // Flash +RM / -RM deltas when price changes
  useEffect(() => {
    const price = calculatePrice();
    const diff = price - lastPrice;
    if (lastPrice !== 0 && diff !== 0) {
      const sign = diff > 0 ? "+" : "-";
      setDeltaFlash(`${sign}RM${Math.abs(diff).toFixed(2)}`);
      window.setTimeout(() => setDeltaFlash(""), 500);
    }
    setLastPrice(price);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, ice, sweetness, milk, toppings.join(","), quantity]);

  // Announce sweetness changes
  useEffect(() => {
    if (lastPrice !== 0) { // Only announce after initial load
      announceChange(`Sweetness ${sweetness}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sweetness]);

  // Announce subtotal changes
  useEffect(() => {
    if (lastPrice !== 0) { // Only announce after initial load
      announceChange(`Subtotal updated to RM${calculatePrice().toFixed(2)}.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, ice, sweetness, milk, toppings.join(","), quantity]);

  // Check for incompatible combinations
  useEffect(() => {
    const disabled: {[key: string]: string} = {};
    
    // Cream Cloud isn't available with Zero Ice
    if (ice === "0%") {
      disabled["Cream Cloud"] = "Cream Cloud isn't available with Zero Ice.";
    }
    
    setDisabledItems(disabled);
  }, [ice]);

  // Scroll detection for sticky summary compression
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('[data-scroll-container]');
      if (scrollContainer) {
        const scrollTop = scrollContainer.scrollTop;
        setIsScrolled(scrollTop > 50);
      }
    };

    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdInterval) {
        clearInterval(holdInterval);
      }
    };
  }, [holdInterval]);


  if (!drink) return null;

  const milkOptions = [
    { value: "Fresh", label: "Fresh", price: 0, note: "Fresh (dairy)" },
    { value: "Oat", label: "Oat", price: 2, note: "Oat (+RM2)" },
    { value: "Soy", label: "Soy", price: 1, note: "Soy (+RM1)" },
  ];

  const sizeOptions = [
    { value: "Regular", label: "Regular", popular: true },
    { value: "Large", label: "Large", popular: false },
  ];

  const iceOptions = [
    { value: "0%", label: "0%", popular: false },
    { value: "25%", label: "25%", popular: false },
    { value: "50%", label: "50%", popular: true },
    { value: "75%", label: "75%", popular: false },
    { value: "100%", label: "100%", popular: false },
  ];

  const sweetnessOptions = [
    { value: "0%", label: "0%", popular: false },
    { value: "25%", label: "25%", popular: false },
    { value: "50%", label: "50%", popular: true },
    { value: "75%", label: "75%", popular: false },
    { value: "100%", label: "100%", popular: false },
  ];

  const toppingOptions = [
    { name: "Azuki", price: 2, allergen: "Contains beans" },
    { name: "Cream Cloud", price: 3, allergen: "Contains milk" },
  ];

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!size) {
      errors.size = "Please choose a size.";
    }
    
    setValidationErrors(errors);
    
    // Auto-scroll to first invalid control
    if (Object.keys(errors).length > 0) {
      const firstError = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstError}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (errorElement as HTMLElement).focus();
      }
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  const startHold = (delta: number) => {
    handleQuantityChange(delta);
    const interval = setTimeout(() => {
      const holdInterval = setInterval(() => {
        setQuantity(prev => {
          const newValue = Math.max(1, Math.min(10, prev + delta));
          if (newValue === prev) {
            clearInterval(holdInterval);
            return prev;
          }
          return newValue;
        });
      }, 100);
      setHoldInterval(holdInterval);
    }, 400);
  };

  const stopHold = () => {
    if (holdInterval) {
      clearInterval(holdInterval);
      setHoldInterval(null);
    }
  };

  const handleAddToCart = () => {
    if (isAddingToCart || !validateForm()) {
      return;
    }
    
    setIsAddingToCart(true);
    
    const item: CartItem = {
      drinkId: drink.id,
      name: drink.name,
      image: drink.image,
      basePrice: drink.basePrice || drink.price,
      quantity,
      size,
      iceLevel: ice,
      sweetness,
      addOns: [
        ...(milk !== "Fresh" ? [milk] : []),
        ...toppings,
      ],
      totalPrice: calculatePrice(),
    };
    
    // Track add to cart
    trackAddToCart(item.name);
    
    onAddToCart(item);
    
    // Debounce for 600ms
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 600);
  };

  // helpers
  const addonLines: string[] = [];
  if (size === "Large") addonLines.push("+RM2.00 (Large)");
  if (milk === "Oat") addonLines.push("+RM2.00 (Oat)");
  if (milk === "Soy") addonLines.push("+RM1.00 (Soy)");
  if (toppings.includes("Azuki")) addonLines.push("+RM2.00 (Azuki)");
  if (toppings.includes("Cream Cloud")) addonLines.push("+RM3.00 (Matcha Cream Cloud)");
  const livePreview = `${size} • ${ice} ice • ${sweetness} sweet • ${milk}${toppings.length ? " • " + toppings.join(", ") : ""}`;

  return (
    <Dialog open={!!drink} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 bg-background text-foreground">
        {/* ARIA Live Region for announcements */}
        <div 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
        >
          {ariaAnnouncement}
        </div>
        
        {/* Header Section */}
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {drink.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Base RM{(drink.basePrice || drink.price).toFixed(2)} · Adjust ice & sweetness below.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetDefaults} className="h-8 text-xs">
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={saveFavorite} className="h-8 text-xs" aria-label="Save this configuration">
                {isSaved ? 'Saved ✓' : '♥ Save'}
              </Button>
            </div>
          </div>
          
          {/* Quick Presets */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Speed picks for Ice & Sweetness.</span>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={activePreset === "bestseller" ? "default" : "outline"} 
                className={`min-h-[44px] min-w-[44px] text-xs font-medium ${
                  activePreset === "bestseller" 
                    ? "bg-primary text-primary-foreground border-primary shadow-md" 
                    : "border-primary text-primary hover:bg-primary/10"
                }`}
                onClick={() => presetApply("bestseller")}
                role="button"
                aria-pressed={activePreset === "bestseller"}
              >
                Bestseller
              </Button>
              <Button 
                size="sm" 
                variant={activePreset === "less-sweet" ? "default" : "outline"} 
                className={`min-h-[44px] min-w-[44px] text-xs font-medium ${
                  activePreset === "less-sweet" 
                    ? "bg-primary text-primary-foreground border-primary shadow-md" 
                    : "border-primary text-primary hover:bg-primary/10"
                }`}
                onClick={() => presetApply("less-sweet")}
                role="button"
                aria-pressed={activePreset === "less-sweet"}
              >
                Less Sweet
              </Button>
              <Button 
                size="sm" 
                variant={activePreset === "zero-ice" ? "default" : "outline"} 
                className={`min-h-[44px] min-w-[44px] text-xs font-medium ${
                  activePreset === "zero-ice" 
                    ? "bg-primary text-primary-foreground border-primary shadow-md" 
                    : "border-primary text-primary hover:bg-primary/10"
                }`}
                onClick={() => presetApply("zero-ice")}
                role="button"
                aria-pressed={activePreset === "zero-ice"}
              >
                Zero Ice
              </Button>
            </div>
          </div>
          
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4" data-scroll-container>
          <div className="space-y-6">

            {/* Size Segmented Control */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">Size</legend>
              <p className="text-xs text-muted-foreground sr-only" id="size-help">Choose your drink size. Regular is the most popular option.</p>
              <div className="grid grid-cols-2 gap-2">
                {sizeOptions.map((option) => (
                  <label 
                    key={option.value}
                    className={`relative flex flex-col items-center justify-center min-h-[44px] text-sm font-medium border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      size === option.value 
                        ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20" 
                        : "border-border text-foreground hover:border-primary/50 hover:shadow-sm"
                    } ${focusedControl === `size-${option.value}` ? 'ring-2 ring-primary/30' : ''}`}
                    onFocus={() => setFocusedControl(`size-${option.value}`)}
                    onBlur={() => setFocusedControl('')}
                  >
                    <input
                      type="radio"
                      name="size"
                      value={option.value}
                      checked={size === option.value}
                      onChange={(e) => {
                        setSize(e.target.value);
                        trackCustomizationChange();
                        setFocusedControl(`size-${option.value}`);
                        setTimeout(() => setFocusedControl(''), 300);
                      }}
                      className="sr-only"
                      aria-describedby="size-help"
                    />
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full border-2 ${
                        size === option.value ? "bg-primary-foreground border-primary-foreground" : "border-muted-foreground"
                      }`}></span>
                      <span>{option.label}</span>
                      {option.popular && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          Most ordered
                        </Badge>
                      )}
                    </div>
                    {option.value === "Large" && (
                      <span className={`text-xs mt-1 ${
                        size === option.value 
                          ? "text-primary-foreground/80" 
                          : "text-muted-foreground"
                      }`}>
                        Large +RM2
                      </span>
                    )}
                  </label>
                ))}
              </div>
              {validationErrors.size && (
                <p className="text-xs text-destructive mt-1">{validationErrors.size}</p>
              )}
            </fieldset>

            {/* Ice Level Segmented Control */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">Ice Level</legend>
              <p className="text-xs text-muted-foreground">Tap a step. 0% = no ice.</p>
              <div className="grid grid-cols-5 gap-1">
                {iceOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={ice === option.value ? "default" : "outline"}
                    className={`min-h-[44px] text-sm font-medium transition-all duration-200 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${
                      ice === option.value 
                        ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20" 
                        : "border-border text-foreground hover:border-primary/50 hover:shadow-sm"
                    } ${focusedControl === `ice-${option.value}` ? 'ring-2 ring-primary/30' : ''}`}
                    onClick={() => {
                      setIce(option.value);
                      trackCustomizationChange();
                      setFocusedControl(`ice-${option.value}`);
                      setTimeout(() => setFocusedControl(''), 300);
                    }}
                    onFocus={() => setFocusedControl(`ice-${option.value}`)}
                    onBlur={() => setFocusedControl('')}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className={`w-3 h-3 rounded-full border-2 ${
                        ice === option.value ? "bg-primary-foreground border-primary-foreground" : "border-muted-foreground"
                      }`}></span>
                      <span>{option.label}</span>
                      {option.popular && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          Most
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </fieldset>

            {/* Sweetness Segmented Control */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">Sweetness</legend>
              <div className="flex flex-wrap gap-2 mb-3">
                <Button
                  type="button"
                  variant={sweetness === "0%" ? "default" : "outline"}
                  size="sm"
                  className={`text-xs font-medium transition-all duration-200 ${
                    sweetness === "0%" 
                      ? "bg-green-100 text-green-700 border-green-200 shadow-md" 
                      : "border-border text-foreground hover:border-green-200 hover:text-green-600"
                  }`}
                  onClick={() => {
                    setSweetness("0%");
                    trackCustomizationChange();
                    setFocusedControl('sweetness-0%');
                    setTimeout(() => setFocusedControl(''), 300);
                  }}
                >
                  ⚠️ No sugar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">0% = unsweetened.</p>
              <div className="grid grid-cols-5 gap-1">
                {sweetnessOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={sweetness === option.value ? "default" : "outline"}
                    className={`min-h-[44px] text-sm font-medium transition-all duration-200 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${
                      sweetness === option.value 
                        ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20" 
                        : "border-border text-foreground hover:border-primary/50 hover:shadow-sm"
                    } ${focusedControl === `sweetness-${option.value}` ? 'ring-2 ring-primary/30' : ''}`}
                    onClick={() => {
                      setSweetness(option.value);
                      trackCustomizationChange();
                      setFocusedControl(`sweetness-${option.value}`);
                      setTimeout(() => setFocusedControl(''), 300);
                    }}
                    onFocus={() => setFocusedControl(`sweetness-${option.value}`)}
                    onBlur={() => setFocusedControl('')}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className={`w-3 h-3 rounded-full border-2 ${
                        sweetness === option.value ? "bg-primary-foreground border-primary-foreground" : "border-muted-foreground"
                      }`}></span>
                      <span>{option.label}</span>
                      {option.popular && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          Most
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </fieldset>

            {/* Milk Radio Group */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">Milk</legend>
              <div className="grid grid-cols-3 gap-3">
                {milkOptions.map((option) => (
                  <label key={option.value} className={`relative flex flex-col items-center justify-center gap-0 min-h-[44px] min-w-[44px] text-sm font-medium border-2 rounded-md cursor-pointer transition-colors ${
                    milk === option.value 
                      ? "bg-primary text-primary-foreground border-primary shadow-md" 
                      : "border-border text-foreground hover:border-primary/50"
                  }`}>
                    <input
                      type="radio"
                      name="milk"
                      value={option.value}
                      checked={milk === option.value}
                      onChange={(e) => {
                        setMilk(e.target.value);
                        trackCustomizationChange();
                      }}
                      className="sr-only"
                    />
                    <span className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full border-2 ${
                        milk === option.value ? "bg-primary-foreground border-primary-foreground" : "border-muted-foreground"
                      }`}></span>
                      {option.label}
                    </span>
                    <span className={`text-xs ${
                      milk === option.value 
                        ? "text-primary-foreground/80" 
                        : "text-muted-foreground"
                    }`}>
                      {option.note}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Toppings Checkbox Grid */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">Toppings</legend>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Choose up to {MAX_TOPPINGS} toppings.</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {toppings.length}/{MAX_TOPPINGS}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {toppingOptions.map(t => {
                  const selected = toppings.includes(t.name);
                  const isDisabled = disabledItems[t.name];
                  const isAtLimit = toppings.length >= MAX_TOPPINGS && !selected;
                  return (
                    <label 
                      key={t.name} 
                      className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] text-sm font-medium border-2 rounded-lg transition-all duration-200 ${
                        isDisabled 
                          ? "border-muted text-muted-foreground cursor-not-allowed opacity-50" 
                          : isAtLimit
                            ? "border-muted text-muted-foreground cursor-not-allowed opacity-50"
                            : selected 
                              ? "bg-primary text-primary-foreground border-primary shadow-md cursor-pointer ring-2 ring-primary/20" 
                              : "border-border text-foreground hover:border-primary/50 cursor-pointer hover:shadow-sm"
                      } ${focusedControl === `topping-${t.name}` ? 'ring-2 ring-primary/30' : ''}`}
                      title={isDisabled ? disabledItems[t.name] : isAtLimit ? `Maximum ${MAX_TOPPINGS} toppings allowed` : undefined}
                      onFocus={() => setFocusedControl(`topping-${t.name}`)}
                      onBlur={() => setFocusedControl('')}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!!isDisabled || isAtLimit}
                        onChange={() => {
                          handleToppingToggle(t.name);
                          setFocusedControl(`topping-${t.name}`);
                          setTimeout(() => setFocusedControl(''), 300);
                        }}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded border-2 flex items-center justify-center ${
                          selected ? "bg-primary-foreground border-primary-foreground" : "border-muted-foreground"
                        }`}>
                          {selected && (
                            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                        <span className="font-medium">{t.name}</span>
                        {t.allergen && (
                          <div className="group relative">
                            <button 
                              type="button"
                              className="text-xs text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                              aria-label={`Allergen information for ${t.name}`}
                              onTouchStart={(e) => {
                                e.preventDefault();
                                const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                                if (tooltip) {
                                  tooltip.classList.toggle('opacity-100');
                                  setTimeout(() => tooltip.classList.toggle('opacity-100'), 2000);
                                }
                              }}
                            >
                              ℹ️
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                              {t.allergen}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className={`text-xs ${
                        selected 
                          ? "text-primary-foreground/80" 
                          : "text-muted-foreground"
                      }`}>
                        {t.name} +RM{t.price}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* More Customizations Section */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMoreCustomizations(!showMoreCustomizations)}
                className="w-full justify-between"
              >
                <span className="text-sm font-semibold">Advanced options (3)</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {showMoreCustomizations ? 'Hide' : 'Show'} options
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showMoreCustomizations ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </Button>
              
              {showMoreCustomizations && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  {/* Notes Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-foreground">Add note</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNotes(!showNotes)}
                        className="text-xs"
                      >
                        {showNotes ? 'Hide' : 'Add note'}
                      </Button>
                    </div>
                    {showNotes && (
                      <div className="relative">
                        <Textarea
                          ref={notesTextareaRef}
                          placeholder="No special requests? Leave blank."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          maxLength={120}
                          className="w-full min-h-[80px] resize-none"
                          enterKeyHint="done"
                        />
                        <div className="text-xs text-muted-foreground mt-1 text-right">
                          {notes.length}/120
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Subtotal Bar */}
        <div className={`bg-background border-t border-border transition-all duration-300 ${isScrolled ? 'p-2' : 'p-4'}`}>
          <div className="space-y-3">
            {/* Prep Time & Stock Chips */}
            {!isScrolled && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ⏱️ Ready in ~8–12 min
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    stockLevel === 'high' 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : stockLevel === 'medium'
                      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      : 'bg-red-100 text-red-700 border-red-200'
                  }`}
                >
                  {stockLevel === 'high' ? '✅ In stock' : stockLevel === 'medium' ? '⚠️ Limited' : '❌ Low stock'}
                </Badge>
              </div>
            )}
            
            {/* Compressed summary when scrolled */}
            {isScrolled && (
              <div className="text-xs text-muted-foreground text-center">
                {drink.name} · {size} · {ice} ice · {sweetness} sweet · {milk} · RM{calculatePrice().toFixed(2)}
              </div>
            )}
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground" aria-live="polite">
                    Subtotal RM{calculatePrice().toFixed(2)}
                  </span>
                  {deltaFlash && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-md animate-in slide-in-from-right-2 duration-300 ${
                      deltaFlash.startsWith('+') 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {deltaFlash}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="quantity-stepper" className="text-sm text-muted-foreground sr-only">Quantity</label>
                  <div className="flex items-center border border-border rounded-md" role="group" aria-label="Quantity stepper">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-[44px] min-w-[44px] p-0 hover:bg-muted text-foreground"
                      onClick={() => handleQuantityChange(-1)}
                      onMouseDown={() => startHold(-1)}
                      onMouseUp={stopHold}
                      onMouseLeave={stopHold}
                      onTouchStart={() => startHold(-1)}
                      onTouchEnd={stopHold}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                          e.preventDefault();
                          handleQuantityChange(-1);
                        }
                      }}
                    >
                      –
                    </Button>
                    <div 
                      id="quantity-stepper"
                      className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center min-h-[44px] flex items-center justify-center text-foreground"
                      tabIndex={0}
                      role="spinbutton"
                      aria-valuenow={quantity}
                      aria-valuemin={1}
                      aria-valuemax={10}
                      aria-label={`Quantity: ${quantity}`}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                          e.preventDefault();
                          setQuantity(Math.min(10, quantity + 1));
                        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                          e.preventDefault();
                          setQuantity(Math.max(1, quantity - 1));
                        } else if (e.key === 'Home') {
                          e.preventDefault();
                          setQuantity(1);
                        } else if (e.key === 'End') {
                          e.preventDefault();
                          setQuantity(10);
                        }
                      }}
                    >
                      {quantity}
                      {quantity >= 10 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Max 10
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-[44px] min-w-[44px] p-0 hover:bg-muted text-foreground"
                      onClick={() => handleQuantityChange(1)}
                      onMouseDown={() => startHold(1)}
                      onMouseUp={stopHold}
                      onMouseLeave={stopHold}
                      onTouchStart={() => startHold(1)}
                      onTouchEnd={stopHold}
                      disabled={quantity >= 10}
                      aria-label="Increase quantity"
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                          e.preventDefault();
                          handleQuantityChange(1);
                        }
                      }}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleAddToCart} 
                disabled={!size || stockLevel === 'low' || isAddingToCart}
                className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                onKeyDown={(e) => e.key === 'Enter' && handleAddToCart()}
              >
                <div className="flex items-center gap-2">
                  <span>
                    {!size ? 'Select size' : stockLevel === 'low' ? 'Low stock' : isAddingToCart ? 'Adding...' : `Add • RM${calculatePrice().toFixed(2)}`}
                  </span>
                  {deltaFlash && !(!size || stockLevel === 'low') && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded animate-in slide-in-from-right-2 duration-300 ${
                      deltaFlash.startsWith('+') 
                        ? 'bg-primary-foreground/20 text-primary-foreground' 
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {deltaFlash}
                    </span>
                  )}
                </div>
              </Button>
            </div>
            
            {/* Micro-hint for disabled CTA */}
            {(!size || stockLevel === 'low') && (
              <p className="text-xs text-muted-foreground text-center">
                {!size ? 'Please select a size to continue' : 'This item is running low on stock'}
              </p>
            )}
            
            {/* Bundle Upsell Card */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🥐</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Bundle it!</p>
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
        
        {/* Toast Notifications */}
        {toastMessage && (
          <div className="fixed top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg z-50 animate-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}
      </DialogContent>
      
    </Dialog>
  );
};