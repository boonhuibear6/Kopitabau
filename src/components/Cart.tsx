import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag, Heart, RotateCcw, Plus, Minus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { CartItem } from "./DrinkCustomization";

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onCheckout: () => void;
}

export const Cart = ({ isOpen, onClose, items, onRemoveItem, onUpdateQuantity, onCheckout }: CartProps) => {
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const [cartAnnouncement, setCartAnnouncement] = useState<string>("");
  const [removedItems, setRemovedItems] = useState<{item: CartItem, index: number}[]>([]);

  const handleRemoveItem = (index: number) => {
    const removedItem = items[index];
    
    // Store removed item for undo functionality
    setRemovedItems(prev => [...prev, { item: removedItem, index }]);
    
    onRemoveItem(index);
    
    // Announce item removal
    const newTotal = items.filter((_, i) => i !== index).reduce((sum, item) => sum + item.totalPrice, 0);
    setCartAnnouncement(`${removedItem.name} removed from cart. ${items.length - 1} items remaining. Total: RM${newTotal.toFixed(2)}`);
    
    // Show confirmation toast with undo option
    toast.success(`${removedItem.name} removed from cart`, {
      action: {
        label: "Undo",
        onClick: () => handleUndoRemove(removedItem, index)
      },
      duration: 5000,
    });
    
    // Clear announcement after a short delay
    setTimeout(() => setCartAnnouncement(""), 100);
  };

  const handleUndoRemove = (item: CartItem, originalIndex: number) => {
    // This would need to be implemented in the parent component
    // For now, we'll just show a message
    toast.info("Undo functionality would restore the item here");
    setRemovedItems(prev => prev.filter(removed => removed.index !== originalIndex));
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(index);
      return;
    }
    onUpdateQuantity(index, newQuantity);
  };

  const saveAsFavorite = (item: CartItem) => {
    const favoriteKey = `favorite:${item.drinkId}`;
    const fav = { 
      size: item.size, 
      ice: item.iceLevel, 
      sweetness: item.sweetness, 
      milk: item.addOns.find(a => ['Oat', 'Soy'].includes(a)) || 'Fresh',
      toppings: item.addOns.filter(a => !['Oat', 'Soy'].includes(a))
    };
    
    try {
      localStorage.setItem(favoriteKey, JSON.stringify(fav));
      toast.success("Saved to favorites!");
    } catch (error) {
      console.warn('Failed to save favorite:', error);
      toast.error("Failed to save favorite");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        {/* ARIA Live Region for Screen Reader Announcements */}
        <div 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
        >
          {cartAnnouncement}
        </div>
        
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
          <SheetDescription>
            {items.length === 0 ? "Your cart is empty" : `${items.length} item(s) in cart`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No drinks in your cart yet</p>
            <p className="text-sm text-muted-foreground mt-2">Start adding some delicious drinks!</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[calc(100vh-250px)] pr-4 mt-6">
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="rounded-lg border p-4 space-y-3 bg-card">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{item.name}</h4>
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                            {item.quantity}x
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Size:</span> {item.size}
                          </div>
                          <div>
                            <span className="font-medium">Ice:</span> {item.iceLevel}%
                          </div>
                          <div>
                            <span className="font-medium">Sweetness:</span> {item.sweetness}%
                          </div>
                          <div>
                            <span className="font-medium">Milk:</span> {item.addOns.find(a => ['Oat', 'Soy'].includes(a)) || 'Fresh'}
                          </div>
                        </div>
                        
                        {item.addOns.filter(a => !['Oat', 'Soy'].includes(a)).length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Toppings:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.addOns.filter(a => !['Oat', 'Soy'].includes(a)).map((addon, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {addon}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuantityChange(index, item.quantity - 1)}
                            className="h-8 w-8 hover:bg-destructive/10"
                            title="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-2 text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuantityChange(index, item.quantity + 1)}
                            className="h-8 w-8 hover:bg-primary/10"
                            title="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => saveAsFavorite(item)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            title="Save as favorite"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Item Total</span>
                      <span className="font-semibold text-primary">RM {item.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background/95 backdrop-blur">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">RM {total.toFixed(2)}</span>
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  {items.length} item{items.length !== 1 ? 's' : ''} in cart
                </div>
                <Button 
                  onClick={onCheckout} 
                  size="lg" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
