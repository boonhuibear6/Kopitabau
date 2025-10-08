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
        <section className="relative min-h-[50vh] bg-gradient-to-br from-green-50 to-green-100">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative container mx-auto px-4 py-16 flex flex-col justify-center items-center text-center min-h-[50vh]">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-4">
              Premium Matcha Drinks
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Order in 3 steps. 15s quick checkout.
            </p>
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full"
              onClick={() => {
                const menuSection = document.getElementById('menu');
                if (menuSection) {
                  menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              VIEW MENU
            </Button>
          </div>
        </section>

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

        {/* Content Section */}
        <section id="menu" className="bg-white">
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

