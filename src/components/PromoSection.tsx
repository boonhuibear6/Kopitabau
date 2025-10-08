import { useState, useEffect } from "react";
import { ChevronDown, Clock, Zap, Minus, Plus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { type CartItem } from "@/components/DrinkCustomization";
import matchaLatteImg from "@/assets/drinks/matcha-latte.jpg";

interface PromoSectionProps {
  onAddToCart: (item: CartItem) => void;
}

export const PromoSection = ({ onAddToCart }: PromoSectionProps) => {
  const [showMatchaPromo, setShowMatchaPromo] = useState(false);
  const [mixMatchQty, setMixMatchQty] = useState(0);
  const [codeCopied, setCodeCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 21, seconds: 45 });

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText("ILOVEMATCHA");
    setCodeCopied(true);
    toast.success("Promo code copied!");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleAddMixMatch = () => {
    if (mixMatchQty > 0) {
      onAddToCart({
        drinkId: "mix-match",
        name: "Mix & Match",
        image: matchaLatteImg,
        basePrice: 27.00,
        quantity: mixMatchQty,
        size: "Medium",
        iceLevel: "100",
        sweetness: "100",
        addOns: [],
        totalPrice: 27.00 * mixMatchQty,
      });
      setMixMatchQty(0);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Urgency */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1">💙PROMO💙</h2>
          <p className="text-sm text-muted-foreground">Buy any 2, get RM5 off — auto-applied</p>
        </div>
        <div className="flex items-center gap-2 text-destructive">
          <Clock className="h-4 w-4" />
          <span className="font-mono font-bold text-sm">
            {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Enhanced Matcha Promo Card */}
      <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-1/3">
              <img 
                src={matchaLatteImg} 
                alt="Matcha Promo" 
                className="w-full h-48 sm:h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className="bg-destructive text-destructive-foreground">
                  <Zap className="h-3 w-3 mr-1" />
                  Hot Deal
                </Badge>
                <Badge variant="secondary" className="bg-background/90">
                  62 left today
                </Badge>
              </div>
            </div>
            <div className="flex-1 p-4 sm:p-6">
              <h3 className="font-bold text-xl mb-2">Special Matcha Promo</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Buy any drink from our Coffee or Matcha Series — get Yuri/Matcha at <strong>RM10 only</strong>
              </p>
              
              <div className="flex items-center gap-2 mb-4">
                <code className="flex-1 bg-muted px-3 py-2 rounded-lg font-mono font-bold text-sm">
                  ILOVEMATCHA
                </code>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCopyCode}
                  className="gap-2"
                >
                  {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {codeCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                ℹ️ All drinks served iced by default — tap "Hot" if you prefer
              </p>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowMatchaPromo(!showMatchaPromo)}
                className="w-full"
              >
                {showMatchaPromo ? 'Hide' : 'Show'} Products 
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showMatchaPromo ? 'rotate-180' : ''}`} />
              </Button>

              {showMatchaPromo && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Eligible drinks:</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• All Classic Matcha Lattes</li>
                    <li>• Premium Matcha Series</li>
                    <li>• Coffee Series (Latte, Cappuccino)</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mix & Match Bundle */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-1/3">
              <img 
                src={matchaLatteImg} 
                alt="Mix & Match" 
                className="w-full h-48 sm:h-full object-cover"
              />
              <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                Save RM2.40
              </Badge>
            </div>
            <div className="flex-1 p-4 sm:p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg">Mix & Match</h3>
                  <p className="text-xs text-muted-foreground">Why choose one when you can have all 3?</p>
                </div>
                <Badge variant="outline" className="text-xs">Limit: 100</Badge>
              </div>
              
              <div className="space-y-1.5 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">2</span>
                  <span>Espresso packs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">2</span>
                  <span>Taro packs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">2</span>
                  <span>Matcha packs (Ajisai/Niko Neko)</span>
                </div>
              </div>

              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">RM27.00</span>
                    <span className="text-sm text-muted-foreground line-through">RM29.40</span>
                  </div>
                  <p className="text-xs text-muted-foreground">RM4.50 per pack</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMixMatchQty(Math.max(0, mixMatchQty - 1))}
                    disabled={mixMatchQty === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold text-lg">{mixMatchQty}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMixMatchQty(mixMatchQty + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleAddMixMatch}
                disabled={mixMatchQty === 0}
                className="w-full"
                size="lg"
              >
                Add to Cart {mixMatchQty > 0 && `— RM${(27 * mixMatchQty).toFixed(2)}`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
