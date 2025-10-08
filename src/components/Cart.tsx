import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { CartItem } from "./DrinkCustomization";

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
}

export const Cart = ({ isOpen, onClose, items, onRemoveItem, onCheckout }: CartProps) => {
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
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
                  <div key={index} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Size: {item.size.charAt(0).toUpperCase() + item.size.slice(1)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Ice: {item.iceLevel}% | Sweetness: {item.sweetness}%
                        </p>
                        {item.addOns.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Add-ons: {item.addOns.join(", ")}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveItem(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

            <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">RM {total.toFixed(2)}</span>
                </div>
                <Button onClick={onCheckout} size="lg" className="w-full">
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
