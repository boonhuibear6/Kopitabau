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
import Hero from "@/components/Hero";


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

        {/* Hero Section */}
        <Hero />


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

