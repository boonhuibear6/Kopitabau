import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Lock } from "lucide-react";
import { Link } from "react-router-dom";

interface CartItem {
  drinkId: string;
  name: string;
  image: string;
  basePrice: number;
  quantity: number;
  size: string;
  iceLevel: string;
  sweetness: string;
  addOns: string[];
  totalPrice: number;
}

const Checkout = () => {
  const [deliveryOption, setDeliveryOption] = useState("pickup");
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  });

  // Mock cart data - in real app, this would come from context/state
  const cartItems: CartItem[] = [
    {
      drinkId: "dirty-matcha",
      name: "Dirty Matcha",
      image: "/api/placeholder/100/100",
      basePrice: 13.70,
      quantity: 1,
      size: "Large",
      iceLevel: "50%",
      sweetness: "50%",
      addOns: ["Oat Milk"],
      totalPrice: 15.70
    }
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee = deliveryOption === "pickup" ? 0 : 5.00;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    // Handle checkout logic
    console.log("Proceeding to payment...");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-4">
        <div className="container px-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Menu
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="container px-4 py-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.size} • {item.iceLevel} ice • {item.sweetness} sweet
                      </p>
                      {item.addOns.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Add-ons: {item.addOns.join(", ")}
                        </p>
                      )}
                      <p className="text-sm font-medium">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">RM{item.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Delivery Options */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Options *</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={deliveryOption} onValueChange={setDeliveryOption} className="space-y-4">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Pickup - Bukit Indah, Ampang</p>
                          <p className="text-sm text-muted-foreground">Collect at our store</p>
                        </div>
                        <span className="font-semibold text-green-600">RM 0.00</span>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Delivery via Delyva</p>
                          <p className="text-sm text-muted-foreground">45-75 min delivery</p>
                        </div>
                        <span className="font-semibold text-muted-foreground">RM 5.00</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    className="mt-1"
                  />
                </div>
                
                {deliveryOption === "delivery" && (
                  <div>
                    <Label htmlFor="address">Delivery Address *</Label>
                    <Input
                      id="address"
                      value={customerDetails.address}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter delivery address"
                      className="mt-1"
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="notes">Special Instructions</Label>
                  <Input
                    id="notes"
                    value={customerDetails.notes}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special requests?"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Total */}
          <div className="lg:sticky lg:top-8">
            <Card>
              <CardHeader>
                <CardTitle>Order Total</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>RM{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>RM{deliveryFee.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>RM{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleCheckout}
                  className="w-full h-12 text-base font-medium"
                  disabled={!customerDetails.name || !customerDetails.phone || (deliveryOption === "delivery" && !customerDetails.address)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Proceed to Payment
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>🌿 Fresh • ⚡ 45–75 min • 💳 Secure</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
