import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { MenuSection } from "@/components/MenuSection";
import { type CartItem } from "@/components/DrinkCustomization";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import heroImage from "@/assets/hero-matcha-drink.png";


const Index = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const handleAddToCart = (item: CartItem) => {
    setCartItems(prev => [...prev, item]);
    toast.success("Item added to cart");
  };

  const handleCheckout = () => {
    if (cartItems.length < 2) {
      toast.error("Minimum 2 items required to proceed");
      return;
    }
    // Navigate to checkout page
    window.location.href = '/checkout';
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.totalPrice * (item.quantity || 1)), 0);

  // Wire demo payments script on mount (works in Vite dev)
  useEffect(() => {
    // Dynamic import avoids bundler issues and allows easy removal later
    import('/payments/demo-payments.js')
      .then((m: any) => (typeof m.initDemoPayments === 'function') && m.initDemoPayments())
      .catch(() => {});
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background pb-24">
        {/* Announcement Bar */}
        <div className="w-full bg-primary text-primary-foreground text-center py-2 px-4 text-xs sm:text-sm font-medium">
          Free delivery over RM60 — Today only
        </div>
        
        <Header 
          cartCount={cartItems.length} 
          onCartClick={() => {}}
        />

      {/* Hero Section - Optimized for Menu Handoff */}
      <section className="relative overflow-hidden">
        <div className="relative min-h-[50vh] sm:min-h-[60vh]">
          <img 
            src={heroImage} 
            alt="Freshly whisked matcha drink with ice"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/20" />
          <div className="relative container h-full min-h-[50vh] sm:min-h-[60vh] flex flex-col justify-center items-center text-center md:items-start md:text-left px-4 md:pl-10 lg:pl-16 xl:pl-24 py-12">
            <h1 className="font-playfair font-bold text-[40px] sm:text-[56px] md:text-[64px] leading-[1.1] mb-4 text-white drop-shadow-2xl max-w-4xl">
              Freshly Whisked Matcha, Delivered Fast
            </h1>
            <p className="font-lato text-[16px] sm:text-[18px] mb-8 text-white drop-shadow-lg max-w-xl">
              Barista-grade matcha made to order. Reach your door in 45–75 mins.
            </p>
            
            <Button 
              size="lg" 
              className="text-base px-10 h-12 rounded-full font-medium shadow-xl"
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
          
          {/* Scroll Cue Arrow */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
            <button 
              onClick={() => {
                const menuSection = document.getElementById('menu');
                if (menuSection) {
                  menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-full p-3 hover:bg-white/30 transition-colors"
              aria-label="Scroll to menu"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Wavy Divider - Organic wave connecting hero to content */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <svg className="w-full h-24 sm:h-32 block" viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 L1440,0 L1440,120 C1200,80 1000,20 720,60 C440,100 240,40 0,80 Z" fill="hsl(142, 40%, 92%)" stroke="none" />
        </svg>
      </div>

      {/* Smart Toast & Add-on Sheet - portal in page */}
      <div id="smart-toast" className="fixed left-1/2 -translate-x-1/2 bottom-[88px] z-[1000] hidden">
        <div className="bg-white border rounded-xl shadow-xl px-3 py-2 min-w-[320px] max-w-[90vw]">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <div className="flex-1 min-w-0">
              <div id="toast-title" className="font-semibold truncate">Added</div>
              <div id="toast-sub" className="text-xs text-muted-foreground truncate">Variants</div>
            </div>
            <button id="toast-undo" className="text-primary text-sm">Undo</button>
            <button id="toast-cart" className="text-primary text-sm">View cart</button>
          </div>
        </div>
      </div>
      <div id="addon-sheet" className="fixed left-0 right-0 bottom-0 z-[999] hidden">
        <div className="mx-auto max-w-md w-full bg-white border-t rounded-t-xl shadow-2xl p-4" style={{height: '180px'}}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Popular add-ons</div>
            <button id="addon-close" className="text-sm text-muted-foreground">Maybe later</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button data-addon="Oat" data-price="2" className="px-3 py-1 rounded-full border">Oat +RM2</button>
            <button data-addon="Azuki" data-price="2" className="px-3 py-1 rounded-full border">Azuki +RM2</button>
            <button data-addon="Cream Cloud" data-price="3" className="px-3 py-1 rounded-full border">Cream Cloud +RM3</button>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <section id="menu" className="container py-8 sm:py-12 px-4 bg-gradient-to-b from-hsl(142, 40%, 92%) to-white">
        <div className="mb-8 text-center">
          <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Premium Matcha Drinks
          </h2>
          <p className="text-muted-foreground mb-4">
            Crafted fresh • 45–75 min delivery • Secure checkout
          </p>
        </div>
        <MenuSection onAddToCart={handleAddToCart} />
      </section>

      {/* Checkout Placeholder */}
      <section id="checkout" className="container py-12 px-4 text-center">
        <div className="max-w-md mx-auto p-8 bg-muted rounded-lg">
          <h3 className="font-playfair text-2xl font-bold mb-2">Checkout</h3>
          <p className="text-sm text-muted-foreground">
            Complete your order and choose delivery details
          </p>
          {/* Demo Payments (toyyibPay & senangPay) */}
          <div className="mt-6 space-y-3">
            <div className="text-sm">Total: <span data-cart-total>{`RM${cartTotal.toFixed(2)}`}</span></div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button data-pay-toyyib className="h-12">Pay with FPX (toyyibPay)</Button>
              <Button data-pay-senang className="h-12">Pay with FPX / e-Wallet (senangPay)</Button>
            </div>
            {/* Hidden senangPay form (sandbox) */}
            <form id="senangForm" method="POST" action="https://sandbox.senangpay.my/payment/YOUR_MERCHANT_ID" className="hidden">
              <input type="hidden" name="detail" value="Matcha Order" />
              <input type="hidden" name="amount" value="0.00" />
              <input type="hidden" name="order_id" value="" />
              <input type="hidden" name="name" value="Demo Customer" />
              <input type="hidden" name="email" value="demo@example.com" />
              <input type="hidden" name="phone" value="0123456789" />
              {/* LIVE ONLY: <input type="hidden" name="hash" value="SERVER_COMPUTED_HASH" /> */}
            </form>
          </div>
        </div>
      </section>

      {/* Mobile Sticky Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t-2 border-primary/20 shadow-lg z-50 md:hidden safe-bottom">
        <div className="px-3 py-2">
          {/* Progress to Minimum */}
          {cartItems.length < 2 && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Add {2 - cartItems.length} more item{2 - cartItems.length !== 1 ? 's' : ''} to proceed</span>
                <span>{cartItems.length}/2</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all" 
                  style={{ width: `${(cartItems.length / 2) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Free Delivery Progress */}
          {cartTotal < 60 && cartTotal > 0 && (
            <div className="mb-2 text-xs text-muted-foreground">
              <span className="font-medium">+RM{(60 - cartTotal).toFixed(2)} to free delivery</span>
              <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-green-500 transition-all" 
                  style={{ width: `${(cartTotal / 60) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleCheckout}
              disabled={cartItems.length < 2}
              className="flex-1 h-12 text-base font-medium"
            >
              Proceed — RM{cartTotal.toFixed(2)}
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 px-4 border-2"
            >
              <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </Button>
          </div>

          {/* Service Chips */}
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>🌿 Fresh</span>
            <span>•</span>
            <span>⚡ 45–75 min</span>
            <span>•</span>
            <span>💳 Secure</span>
          </div>
        </div>
      </div>

      {/* Desktop Cart Bar */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground shadow-lg z-50 safe-bottom">
        <div className="container px-4 py-2">
          {/* Progress Indicators */}
          <div className="flex items-center justify-between text-xs mb-2 opacity-90">
            <div className="flex items-center gap-4">
              {cartItems.length < 2 && (
                <span>Need {2 - cartItems.length} more item{2 - cartItems.length !== 1 ? 's' : ''}</span>
              )}
              {cartTotal < 60 && cartTotal > 0 && (
                <span>+RM{(60 - cartTotal).toFixed(2)} to free delivery</span>
              )}
              <span>🌿 Fresh • ⚡ 45–75 min • 💳 Secure</span>
            </div>
            <span>{cartItems.length} items</span>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={cartItems.length < 2}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg flex items-center justify-between px-6 text-lg"
            variant="ghost"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              <span>{cartItems.length < 2 ? `Add ${2 - cartItems.length} more to proceed` : 'Proceed to Checkout'}</span>
            </div>
            <span className="font-bold" data-cart-total>RM{cartTotal.toFixed(2)}</span>
          </Button>
        </div>
      </div>
      </div>
    </TooltipProvider>
  );
};

export default Index;

// Smart Toast implementation (queue + pause on hover)
let toastQueue: Array<{title: string; sub?: string; onUndo?: () => void; afterHide?: () => void}> = [];
let toastShowing = false;
function showSmartToast(payload: {title: string; sub?: string; onUndo?: () => void; afterHide?: () => void}){
  toastQueue.push(payload);
  if (!toastShowing) nextToast();
}
function nextToast(){
  const item = toastQueue.shift(); if (!item) return; toastShowing = true;
  const root = document.getElementById('smart-toast'); if (!root) return; 
  (document.getElementById('toast-title') as HTMLElement).textContent = item.title;
  (document.getElementById('toast-sub') as HTMLElement).textContent = item.sub || '';
  const undoBtn = document.getElementById('toast-undo');
  const cartBtn = document.getElementById('toast-cart');
  if (undoBtn) undoBtn.onclick = () => { item.onUndo && item.onUndo(); hideToast(true, item.afterHide); };
  if (cartBtn) cartBtn.onclick = () => { document.querySelector('[data-open-cart]')?.dispatchEvent(new Event('click')); };
  root.classList.remove('hidden');
  let timer = window.setTimeout(() => hideToast(false, item.afterHide), 2500);
  const onEnter = () => { window.clearTimeout(timer); };
  const onLeave = () => { timer = window.setTimeout(() => hideToast(false, item.afterHide), 1200); root?.removeEventListener('mouseleave', onLeave); };
  root.addEventListener('mouseenter', onEnter, { once: true });
  root.addEventListener('mouseleave', onLeave);
}
function hideToast(viaUndo: boolean, afterHide?: () => void){
  const root = document.getElementById('smart-toast'); if (!root) return;
  root.classList.add('hidden'); toastShowing = false;
  if (!viaUndo && typeof afterHide === 'function') afterHide();
  window.setTimeout(nextToast, 100);
}

