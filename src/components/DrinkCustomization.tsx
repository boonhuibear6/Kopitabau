import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

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

export const DrinkCustomization = ({ drink, onClose, onAddToCart }: DrinkCustomizationProps) => {
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
  const [summaryChip, setSummaryChip] = useState<string>("");

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
      setSweetness("25%"); 
      announceChange("Less Sweet preset applied: 25% sweetness");
    }
    if (preset === "zero-ice") { 
      setIce("0%"); 
      announceChange("Zero Ice preset applied: 0% ice");
    }
  };

  const resetDefaults = () => {
    setSize("Regular"); 
    setIce("50%"); 
    setSweetness("50%"); 
    setMilk("Fresh"); 
    setToppings([]);
    setActivePreset(null);
    setToastMessage("Options reset");
    setTimeout(() => setToastMessage(""), 2000);
  };

  const favoriteKey = `favorite:${drink.id}`;
  const saveFavorite = () => {
    const fav = { size, ice, sweetness, milk, toppings };
    try { 
      localStorage.setItem(favoriteKey, JSON.stringify(fav)); 
      setToastMessage("Saved to Favorites.");
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
  
  useEffect(() => {
    try {
      const raw = localStorage.getItem(favoriteKey);
      if (raw) {
        const fav = JSON.parse(raw);
        if (fav?.size) setSize(fav.size);
        if (fav?.ice) setIce(fav.ice);
        if (fav?.sweetness) setSweetness(fav.sweetness);
        if (fav?.milk) setMilk(fav.milk);
        if (Array.isArray(fav?.toppings)) setToppings(fav.toppings);
      }
    } catch (error) {
      console.warn('Failed to load favorite:', error);
    }
    // init last price
    setLastPrice(calculatePrice());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Update summary chip
  useEffect(() => {
    const parts = [];
    if (size) parts.push(size);
    if (ice) parts.push(`Ice ${ice}`);
    if (sweetness) parts.push(`Sweet ${sweetness}`);
    if (milk && milk !== "Fresh") parts.push(milk);
    if (toppings.length > 0) parts.push(`${toppings.length} topping${toppings.length > 1 ? 's' : ''}`);
    
    const summary = parts.join(" • ");
    setSummaryChip(summary);
    announceChange(summary);
  }, [size, ice, sweetness, milk, toppings]);

  if (!drink) return null;

  const milkOptions = [
    { value: "Fresh", label: "Fresh", price: 0 },
    { value: "Oat", label: "Oat Milk", price: 2 },
    { value: "Soy", label: "Soy Milk", price: 1 },
  ];

  const iceOptions = [
    { value: "0%", label: "0%" },
    { value: "25%", label: "25%" },
    { value: "50%", label: "50%" },
    { value: "75%", label: "75%" },
    { value: "100%", label: "100%" },
  ];

  const sweetnessOptions = [
    { value: "0%", label: "0%" },
    { value: "25%", label: "25%" },
    { value: "50%", label: "50%" },
    { value: "75%", label: "75%" },
    { value: "100%", label: "100%" },
  ];

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!size) {
      errors.size = "Please choose a size.";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddToCart = () => {
    if (!validateForm()) {
      return;
    }
    
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
    onAddToCart(item);
  };

  // helpers
  const addonLines: string[] = [];
  if (size === "Large") addonLines.push("+RM2 (Large)");
  if (milk === "Oat") addonLines.push("+RM2 (Oat)");
  if (milk === "Soy") addonLines.push("+RM1 (Soy)");
  if (toppings.includes("Azuki")) addonLines.push("+RM2 (Azuki)");
  if (toppings.includes("Cream Cloud")) addonLines.push("+RM3 (Matcha Cream Cloud)");
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
                Base RM{(drink.basePrice || drink.price).toFixed(2)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetDefaults} className="h-8 text-xs">
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={saveFavorite} className="h-8 text-xs" aria-label="Save this configuration">
                ♥ Save
              </Button>
            </div>
          </div>
          
          {/* Quick Presets */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Quick Presets:</span>
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
          
          {/* Summary */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              Summary (muted): {livePreview}
            </p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Summary Chip */}
            {summaryChip && (
              <div className="bg-muted/50 border border-border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Current:</span>
                  <span className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
                    {summaryChip}
                  </span>
                </div>
              </div>
            )}

            {/* Size Radio Group */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">Size</legend>
              <div className="grid grid-cols-2 gap-3">
                <label className={`relative flex items-center justify-center min-h-[44px] min-w-[44px] text-sm font-medium border-2 rounded-md cursor-pointer transition-colors ${
                  size === "Regular" 
                    ? "bg-primary text-primary-foreground border-primary shadow-md" 
                    : "border-border text-foreground hover:border-primary/50"
                }`}>
                  <input
                    type="radio"
                    name="size"
                    value="Regular"
                    checked={size === "Regular"}
                    onChange={(e) => setSize(e.target.value)}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full border-2 ${
                      size === "Regular" ? "bg-primary-foreground border-primary-foreground" : "border-muted-foreground"
                    }`}></span>
                    Regular
                  </span>
                </label>
                <label className={`relative flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] text-sm font-medium border-2 rounded-md cursor-pointer transition-colors ${
                  size === "Large" 
                    ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20" 
                    : "border-border text-foreground hover:border-primary/50"
                }`}>
                  <input
                    type="radio"
                    name="size"
                    value="Large"
                    checked={size === "Large"}
                    onChange={(e) => setSize(e.target.value)}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full border-2 ${
                      size === "Large" ? "bg-primary-foreground border-primary-foreground" : "border-muted-foreground"
                    }`}></span>
                    Large
                    <span className={`text-xs px-1 rounded ${
                      size === "Large" 
                        ? "bg-primary-foreground/20 text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    }`}>+RM2</span>
                  </span>
                </label>
              </div>
              {validationErrors.size && (
                <p className="text-xs text-destructive mt-1">{validationErrors.size}</p>
              )}
            </fieldset>

            {/* Ice Level Controls */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">Ice Level</legend>
              <p className="text-xs text-muted-foreground">Tap a step. 0% = no ice.</p>
              <div className="grid grid-cols-5 gap-1">
                {iceOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={ice === option.value ? "default" : "outline"}
                    className={`min-h-[44px] text-sm font-medium ${
                      ice === option.value 
                        ? "bg-primary text-primary-foreground border-primary shadow-md" 
                        : "border-border text-foreground hover:border-primary/50"
                    }`}
                    onClick={() => setIce(option.value)}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full border-2 ${
                        ice === option.value ? "bg-primary-foreground border-primary-foreground" : "border-muted-foreground"
                      }`}></span>
                      {option.label}
                    </span>
                  </Button>
                ))}
              </div>
            </fieldset>

            {/* Sweetness Controls */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">Sweetness</legend>
              <p className="text-xs text-muted-foreground">Tap a step. 0% = unsweetened.</p>
              <div className="grid grid-cols-5 gap-1">
                {sweetnessOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={sweetness === option.value ? "default" : "outline"}
                    className={`min-h-[44px] text-sm font-medium ${
                      sweetness === option.value 
                        ? "bg-primary text-primary-foreground border-primary shadow-md" 
                        : "border-border text-foreground hover:border-primary/50"
                    }`}
                    onClick={() => setSweetness(option.value)}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full border-2 ${
                        sweetness === option.value ? "bg-primary-foreground border-primary-foreground" : "border-muted-foreground"
                      }`}></span>
                      {option.label}
                    </span>
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
                      onChange={(e) => setMilk(e.target.value)}
                      className="sr-only"
                    />
                    <span className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full border-2 ${
                        milk === option.value ? "bg-primary-foreground border-primary-foreground" : "border-muted-foreground"
                      }`}></span>
                      {option.label}
                    </span>
                    {option.price > 0 && (
                      <span className={`text-xs ${
                        milk === option.value 
                          ? "text-primary-foreground/80" 
                          : "text-muted-foreground"
                      }`}>
                        +RM{option.price}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Toppings Checkbox Group */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">Toppings</legend>
              <p className="text-xs text-muted-foreground">Choose any.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Azuki", price: 2 },
                  { name: "Cream Cloud", price: 3, label: "Cream Cloud" },
                ].map(t => {
                  const selected = toppings.includes(t.name);
                  const isDisabled = disabledItems[t.name];
                  return (
                    <label 
                      key={t.name} 
                      className={`relative flex flex-col items-center justify-center gap-0 min-h-[44px] min-w-[44px] text-sm font-medium border-2 rounded-md transition-colors ${
                        isDisabled 
                          ? "border-muted text-muted-foreground cursor-not-allowed opacity-50" 
                          : selected 
                            ? "bg-primary text-primary-foreground border-primary shadow-md cursor-pointer" 
                            : "border-border text-foreground hover:border-primary/50 cursor-pointer"
                      }`}
                      title={isDisabled ? disabledItems[t.name] : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!!isDisabled}
                        onChange={() => !isDisabled && setToppings(prev => selected ? prev.filter(x => x !== t.name) : [...prev, t.name])}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-1">
                        <span className={`w-3 h-3 rounded border-2 flex items-center justify-center ${
                          selected ? "bg-primary-foreground border-primary-foreground" : "border-muted-foreground"
                        }`}>
                          {selected && (
                            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                        <span className="font-medium">{t.label || t.name}</span>
                      </div>
                      <span className={`text-xs ${
                        selected 
                          ? "text-primary-foreground/80" 
                          : "text-muted-foreground"
                      }`}>
                        +RM{t.price}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Notes Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">Notes (optional)</Label>
              <div className="relative">
                <Textarea
                  placeholder="E.g., no pearls, light ice… (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={120}
                  className="w-full min-h-[80px] resize-none"
                />
                <div className="text-xs text-muted-foreground mt-1 text-right">
                  {notes.length}/120
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Subtotal Bar */}
        <div className="bg-background border-t border-border p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground" aria-live="polite">
                Subtotal RM{calculatePrice().toFixed(2)}
              </span>
              <div className="flex items-center gap-2">
                <label htmlFor="quantity-stepper" className="text-sm text-muted-foreground sr-only">Quantity</label>
                <div className="flex items-center border border-border rounded-md" role="group" aria-label="Quantity stepper">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] min-w-[44px] p-0 hover:bg-muted text-foreground"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                        e.preventDefault();
                        setQuantity(Math.max(1, quantity - 1));
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
                    aria-valuemax={99}
                    aria-label={`Quantity: ${quantity}`}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                        e.preventDefault();
                        setQuantity(Math.min(99, quantity + 1));
                      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                        e.preventDefault();
                        setQuantity(Math.max(1, quantity - 1));
                      } else if (e.key === 'Home') {
                        e.preventDefault();
                        setQuantity(1);
                      } else if (e.key === 'End') {
                        e.preventDefault();
                        setQuantity(99);
                      }
                    }}
                  >
                    {quantity}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] min-w-[44px] p-0 hover:bg-muted text-foreground"
                    onClick={() => setQuantity(Math.min(99, quantity + 1))}
                    disabled={quantity >= 99}
                    aria-label="Increase quantity"
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                        e.preventDefault();
                        setQuantity(Math.min(99, quantity + 1));
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
              disabled={!size}
              className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              onKeyDown={(e) => e.key === 'Enter' && handleAddToCart()}
            >
              Add • RM{calculatePrice().toFixed(2)}
            </Button>
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