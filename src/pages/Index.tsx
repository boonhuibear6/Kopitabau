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
      
      <div className="min-h-screen bg-background pb-24">
        {/* Announcement Bar */}
        <div className="w-full bg-primary text-primary-foreground text-center py-2 px-4 text-xs sm:text-sm font-medium">
          {deliveryMethod === 'delivery' ? 'Free delivery over RM60 — Today only' : 'Fresh matcha ready for pickup — Today only'}
        </div>
        
        <Header 
          cartCount={cartItems.length} 
          onCartClick={handleCartClick}
        />

        {/* Free Delivery Banner */}
        {deliveryMethod === 'delivery' && cartTotal > 0 && cartTotal < 60 && (
          <div className="w-full bg-green-50 border-b border-green-200 sticky top-0 z-40">
            <div className="container px-4 py-3">
              <div className="text-center">
                <span className="text-sm font-medium text-green-800">
                  Add RM{(60 - cartTotal).toFixed(2)} more for free delivery! (RM{cartTotal.toFixed(2)} / RM60)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Free Delivery Achieved Banner */}
        {deliveryMethod === 'delivery' && cartTotal >= 60 && (
          <div className="w-full bg-green-100 border-b border-green-300 sticky top-0 z-40">
            <div className="container px-4 py-3">
              <div className="text-center">
                <span className="text-sm font-bold text-green-800">
                  🎉 You've earned free delivery!
                </span>
              </div>
            </div>
          </div>
        )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative min-h-[60vh] sm:min-h-[70vh] max-h-[80vh]">
          <img 
            src={heroImage} 
            alt="Freshly whisked matcha drink with ice"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
          
          {/* Trust Strip - Pinned at top */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-black/20 backdrop-blur-sm border-b border-white/20">
            <div className="container px-4 py-2">
              <TrustBadges variant="inline" className="justify-center text-white/90" />
            </div>
          </div>

          <div className="relative container h-full min-h-[60vh] sm:min-h-[70vh] max-h-[80vh] flex flex-col justify-center items-center text-center px-4 py-16">
            {/* Main Headline */}
            <h1 className="font-playfair font-bold text-[32px] sm:text-[48px] md:text-[56px] leading-[1.1] mb-3 text-white drop-shadow-2xl max-w-4xl">
              Fresh Matcha, Ready in Minutes
            </h1>
            
            {/* Subhead */}
            <p className="font-lato text-[14px] sm:text-[16px] mb-4 text-white/90 drop-shadow-lg max-w-2xl">
              Super fast! Pickup or delivery in KL area.
            </p>

            {/* Social Proof */}
            <div className="mb-6 flex items-center justify-center gap-2 text-white/90">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-current text-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-medium">5,000+ KL people love it!</span>
            </div>

            {/* Delivery/Pickup Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-lg p-1">
                  <button
                    onClick={() => setDeliveryMethod('delivery')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      deliveryMethod === 'delivery'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Truck className="h-4 w-4" />
                    Delivery
                  </button>
                  <button
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      deliveryMethod === 'pickup'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Store className="h-4 w-4" />
                    Pickup
                  </button>
                </div>
              </div>
              <p className="text-white/80 text-sm">
                {deliveryMethod === 'delivery' ? 'Reach your door in 45–75 mins' : 'Ready for pickup in 15–30 mins'}
              </p>
            </div>
            
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
              <Button 
                size="lg" 
                variant="outline"
                className="flex-1 h-12 text-base font-medium bg-white/90 hover:bg-white text-gray-900 border-2 border-white/50 shadow-xl rounded-full"
                onClick={() => {
                  const menuSection = document.getElementById('menu');
                  if (menuSection) {
                    menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                View Menu
              </Button>
            </div>
          </div>
          
        </div>
      </section>

      {/* Wavy Divider - Organic wave connecting hero to content */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <svg className="w-full h-24 sm:h-32 block" viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 L1440,0 L1440,120 C1200,80 1000,20 720,60 C440,100 240,40 0,80 Z" fill="hsl(142, 40%, 92%)" stroke="none" />
        </svg>
      </div>


      {/* Menu Section */}
      <section id="menu" className="container py-8 sm:py-12 px-4 bg-gradient-to-b from-hsl(142, 40%, 92%) to-white">
        <div className="mb-8 text-center">
          <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Premium Matcha Drinks
          </h2>
          <p className="text-muted-foreground mb-4">
            Order in 3 steps. 15s quick checkout.
          </p>
        </div>
        <MenuSection onAddToCart={handleAddToCart} cartItemCount={cartItems.length} />
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

