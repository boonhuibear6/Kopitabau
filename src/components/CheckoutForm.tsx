import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneValidation } from "./PhoneValidation";
import { TrustBadges } from "./TrustBadges";
import { PaymentRequestButton } from "./PaymentRequestButton";
import { MapPin, User, MessageSquare, Clock, CreditCard, Smartphone, Calendar, Mail, Map } from "lucide-react";
import { trackCheckoutStart, trackFormFieldFocus, trackFormSubmission } from "@/lib/analytics";

interface CheckoutFormProps {
  cartTotal: number;
  cartItems: any[];
  onCheckout: (formData: CheckoutFormData) => void;
}

export interface CheckoutFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  unitNumber: string;
  landmark: string;
  postalCode: string;
  notes: string;
  deliveryMethod: 'delivery' | 'pickup';
  pickupTime: string;
  paymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'pay_at_pickup';
  saveCard: boolean;
  receiptMethod: 'email' | 'sms';
}

export const CheckoutForm = ({ cartTotal, cartItems, onCheckout }: CheckoutFormProps) => {
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    unitNumber: "",
    landmark: "",
    postalCode: "",
    notes: "",
    deliveryMethod: 'delivery',
    pickupTime: "",
    paymentMethod: 'card',
    saveCard: false,
    receiptMethod: 'sms'
  });
  
  const [isPhoneValid, setIsPhoneValid] = useState<boolean>(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [priceAnnouncement, setPriceAnnouncement] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string>("");
  const [retryCount, setRetryCount] = useState<number>(0);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState<boolean>(false);
  
  const addressInputRef = useRef<HTMLInputElement>(null);
  const postalCodeInputRef = useRef<HTMLInputElement>(null);

  // Track checkout start when component mounts
  useEffect(() => {
    trackCheckoutStart(cartTotal, cartItems.length);
  }, [cartTotal, cartItems.length]);

  // Generate available time slots
  useEffect(() => {
    const generateTimeSlots = () => {
      const slots = [];
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Start from next hour if current time is past 30 minutes
      let startHour = currentMinute > 30 ? currentHour + 1 : currentHour;
      
      // Generate slots for next 3 days
      for (let day = 0; day < 3; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() + day);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        for (let hour = day === 0 ? startHour : 9; hour < 22; hour++) {
          if (hour < 9 || hour > 21) continue;
          
          const timeString = `${dayName} ${hour.toString().padStart(2, '0')}:00`;
          slots.push(timeString);
        }
      }
      
      setAvailableTimeSlots(slots.slice(0, 12)); // Show first 12 slots
    };
    
    generateTimeSlots();
  }, []);

  // Address autocomplete simulation
  const handleAddressChange = (value: string) => {
    setFormData(prev => ({ ...prev, address: value }));
    
    if (value.length > 2) {
      // Simulate address suggestions
      const mockSuggestions = [
        `${value} Street, Kuala Lumpur`,
        `${value} Avenue, Petaling Jaya`,
        `${value} Road, Subang Jaya`,
        `${value} Boulevard, Ampang`
      ];
      setAddressSuggestions(mockSuggestions);
      setShowAddressSuggestions(true);
    } else {
      setShowAddressSuggestions(false);
    }
  };

  // Postal code validation and formatting
  const handlePostalCodeChange = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Limit to 5 digits
    if (numericValue.length <= 5) {
      setFormData(prev => ({ ...prev, postalCode: numericValue }));
    }
  };

  // Calculate fees and taxes
  const calculateFees = () => {
    const subtotal = cartTotal;
    const deliveryFee = formData.deliveryMethod === 'delivery' ? (subtotal >= 60 ? 0 : 5.00) : 0;
    const serviceTax = subtotal * 0.06; // 6% service tax
    const total = subtotal + deliveryFee + serviceTax;
    
    return {
      subtotal,
      deliveryFee,
      serviceTax,
      total
    };
  };

  const fees = calculateFees();

  // Announce delivery method changes
  useEffect(() => {
    const methodText = formData.deliveryMethod === 'delivery' ? 'delivery' : 'pickup';
    setPriceAnnouncement(`Delivery method changed to ${methodText}. ${formData.deliveryMethod === 'delivery' ? 'Free delivery over RM60' : 'Ready for pickup in 15-30 minutes'}`);
    
    // Clear announcement after a short delay
    setTimeout(() => setPriceAnnouncement(""), 100);
  }, [formData.deliveryMethod]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isPhoneValid) {
      newErrors.phone = "Please enter a valid Malaysian phone number";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (formData.deliveryMethod === 'delivery') {
      if (!formData.address.trim()) {
        newErrors.address = "Delivery address is required";
      }
      if (!formData.postalCode.trim()) {
        newErrors.postalCode = "Postal code is required";
      } else if (formData.postalCode.length !== 5) {
        newErrors.postalCode = "Postal code must be 5 digits";
      }
    }
    
    if (formData.deliveryMethod === 'pickup' && !formData.pickupTime) {
      newErrors.pickupTime = "Please select a pickup time";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      trackFormSubmission('checkout', false);
      return;
    }
    
    setIsSubmitting(true);
    setPaymentError("");
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate occasional payment failures for retry testing
      if (Math.random() < 0.2 && retryCount < 2) {
        throw new Error("Payment processing failed. Please try again.");
      }
      
      // Track successful form submission
      trackFormSubmission('checkout', true);
      
      onCheckout(formData);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Payment failed");
      setRetryCount(prev => prev + 1);
      trackFormSubmission('checkout', false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryPayment = () => {
    setPaymentError("");
    setRetryCount(0);
    handleSubmit(new Event('submit') as any);
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <>
      {/* ARIA Live Region for Screen Reader Announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {priceAnnouncement}
      </div>
      
      <Card className="w-full max-w-2xl mx-auto mb-24">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Checkout</CardTitle>
          <p className="text-center text-muted-foreground">
            Complete your order and choose delivery details
          </p>
          
          {/* Trust Badges */}
          <TrustBadges variant="compact" className="justify-center mt-4" />
          
          {/* Guarantee */}
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span className="font-semibold text-sm">Freshly made or it's on us</span>
            </div>
            <p className="text-green-700 text-xs mt-1">100% satisfaction guarantee. If you're not happy, we'll make it right.</p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information - Essential Fields Only */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      onFocus={() => trackFormFieldFocus('name')}
                      placeholder="John Doe"
                      className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                      autoComplete="name"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onFocus={() => trackFormFieldFocus('email')}
                    placeholder="john@example.com"
                    className={errors.email ? 'border-destructive' : ''}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>
              
              <PhoneValidation
                value={formData.phone}
                onChange={(value) => handleInputChange('phone', value)}
                onValidationChange={setIsPhoneValid}
              />
            </div>

            {/* Delivery Method */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Delivery Method</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={formData.deliveryMethod === 'delivery' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: 'delivery' }))}
                  className="h-12"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Delivery
                </Button>
                <Button
                  type="button"
                  variant={formData.deliveryMethod === 'pickup' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: 'pickup' }))}
                  className="h-12"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Pickup
                </Button>
              </div>
            </div>

            {/* Address Section - Only for Delivery */}
            {formData.deliveryMethod === 'delivery' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Delivery Address</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Street Address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Map className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={addressInputRef}
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      onFocus={() => trackFormFieldFocus('address')}
                      placeholder="Enter street address..."
                      className={`pl-10 ${errors.address ? 'border-destructive' : ''}`}
                      autoComplete="street-address"
                    />
                  </div>
                  {errors.address && (
                    <p className="text-sm text-destructive">{errors.address}</p>
                  )}
                  
                  {/* Address Suggestions */}
                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <div className="border rounded-lg bg-background shadow-lg z-10">
                      {addressSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, address: suggestion }));
                            setShowAddressSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unitNumber" className="text-sm font-medium">
                      Unit Number
                    </Label>
                    <Input
                      id="unitNumber"
                      type="text"
                      value={formData.unitNumber}
                      onChange={(e) => handleInputChange('unitNumber', e.target.value)}
                      placeholder="A-1-2, Block A"
                      autoComplete="off"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="landmark" className="text-sm font-medium">
                      Landmark
                    </Label>
                    <Input
                      id="landmark"
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => handleInputChange('landmark', e.target.value)}
                      placeholder="Near KLCC, Opposite Starbucks"
                      autoComplete="off"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-sm font-medium">
                    Postal Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    ref={postalCodeInputRef}
                    id="postalCode"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.postalCode}
                    onChange={(e) => handlePostalCodeChange(e.target.value)}
                    placeholder="50000"
                    className={errors.postalCode ? 'border-destructive' : ''}
                    maxLength={5}
                    autoComplete="postal-code"
                  />
                  {errors.postalCode && (
                    <p className="text-sm text-destructive">{errors.postalCode}</p>
                  )}
                </div>
              </div>
            )}

            {/* Pickup Time - Only for Pickup */}
            {formData.deliveryMethod === 'pickup' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pickup Time</h3>
                <div className="space-y-2">
                  <Label htmlFor="pickupTime" className="text-sm font-medium">
                    Select Time Slot <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.pickupTime} onValueChange={(value) => handleInputChange('pickupTime', value)}>
                    <SelectTrigger className={errors.pickupTime ? 'border-destructive' : ''}>
                      <Clock className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Choose your pickup time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.map((slot, index) => (
                        <SelectItem key={index} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.pickupTime && (
                    <p className="text-sm text-destructive">{errors.pickupTime}</p>
                  )}
                </div>
                
                {/* Pickup Address Info */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Pickup Location</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">ELDmatcha Store</p>
                        <p className="text-muted-foreground">123 Jalan Ampang, Kuala Lumpur 50450</p>
                        <a 
                          href="https://maps.google.com/?q=123+Jalan+Ampang+Kuala+Lumpur" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs"
                        >
                          View on Google Maps →
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Open: 9am-9pm daily</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Method</h3>
              
              {/* Secure Payment Badges */}
              <div className="flex items-center justify-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-green-600 text-xs">🔒</span>
                  </div>
                  <span>SSL Secured</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 text-xs">💳</span>
                  </div>
                  <span>PCI Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center">
                    <span className="text-purple-600 text-xs">🛡️</span>
                  </div>
                  <span>Fraud Protected</span>
                </div>
              </div>
              
              {/* Payment Request API - Apple Pay / Google Pay */}
              <PaymentRequestButton
                amount={fees.total}
                currency="MYR"
                onPaymentSuccess={(paymentData) => {
                  console.log('Payment successful:', paymentData);
                  setFormData(prev => ({ 
                    ...prev, 
                    paymentMethod: paymentData.method === 'apple_pay' ? 'apple_pay' : 'google_pay'
                  }));
                  // Auto-submit form after successful payment
                  setTimeout(() => {
                    const form = document.getElementById('checkout-form') as HTMLFormElement;
                    if (form) {
                      form.requestSubmit();
                    }
                  }, 1000);
                }}
                onPaymentError={(error) => {
                  setPaymentError(error);
                }}
                disabled={isSubmitting}
              />
              
              {/* Traditional Payment Methods */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or pay with</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant={formData.paymentMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'card' }))}
                  className="w-full h-12"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Credit/Debit Card
                </Button>
                
                {/* Pay at Pickup Option */}
                {formData.deliveryMethod === 'pickup' && (
                  <Button
                    type="button"
                    variant={formData.paymentMethod === 'pay_at_pickup' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'pay_at_pickup' }))}
                    className="w-full h-12"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Pay at Pickup
                  </Button>
                )}
              </div>
              
              {/* Card Saving Option */}
              {formData.paymentMethod === 'card' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="saveCard"
                    checked={formData.saveCard}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, saveCard: !!checked }))}
                  />
                  <Label htmlFor="saveCard" className="text-sm">
                    Save card for faster checkout next time
                  </Label>
                </div>
              )}
            </div>

            {/* Receipt Method */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Receipt Delivery</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={formData.receiptMethod === 'sms' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, receiptMethod: 'sms' }))}
                  className="h-12"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  SMS
                </Button>
                <Button
                  type="button"
                  variant={formData.receiptMethod === 'email' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, receiptMethod: 'email' }))}
                  className="h-12"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>

            {/* Order Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Order Notes (Optional)
              </Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  onFocus={() => trackFormFieldFocus('notes')}
                  placeholder="Any special instructions for your order..."
                  className="pl-10 min-h-[80px]"
                />
              </div>
            </div>

            {/* Payment Error Display */}
            {paymentError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <CreditCard className="h-4 w-4" />
                  <span className="font-medium">Payment Error</span>
                </div>
                <p className="text-sm text-destructive mt-1">{paymentError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRetryPayment}
                  className="mt-2"
                >
                  Retry Payment
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Need Help Section */}
      <div className="w-full max-w-2xl mx-auto mb-8">
        <div className="text-center">
          <button 
            type="button"
            className="text-primary hover:text-primary/80 text-sm font-medium underline"
            onClick={() => {
              const faqSection = document.getElementById('checkout-faq');
              if (faqSection) {
                faqSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            Need help?
          </button>
        </div>
        
        {/* Concise FAQ */}
        <div id="checkout-faq" className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold text-sm mb-3">Quick Help</h4>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Q: What's the minimum order?</strong>
              <p className="text-muted-foreground">A: Minimum 2 items required to proceed.</p>
            </div>
            <div>
              <strong>Q: How long does delivery take?</strong>
              <p className="text-muted-foreground">A: 30-60 minutes depending on your location in KL.</p>
            </div>
            <div>
              <strong>Q: Can I customize my drinks?</strong>
              <p className="text-muted-foreground">A: Yes! Choose ice level, sweetness, and add premium toppings.</p>
            </div>
            <div>
              <strong>Q: What if there's an issue with my order?</strong>
              <p className="text-muted-foreground">A: Contact us immediately and we'll make it right.</p>
            </div>
            <div>
              <strong>Q: What's your delivery area?</strong>
              <p className="text-muted-foreground">A: We deliver to KL, PJ, Subang Jaya, and Shah Alam.</p>
            </div>
            <div>
              <strong>Q: Do you have allergen information?</strong>
              <p className="text-muted-foreground">A: All drinks contain dairy. Vegan options available with oat milk.</p>
            </div>
          </div>
          
          {/* WhatsApp Contact */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">💬</span>
              </div>
              <span className="font-semibold text-sm">Need help?</span>
            </div>
            <a 
              href="https://wa.me/60123456789?text=Hi%20ELDmatcha%2C%20I%20need%20help%20with%20my%20order" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
            >
              Contact us on WhatsApp →
            </a>
          </div>
          
          {/* Privacy Policy */}
          <div className="mt-3 text-xs text-muted-foreground">
            <a href="/privacy-policy" className="hover:underline">
              Privacy Policy
            </a>
            <span className="mx-2">•</span>
            <span>Your data is protected and never shared</span>
          </div>
        </div>
      </div>

      {/* Sticky Order Summary with Fees Breakdown */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t-2 border-primary/20 shadow-lg z-50 safe-bottom">
        <div className="container px-4 py-4">
          <div className="max-w-2xl mx-auto">
            {/* Urgency Chips */}
            <div className="mb-3">
            </div>
            
            {/* Fees Breakdown */}
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>RM{fees.subtotal.toFixed(2)}</span>
                </div>
                {fees.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>RM{fees.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {fees.deliveryFee === 0 && formData.deliveryMethod === 'delivery' && (
                  <div className="flex justify-between text-green-600">
                    <span>Free Delivery</span>
                    <span>RM0.00</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Service Tax (6%)</span>
                  <span>RM{fees.serviceTax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-1 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>RM{fees.total.toFixed(2)}</span>
                </div>
                
                {/* No Hidden Fees */}
                <div className="text-xs text-green-600 text-center mt-2">
                  ✓ No hidden fees. Prices include tax.
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-semibold text-lg">Order Summary</h3>
                  <p className="text-sm text-muted-foreground">{cartItems.length} items • {formData.deliveryMethod}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">RM{fees.total.toFixed(2)}</div>
                </div>
              </div>
              
              <Button
                type="submit"
                form="checkout-form"
                className="h-12 px-8 text-lg font-medium"
                disabled={!isPhoneValid || isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Proceed to Payment"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
