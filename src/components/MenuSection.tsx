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
import matchalemonade from "@/assets/drinks/matchalemonade.png";
import mangomatcha from "@/assets/drinks/mangomatcha.png";
import mangoamericano from "@/assets/drinks/mangoamericano.png";

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


const classicDrinks: Drink[] = [
  { id: "matcha-latte", name: "Matcha Latte", description: "Creamy, smooth & lightly sweetened with milk", price: 10.70, basePrice: 10.70, image: matchaLatte, rating: 4.9, category: "classic" },
  { id: "dirty-matcha", name: "Dirty Matcha", description: "Matcha meets espresso in perfect harmony", price: 13.70, basePrice: 13.70, image: layeredMatcha, rating: 4.8, category: "classic", sales: 180 },
  { id: "matcha-choco", name: "Matcha Choco", description: "Rich chocolate blended with premium matcha", price: 12.70, basePrice: 12.70, image: matchacocco, rating: 4.7, category: "classic", sales: 220 },
  { id: "strawberry-matcha", name: "Strawberry Matcha", description: "Sweet strawberry with earthy matcha notes", price: 13.70, basePrice: 13.70, image: strawberrymatcha, rating: 4.9, category: "classic", createdAt: new Date().toISOString() },
  { id: "hojicha-latte", name: "Hojicha Latte", description: "Roasted tea with creamy milk", price: 10.70, basePrice: 10.70, image: hojichalatte, rating: 4.6, category: "classic", sales: 150 },
];

const refreshingDrinks: Drink[] = [
  { id: "pure-matcha", name: "Pure Matcha", description: "Light, uplifting & energized", price: 10.70, basePrice: 10.70, image: matchaLatte, rating: 4.9, category: "refreshing", sales: 300 },
  { id: "matcha-lemonade", name: "Matcha Lemonade", description: "Zesty citrus meets green tea", price: 12.70, basePrice: 12.70, image: matchalemonade, rating: 4.8, category: "refreshing", sales: 190 },
  { id: "matcha-americano", name: "Matcha Americano", description: "Bold and invigorating", price: 12.70, basePrice: 12.70, image: icedMocha, rating: 4.7, category: "refreshing" },
  { id: "mango-matcha", name: "Mango Matcha", description: "Tropical sweetness with matcha", price: 13.70, basePrice: 13.70, image: mangomatcha, rating: 4.9, category: "refreshing", createdAt: new Date().toISOString() },
  { id: "mango-americano", name: "Mango Americano", description: "Fruity twist on a classic", price: 13.70, basePrice: 13.70, image: mangoamericano, rating: 4.8, category: "refreshing" },
];


interface MenuSectionProps {
  onAddToCart: (item: CartItem) => void;
  cartItemCount?: number;
}

export const MenuSection = ({ onAddToCart, cartItemCount = 0 }: MenuSectionProps) => {
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
    <div className="space-y-8">
      {/* Classic Collection Section */}
      <div id="classic" className="space-y-4">
        <div className="mb-4">
          <h3 className="font-playfair text-2xl font-bold text-foreground mb-2">Classic Collection</h3>
          <p className="text-sm text-muted-foreground">Milky • Creamy, smooth & lightly sweetened with milk</p>
          <p className="text-xs text-muted-foreground mt-2 italic">All drinks served iced by default — choose Hot if you prefer.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {isLoading ? (
            // Skeleton loaders for classic drinks
            Array.from({ length: classicDrinks.length }).map((_, index) => (
              <Card key={`skeleton-${index}`} className="overflow-hidden">
                <div className="relative w-full aspect-[3/4] overflow-hidden rounded-md">
                  <Skeleton className="w-full h-full" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            applyFilters(classicDrinks).map((drink) => (
            <div key={drink.id} className="card">
              <div className="card__shine"></div>
              <div className="card__glow"></div>
              <div className="card__content">
                {isNew(drink) && <div className="card__badge">NEW</div>}
                {bestsellerIds.includes(drink.id) && (
                  <Badge variant="secondary" className={`absolute top-2 ${isNew(drink) ? 'left-16' : 'left-2'} z-20 text-xs`}>
                    Bestseller
                  </Badge>
                )}
                <div className="card__image" style={{'--bg-color': 'transparent'} as React.CSSProperties}>
                  <img 
                    src={drink.image} 
                    alt={drink.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="card__text">
                  <p className="card__title">{drink.name}</p>
                  <p className="card__description">{drink.description}</p>
                </div>
                <div className="card__footer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="card__price">RM{drink.price.toFixed(2)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setSelectedDrink(drink)}
                    >
                      Customize
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => handleQuickAdd(drink)}
                    >
                      + Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            ))
          )}
          {!isLoading && applyFilters(classicDrinks).length === 0 && (
            <div className="text-center py-8 text-muted-foreground col-span-2">
              No drinks match these filters — 
              <Button variant="link" onClick={resetFilters} className="underline px-1">reset?</Button>
            </div>
          )}
        </div>
      </div>

      {/* Refreshing Collection Section */}
      <div id="refreshing" className="space-y-4">
        <div className="mb-4">
          <h3 className="font-playfair text-2xl font-bold text-foreground mb-2">Refreshing Collection</h3>
          <p className="text-sm text-muted-foreground">Fresh • Light, uplifting & energized rather than heavy</p>
          <p className="text-xs text-muted-foreground mt-2 italic">All drinks served iced by default — choose Hot if you prefer.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {isLoading ? (
            // Skeleton loaders for refreshing drinks
            Array.from({ length: refreshingDrinks.length }).map((_, index) => (
              <Card key={`skeleton-refreshing-${index}`} className="overflow-hidden">
                <div className="relative w-full aspect-[3/4] overflow-hidden rounded-md">
                  <Skeleton className="w-full h-full" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            applyFilters(refreshingDrinks).map((drink) => (
            <div key={drink.id} className="card">
              <div className="card__shine"></div>
              <div className="card__glow"></div>
              <div className="card__content">
                {isNew(drink) && <div className="card__badge">NEW</div>}
                {bestsellerIds.includes(drink.id) && (
                  <Badge variant="secondary" className={`absolute top-2 ${isNew(drink) ? 'left-16' : 'left-2'} z-20 text-xs`}>
                    Bestseller
                  </Badge>
                )}
                <div className="card__image" style={{'--bg-color': 'transparent'} as React.CSSProperties}>
                  <img 
                    src={drink.image} 
                    alt={drink.name}
                    loading="lazy"
                    className={`w-full h-full ${
                      drink.id === 'matcha-lemonade' || drink.id === 'mango-matcha' || drink.id === 'mango-americano'
                        ? 'object-contain' 
                        : 'object-cover'
                    } group-hover:scale-105 transition-transform duration-300`}
                  />
                </div>
                <div className="card__text">
                  <p className="card__title">{drink.name}</p>
                  <p className="card__description">{drink.description}</p>
                </div>
                <div className="card__footer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="card__price">RM{drink.price.toFixed(2)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setSelectedDrink(drink)}
                    >
                      Customize
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => handleQuickAdd(drink)}
                    >
                      + Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            ))
          )}
          {!isLoading && applyFilters(refreshingDrinks).length === 0 && (
            <div className="text-center py-8 text-muted-foreground col-span-2">
              No drinks match these filters — 
              <Button variant="link" onClick={resetFilters} className="underline px-1">reset?</Button>
            </div>
          )}
        </div>
      </div>


      {/* Service chips */}
      <div className="flex items-center justify-center gap-3 pt-8 pb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <img width="16" height="16" src="https://img.icons8.com/office/40/organic-food.png" alt="organic-food" className="w-4 h-4" />
          Fresh
        </span>
        <span>•</span>
        <span>⚡ 15s checkout</span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <img width="16" height="16" src="https://img.icons8.com/color/48/card-security.png" alt="card-security" className="w-4 h-4" />
          Secure
        </span>
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
