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
      <div className={`min-h-screen bg-background ${cartItems.length > 0 ? 'pb-16 lg:pb-0' : ''}`}>
        {/* Top Banner */}
        <div className="bg-green-100 text-green-800 text-center py-2 text-sm font-medium">
          Free delivery over RM60 – Today only
        </div>

        {/* Header */}
        <Header 
          cartCount={cartItems.length} 
          onCartClick={handleCartClick}
        />

        {/* Hero Section with Background Image and Mobile Layout */}
        <section className="relative min-h-[60vh] sm:min-h-[70vh] max-h-[80vh]">
          {/* Background Image */}
          <img 
            src={heroImage} 
            alt="Freshly whisked matcha drink with ice"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
          
          {/* Content Container */}
          <div className="relative container h-full min-h-[60vh] sm:min-h-[70vh] max-h-[80vh] flex items-end justify-center">
            <div className="w-full flex justify-center px-4 py-16">
              {/* Hero Text - Centered at bottom */}
              <div className="text-center max-w-2xl">
                {/* Main Headline */}
                <h1 className="font-playfair font-bold text-[28px] sm:text-[48px] md:text-[56px] leading-[1.1] mb-3 text-white drop-shadow-2xl">
                  Freshly Whisked Matcha,<br />Delivered Fast
                </h1>
                
                {/* Subhead */}
                <p className="font-lato text-[14px] sm:text-[16px] mb-4 text-white/90 drop-shadow-lg">
                  Barista-grade matcha made to order.<br />Reach your door in 45-75 mins.
                </p>
                
                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
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
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="w-8 h-8 bg-gray-200/80 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </section>


        {/* Product List Section */}
        <section id="menu" className="bg-gradient-to-b from-white to-green-50">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Full Menu</h2>
              <p className="text-green-600 text-sm mb-1">Crafted fresh • 45-75 min delivery • Secure checkout</p>
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

        {/* Sticky Bottom Cart Bar - Mobile Only */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              {/* Cart Summary */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  RM{cartTotal.toFixed(2)}
                </div>
              </div>
              
              {/* Checkout Button */}
              <Button 
                onClick={handleCheckout}
                className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-full font-semibold"
              >
                Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default Index;

