import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { MenuSection } from "@/components/MenuSection";
import { Cart } from "@/components/Cart";
import { type CartItem } from "@/components/DrinkCustomization";
import { ShoppingCart, Truck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { TrustBadges } from "@/components/TrustBadges";
import { initializeGA4, trackCheckoutStart } from "@/lib/analytics";
import heroImage from "@/assets/hero-matcha-drink.png";


const Index = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [hasPreviousOrder, setHasPreviousOrder] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleAddToCart = (item: CartItem) => {
    setCartItems(prev => [...prev, item]);
    toast.success(`${item.name} added to cart`);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    setCartItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity, totalPrice: item.basePrice * quantity } : item
    ));
  };

  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  const handleCartClose = () => {
    setIsCartOpen(false);
  };


  const handleCheckout = () => {
    if (cartItems.length < 2) {
      toast.error("Minimum 2 items required to proceed");
      return;
    }
    // Track checkout start
    trackCheckoutStart(cartTotal);
    // Navigate to checkout page
    window.location.href = '/checkout';
  };


  const handleRepeatLastOrder = () => {
    try {
      const lastOrder = localStorage.getItem('lastOrder');
      if (lastOrder) {
        const previousItems = JSON.parse(lastOrder);
        setCartItems(previousItems);
        toast.success(`Added ${previousItems.length} items from your last order`);
      }
    } catch (error) {
      console.warn('Failed to load last order:', error);
      toast.error("Failed to load last order");
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.totalPrice * (item.quantity || 1)), 0);

  // Load saved delivery method preference and check for previous orders
  useEffect(() => {
    const savedMethod = localStorage.getItem('deliveryMethod') as 'delivery' | 'pickup' | null;
    if (savedMethod) {
      setDeliveryMethod(savedMethod);
    }
    
    // Check for previous order
    const lastOrder = localStorage.getItem('lastOrder');
    if (lastOrder) {
      setHasPreviousOrder(true);
    }
    
    // Load cart items from localStorage
    const savedCartItems = localStorage.getItem('cartItems');
    if (savedCartItems) {
      try {
        const parsedItems = JSON.parse(savedCartItems);
        setCartItems(parsedItems);
      } catch (error) {
        console.warn('Failed to load cart items:', error);
        localStorage.removeItem('cartItems');
      }
    }
    
    // Initialize analytics
    initializeGA4();
  }, []);

  // Save delivery method preference when changed
  useEffect(() => {
    localStorage.setItem('deliveryMethod', deliveryMethod);
  }, [deliveryMethod]);

  // Save cart items to localStorage when cart changes
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    } else {
      localStorage.removeItem('cartItems');
    }
  }, [cartItems]);



  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <Header 
          cartCount={cartItems.length} 
          onCartClick={handleCartClick}
        />

        {/* Hero Section with Background Image */}
        <section className="relative min-h-[60vh] sm:min-h-[70vh] max-h-[80vh]">
          <img 
            src={heroImage} 
            alt="Freshly whisked matcha drink with ice"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
          
          <div className="relative container h-full min-h-[60vh] sm:min-h-[70vh] max-h-[80vh] flex flex-col justify-center items-center text-center px-4 py-16">
            {/* Main Headline */}
            <h1 className="font-playfair font-bold text-[32px] sm:text-[48px] md:text-[56px] leading-[1.1] mb-3 text-white drop-shadow-2xl max-w-4xl">
              Fresh Matcha, Ready in Minutes
            </h1>
            
            {/* Subhead */}
            <p className="font-lato text-[14px] sm:text-[16px] mb-4 text-white/90 drop-shadow-lg max-w-2xl">
              Super fast! Pickup or delivery in KL area.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <Button 
                size="lg" 
                className="flex-1 h-12 text-base font-semibold bg-green-700 hover:bg-green-800 text-white shadow-xl rounded-full"
                onClick={() => {
                  const menuSection = document.getElementById('menu');
                  if (menuSection) {
                    menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                Order Now
              </Button>
            </div>
          </div>
        </section>

        {/* Wavy Divider - Organic wave connecting hero directly to product list */}
        <div className="relative w-full overflow-hidden bg-gradient-to-b from-slate-50 to-green-50">
          <svg className="w-full h-24 sm:h-32 block" viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,0 L1440,0 L1440,120 C1200,80 1000,20 720,60 C440,100 240,40 0,80 Z" fill="hsl(142, 40%, 92%)" stroke="none" />
          </svg>
        </div>

        {/* Category Navigation */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <button className="px-4 py-2 bg-green-100 text-gray-800 rounded-full text-sm font-medium">
                  CLASSIC 5
                </button>
                <button className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium">
                  REFRESHING 5
                </button>
                <button className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium">
                  ADD-ONS 5
                </button>
              </div>
              <span className="text-sm text-gray-500">5 results</span>
            </div>
          </div>
        </div>

        {/* Product List Section */}
        <section id="menu" className="bg-gradient-to-b from-green-50 to-white">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Classic Collection</h2>
              <p className="text-green-600 text-sm mb-1">Milky • Creamy, smooth & lightly sweetened with milk.</p>
              <p className="text-green-600 text-sm">All drinks served iced by default — choose Hot if you prefer.</p>
            </div>
            <MenuSection onAddToCart={handleAddToCart} cartItemCount={cartItems.length} />
          </div>
        </section>

        {/* Shopping Cart */}
        <Cart 
          isOpen={isCartOpen}
          onClose={handleCartClose}
          items={cartItems}
          onRemoveItem={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateQuantity}
          onCheckout={handleCheckout}
        />
      </div>
    </TooltipProvider>
  );
};

export default Index;

