import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Phone, Mail, Calendar, Share2, Download, CheckCircle } from "lucide-react";
import { type CheckoutFormData } from "./CheckoutForm";

interface OrderConfirmationProps {
  orderData: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    deliveryMethod: 'delivery' | 'pickup';
    address?: string;
    pickupTime?: string;
    total: number;
    items: any[];
    eta: string;
  };
  onBackToMenu: () => void;
}

export const OrderConfirmation = ({ orderData, onBackToMenu }: OrderConfirmationProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isCalendarAdded, setIsCalendarAdded] = useState<boolean>(false);

  // Generate ETA based on delivery method
  const generateETA = () => {
    const now = new Date();
    if (orderData.deliveryMethod === 'delivery') {
      const eta = new Date(now.getTime() + 45 * 60000); // 45 minutes
      return eta.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return orderData.pickupTime || "15-30 minutes";
    }
  };

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const eta = orderData.deliveryMethod === 'delivery' 
        ? new Date(now.getTime() + 45 * 60000)
        : new Date(now.getTime() + 20 * 60000);
      
      const diff = eta.getTime() - now.getTime();
      
      if (diff > 0) {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeRemaining("Ready!");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [orderData.deliveryMethod]);

  const handleAddToCalendar = () => {
    const event = {
      title: `Kopitapau Order #${orderData.orderNumber}`,
      description: `Your order is ready for ${orderData.deliveryMethod}`,
      start: new Date(Date.now() + (orderData.deliveryMethod === 'delivery' ? 45 : 20) * 60000),
      end: new Date(Date.now() + (orderData.deliveryMethod === 'delivery' ? 75 : 30) * 60000),
      location: orderData.deliveryMethod === 'delivery' ? orderData.address : 'Kopitapau Store, Bukit Indah, Ampang'
    };

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${event.end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
    
    window.open(calendarUrl, '_blank');
    setIsCalendarAdded(true);
  };

  const handleShareOrder = () => {
    const shareText = `Just ordered from Kopitapau! Order #${orderData.orderNumber} - ${orderData.items.length} items for RM${orderData.total.toFixed(2)}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Kopitapau Order',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      // Show toast or notification
    }
  };

  const handleDownloadReceipt = () => {
    // Generate receipt content
    const receiptContent = `
KOPITAPAU RECEIPT
Order #${orderData.orderNumber}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

Customer: ${orderData.customerName}
Phone: ${orderData.customerPhone}
Email: ${orderData.customerEmail}

${orderData.deliveryMethod === 'delivery' ? `Delivery Address: ${orderData.address}` : `Pickup Time: ${orderData.pickupTime}`}

ITEMS:
${orderData.items.map(item => `${item.name} x${item.quantity} - RM${item.totalPrice.toFixed(2)}`).join('\n')}

Total: RM${orderData.total.toFixed(2)}

Thank you for your order!
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kopitapau-receipt-${orderData.orderNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Success Header */}
      <div className="bg-green-50 border-b border-green-200 py-8">
        <div className="container px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">Order Confirmed!</h1>
          <p className="text-green-600">Your order has been successfully placed</p>
        </div>
      </div>

      <div className="container px-4 py-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order #{orderData.orderNumber}</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Confirmed
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <p className="font-medium">{orderData.customerName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{orderData.customerPhone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{orderData.customerEmail}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Method:</span>
                  <p className="font-medium capitalize">{orderData.deliveryMethod}</p>
                </div>
              </div>
              
              {orderData.deliveryMethod === 'delivery' && orderData.address && (
                <div>
                  <span className="text-muted-foreground text-sm">Delivery Address:</span>
                  <p className="font-medium">{orderData.address}</p>
                </div>
              )}
              
              {orderData.deliveryMethod === 'pickup' && orderData.pickupTime && (
                <div>
                  <span className="text-muted-foreground text-sm">Pickup Time:</span>
                  <p className="font-medium">{orderData.pickupTime}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ETA and Timer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Estimated Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {timeRemaining}
                </div>
                <p className="text-muted-foreground">
                  {orderData.deliveryMethod === 'delivery' 
                    ? 'Your order will arrive in approximately 45-75 minutes'
                    : 'Your order will be ready for pickup in 15-30 minutes'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.size} • {item.iceLevel} ice • {item.sweetness} sweet
                        </p>
                        {item.addOns && item.addOns.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Add-ons: {item.addOns.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">RM{item.totalPrice.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>RM{orderData.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map (Mock) */}
          {orderData.deliveryMethod === 'delivery' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg h-48 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Live tracking will be available soon</p>
                    <p className="text-sm text-muted-foreground">You'll receive SMS updates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={handleAddToCalendar}
              variant="outline"
              className="h-12"
              disabled={isCalendarAdded}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {isCalendarAdded ? 'Added to Calendar' : 'Add to Calendar'}
            </Button>
            
            <Button
              onClick={handleShareOrder}
              variant="outline"
              className="h-12"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Order
            </Button>
            
            <Button
              onClick={handleDownloadReceipt}
              variant="outline"
              className="h-12"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            
            <Button
              onClick={onBackToMenu}
              className="h-12"
            >
              Order Again
            </Button>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>+60 12-345-6789</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>support@kopitapau.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Bukit Indah, Ampang, KL</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
