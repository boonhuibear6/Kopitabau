import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Droplet, Thermometer, Milk, Sparkles, Heart, Star } from "lucide-react";
import { DrinkCustomization, type CartItem } from "@/components/DrinkCustomization";
import { trackViewMenu, trackQuickAdd } from "@/lib/analytics";

// Drink images
import hotCappuccino from "@/assets/drinks/hot-cappuccino.jpg";
import icedLatte from "@/assets/drinks/iced-latte.jpg";
import icedMocha from "@/assets/drinks/iced-mocha.jpg";
import matchaLatte from "@/assets/drinks/matcha-latte.jpg";
import layeredMatcha from "@/assets/drinks/layered-matcha.png";
import matchacocco from "@/assets/drinks/matchacocco.png";
import strawberrymatcha from "@/assets/drinks/strawberrymatcha.png";
import hojichalatte from "@/assets/drinks/hojichalatte.png";

interface Drink {
  id: string;
  name: string;
  description: string;
  price: number;
  basePrice: number;
  image: string;
  rating?: number;
  category: "classic" | "refreshing";
  sales?: number;
  createdAt?: string; // ISO date
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  recommended?: boolean;
}

const classicDrinks: Drink[] = [
  { id: "matcha-latte", name: "Matcha Latte", description: "Creamy, smooth & lightly sweetened with milk", price: 10.70, basePrice: 10.70, image: matchaLatte, rating: 4.9, category: "classic" },
  { id: "dirty-matcha", name: "Dirty Matcha", description: "Matcha meets espresso in perfect harmony", price: 13.70, basePrice: 13.70, image: layeredMatcha, rating: 4.8, category: "classic", sales: 180 },
  { id: "matcha-choco", name: "Matcha Choco", description: "Rich chocolate blended with premium matcha", price: 12.70, basePrice: 12.70, image: matchacocco, rating: 4.7, category: "classic", sales: 220 },
  { id: "strawberry-matcha", name: "Strawberry Matcha", description: "Sweet strawberry with earthy matcha notes", price: 13.70, basePrice: 13.70, image: strawberrymatcha, rating: 4.9, category: "classic", createdAt: new Date().toISOString() },
  { id: "hojicha-latte", name: "Hojicha Latte", description: "Roasted tea with creamy milk", price: 10.70, basePrice: 10.70, image: hojichalatte, rating: 4.6, category: "classic", sales: 150 },
];

const refreshingDrinks: Drink[] = [
  { id: "pure-matcha", name: "Pure Matcha", description: "Light, uplifting & energized", price: 10.70, basePrice: 10.70, image: matchaLatte, rating: 4.9, category: "refreshing", sales: 300 },
  { id: "matcha-lemonade", name: "Matcha Lemonade", description: "Zesty citrus meets green tea", price: 12.70, basePrice: 12.70, image: icedLatte, rating: 4.8, category: "refreshing", sales: 190 },
  { id: "matcha-americano", name: "Matcha Americano", description: "Bold and invigorating", price: 12.70, basePrice: 12.70, image: icedMocha, rating: 4.7, category: "refreshing" },
  { id: "mango-matcha", name: "Mango Matcha", description: "Tropical sweetness with matcha", price: 13.70, basePrice: 13.70, image: matchaLatte, rating: 4.9, category: "refreshing", createdAt: new Date().toISOString() },
  { id: "mango-americano", name: "Mango Americano", description: "Fruity twist on a classic", price: 13.70, basePrice: 13.70, image: icedLatte, rating: 4.8, category: "refreshing" },
];

const addOns: AddOn[] = [
  { id: "oat-milk", name: "Oat Milk", price: 2.00 },
  { id: "almond-milk", name: "Almond Milk", price: 2.00 },
  { id: "almond-soy-milk", name: "Almond Soy Milk", price: 2.00, recommended: true },
  { id: "extra-matcha", name: "Extra Matcha", price: 2.00 },
  { id: "matcha-cream-cloud", name: "Matcha Cream Cloud", price: 2.00 },
];

interface MenuSectionProps {
  onAddToCart: (item: CartItem) => void;
  cartItemCount?: number;
}

export const MenuSection = ({ onAddToCart, cartItemCount = 0 }: MenuSectionProps) => {
  const [activeTab, setActiveTab] = useState<"classic" | "refreshing" | "addons">("classic");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Result count is derived; no state to avoid render loops

  // Simulate loading delay for skeleton effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // 1 second delay to show skeleton
    return () => clearTimeout(timer);
  }, []);

  // Track initial menu view
  useEffect(() => {
    trackViewMenu();
  }, []);

  const handleQuickAdd = (drink: Drink) => {
    const defaultItem: CartItem = {
      drinkId: drink.id,
      name: drink.name,
      image: drink.image,
      basePrice: drink.price,
      quantity: 1,
      size: "Regular",
      iceLevel: "50%",
      sweetness: "50%",
      addOns: [],
      totalPrice: drink.price,
    };
    
    // Track quick add
    trackQuickAdd(drink.name);
    
    onAddToCart(defaultItem);
  };

  const handleAddOnAdd = (addOn: AddOn) => {
    const item: CartItem = {
      drinkId: addOn.id,
      name: addOn.name,
      image: matchaLatte,
      basePrice: addOn.price,
      quantity: 1,
      size: "N/A",
      iceLevel: "N/A",
      sweetness: "N/A",
      addOns: [],
      totalPrice: addOn.price,
    };
    onAddToCart(item);
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const resetFilters = () => {
    setActiveFilters([]);
    setSearchQuery("");
  };

  const applyFilters = (drinks: Drink[]) => {
    let filtered = drinks.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeFilters.includes("hot")) filtered = filtered.filter(() => true);
    if (activeFilters.includes("iced")) filtered = filtered.filter(() => true);
    if (activeFilters.includes("milk")) filtered = filtered.filter(() => true);
    if (activeFilters.includes("sweetness")) filtered = filtered.filter(() => true);
    return filtered;
  };

  const isNew = (d: Drink) => {
    if (!d.createdAt) return false;
    const created = new Date(d.createdAt).getTime();
    const days = (Date.now() - created) / (1000 * 60 * 60 * 24);
    return days <= 30;
  };

  const bestsellerIds = [...[...classicDrinks, ...refreshingDrinks]]
    .sort((a, b) => (b.sales || 0) - (a.sales || 0))
    .slice(0, 3)
    .map(d => d.id);

  return (
    <div className="space-y-6">
      {/* Tabs with counts - Pills with Active Underline */}
      <div className="sticky top-0 bg-background z-10 pb-4 border-b border-border">
        <div className="flex justify-center gap-1 mb-4">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("classic")}
            className={`rounded-full px-6 py-2 relative ${
              activeTab === "classic" 
                ? "text-primary border-b-2 border-primary bg-primary/5" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            CLASSIC {classicDrinks.length}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("refreshing")}
            className={`rounded-full px-6 py-2 relative ${
              activeTab === "refreshing" 
                ? "text-primary border-b-2 border-primary bg-primary/5" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            REFRESHING {refreshingDrinks.length}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("addons")}
            className={`rounded-full px-6 py-2 relative ${
              activeTab === "addons" 
                ? "text-primary border-b-2 border-primary bg-primary/5" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ADD-ONS {addOns.length}
          </Button>
        </div>


        {/* Results Count - Right Aligned */}
        <div className="flex justify-end">
          <span className="text-sm text-muted-foreground">
            {activeTab === "classic" ? applyFilters(classicDrinks).length : activeTab === "refreshing" ? applyFilters(refreshingDrinks).length : addOns.length} results
          </span>
        </div>
      </div>

      {/* Content based on active tab */}

      {activeTab === "classic" && (
        <div id="classic" className="space-y-4">
          <div className="mb-4">
            <h3 className="font-playfair text-2xl font-bold text-foreground mb-2">Classic Collection</h3>
            <p className="text-sm text-muted-foreground">Milky • Creamy, smooth & lightly sweetened with milk</p>
            <p className="text-xs text-muted-foreground mt-2 italic">All drinks served iced by default — choose Hot if you prefer.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
            {isLoading ? (
              // Skeleton loaders for classic drinks
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={`skeleton-${index}`} className="overflow-hidden md:flex md:items-center md:gap-4">
                  <div className="relative w-full h-48 md:w-28 md:h-28 shrink-0 overflow-hidden rounded-md">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <div className="p-4 md:p-0 md:flex-1 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <Skeleton className="h-6 w-32" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              applyFilters(classicDrinks).map((drink) => (
              <Card key={drink.id} className="overflow-hidden group hover:shadow-lg transition-shadow md:flex md:items-center md:gap-4">
                <div className="relative w-full h-48 md:w-28 md:h-28 shrink-0 overflow-hidden rounded-md">
                  <img 
                    src={drink.image} 
                    alt={drink.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="p-4 md:p-0 md:flex-1 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-foreground">{drink.name}</h4>
                      <div className="flex items-center gap-2">
                        {bestsellerIds.includes(drink.id) && (
                          <Badge variant="secondary">Bestseller</Badge>
                        )}
                        {isNew(drink) && (
                          <Badge className="bg-green-200 text-green-900">New</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{drink.description}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-foreground">RM{drink.price.toFixed(2)}</span>
                  </div>


                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedDrink(drink)}
                    >
                      Customize
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleQuickAdd(drink)}
                    >
                      + Add
                    </Button>
                  </div>
                </div>
              </Card>
              ))
            )}
            {!isLoading && applyFilters(classicDrinks).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No drinks match these filters — 
                <Button variant="link" onClick={resetFilters} className="underline px-1">reset?</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "refreshing" && (
        <div id="refreshing" className="space-y-4">
          <div className="mb-4">
            <h3 className="font-playfair text-2xl font-bold text-foreground mb-2">Refreshing Collection</h3>
            <p className="text-sm text-muted-foreground">Fresh • Light, uplifting & energized rather than heavy</p>
            <p className="text-xs text-muted-foreground mt-2 italic">All drinks served iced by default — choose Hot if you prefer.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
            {isLoading ? (
              // Skeleton loaders for refreshing drinks
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={`skeleton-refreshing-${index}`} className="overflow-hidden md:flex md:items-center md:gap-4">
                  <div className="relative w-full h-48 md:w-28 md:h-28 shrink-0 overflow-hidden rounded-md">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <div className="p-4 md:p-0 md:flex-1 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <Skeleton className="h-6 w-32" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              applyFilters(refreshingDrinks).map((drink) => (
              <Card key={drink.id} className="overflow-hidden group hover:shadow-lg transition-shadow md:flex md:items-center md:gap-4">
                <div className="relative w-full h-48 md:w-28 md:h-28 shrink-0 overflow-hidden rounded-md">
                  <img 
                    src={drink.image} 
                    alt={drink.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="p-4 md:p-0 md:flex-1 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-foreground">{drink.name}</h4>
                      <div className="flex items-center gap-2">
                        {bestsellerIds.includes(drink.id) && (
                          <Badge variant="secondary">Bestseller</Badge>
                        )}
                        {isNew(drink) && (
                          <Badge className="bg-green-200 text-green-900">New</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{drink.description}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-foreground">RM{drink.price.toFixed(2)}</span>
                  </div>


                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedDrink(drink)}
                    >
                      Customize
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleQuickAdd(drink)}
                    >
                      + Add
                    </Button>
                  </div>
                </div>
              </Card>
              ))
            )}
            {!isLoading && applyFilters(refreshingDrinks).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No drinks match these filters — 
                <Button variant="link" onClick={resetFilters} className="underline px-1">reset?</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "addons" && (
        <div id="addons" className="space-y-4">
          <div className="mb-4">
            <h3 className="font-playfair text-2xl font-bold text-foreground mb-2">Add-Ons</h3>
            <p className="text-sm text-muted-foreground">Enhance your drink with premium ingredients</p>
          </div>

          <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
            {isLoading ? (
              // Skeleton loaders for add-ons
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={`skeleton-addon-${index}`} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </Card>
              ))
            ) : (
              addOns.map((addOn) => (
              <Card key={addOn.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{addOn.name}</h4>
                      {addOn.recommended && (
                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                      )}
                    </div>
                    <p className="text-lg font-bold text-primary">+RM{addOn.price.toFixed(2)}</p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleAddOnAdd(addOn)}
                  >
                    + Add
                  </Button>
                </div>
              </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Service chips */}
      <div className="flex items-center justify-center gap-3 pt-8 pb-4 text-xs text-muted-foreground">
        <span>🌿 Fresh</span>
        <span>•</span>
        <span>⚡ 15s checkout</span>
        <span>•</span>
        <span>💳 Secure</span>
      </div>

      {/* Customize Modal */}
      {selectedDrink && (
        <DrinkCustomization
          drink={selectedDrink}
          onClose={() => setSelectedDrink(null)}
          onAddToCart={(item) => {
            onAddToCart(item);
            setSelectedDrink(null);
          }}
          cartItemCount={cartItemCount}
        />
      )}
    </div>
  );
};
