import { useState } from "react";
import { Minus, Plus, Star, Droplet, Thermometer, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type CartItem, DrinkCustomization } from "@/components/DrinkCustomization";
import icedLatteImg from "@/assets/drinks/iced-latte.jpg";
import hotCappuccinoImg from "@/assets/drinks/hot-cappuccino.jpg";
import icedMochaImg from "@/assets/drinks/iced-mocha.jpg";
import matchaLatteImg from "@/assets/drinks/matcha-latte.jpg";

interface ClassicSectionProps {
  onAddToCart: (item: CartItem) => void;
}

const classicDrinks = [
  {
    id: "iced-latte",
    name: "Iced Matcha Latte",
    description: "Premium matcha with creamy oat milk over ice",
    price: 12.00,
    basePrice: 12.00,
    image: icedLatteImg,
    rating: 4.9,
    reviews: 842,
    isHot: false,
    isIced: true,
    badges: ["Bestseller"],
  },
  {
    id: "hot-cappuccino",
    name: "Hot Matcha Latte",
    description: "Classic matcha latte with smooth foam",
    price: 11.50,
    basePrice: 11.50,
    image: hotCappuccinoImg,
    rating: 4.8,
    reviews: 621,
    isHot: true,
    isIced: false,
    badges: [],
  },
  {
    id: "iced-mocha",
    name: "Matcha Chocolate Fusion",
    description: "Matcha and chocolate perfection",
    price: 13.50,
    basePrice: 13.50,
    image: icedMochaImg,
    rating: 4.9,
    reviews: 504,
    isHot: false,
    isIced: true,
    badges: ["New"],
  },
  {
    id: "matcha-latte",
    name: "Premium Matcha",
    description: "Pure ceremonial grade matcha",
    price: 13.00,
    basePrice: 13.00,
    image: matchaLatteImg,
    rating: 5.0,
    reviews: 1203,
    isHot: false,
    isIced: true,
    badges: ["Bestseller"],
  },
];

export const ClassicSection = ({ onAddToCart }: ClassicSectionProps) => {
  const [selectedDrink, setSelectedDrink] = useState<typeof classicDrinks[0] | null>(null);

  const handleQuickAdd = (drink: typeof classicDrinks[0]) => {
    onAddToCart({
      drinkId: drink.id,
      name: drink.name,
      image: drink.image,
      basePrice: drink.price,
      quantity: 1,
      size: "medium",
      iceLevel: drink.isIced ? "100" : "0",
      sweetness: "50",
      addOns: [],
      totalPrice: drink.price,
    });
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1">CLASSIC</h2>
          <p className="text-sm text-muted-foreground">Our signature matcha drinks</p>
        </div>

        {/* Enhanced Drinks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classicDrinks.map(drink => (
            <Card key={drink.id} className="overflow-hidden group hover:shadow-lg transition-all">
              <CardContent className="p-0">
                {/* Image Section */}
                <div className="relative">
                  <img 
                    src={drink.image} 
                    alt={drink.name} 
                    className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {drink.badges.map(badge => (
                      <Badge key={badge} className="bg-primary text-primary-foreground text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content Section */}
                <div className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base">{drink.name}</h3>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      <span className="font-semibold">{drink.rating}</span>
                      <span>({drink.reviews})</span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">{drink.description}</p>
                  </div>

                  {/* Modifiers */}
                  <div className="flex items-center gap-2 text-xs">
                    {drink.isIced && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Droplet className="h-3 w-3" /> Iced
                      </span>
                    )}
                    {drink.isHot && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Thermometer className="h-3 w-3" /> Hot
                      </span>
                    )}
                    <span className="text-muted-foreground">• Oat Milk</span>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xl font-bold text-primary">RM{drink.price.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedDrink(drink)}
                      className="text-xs"
                    >
                      Customize
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleQuickAdd(drink)}
                      className="text-xs gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedDrink && (
        <DrinkCustomization
          drink={selectedDrink}
          onClose={() => setSelectedDrink(null)}
          onAddToCart={onAddToCart}
        />
      )}
    </>
  );
};
