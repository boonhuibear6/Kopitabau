import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, CreditCard, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentRequestButtonProps {
  amount: number;
  currency: string;
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
  disabled?: boolean;
}

export const PaymentRequestButton = ({ 
  amount, 
  currency, 
  onPaymentSuccess, 
  onPaymentError, 
  disabled = false 
}: PaymentRequestButtonProps) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Check if Payment Request API is supported
    if (typeof window !== 'undefined' && 'PaymentRequest' in window) {
      setIsSupported(true);
    }
  }, []);

  const createPaymentRequest = () => {
    const paymentRequest = new PaymentRequest(
      [
        {
          supportedMethods: ['basic-card'],
          data: {
            supportedNetworks: ['visa', 'mastercard', 'amex'],
            supportedTypes: ['credit', 'debit']
          }
        },
        {
          label: 'Kopitapau Order',
          amount: {
            currency: currency,
            value: amount.toFixed(2)
          }
        }
      ],
      {
        id: `kopitapau-${Date.now()}`,
        displayItems: [
          {
            label: 'Subtotal',
            amount: { currency: currency, value: (amount * 0.94).toFixed(2) }
          },
          {
            label: 'Service Tax (6%)',
            amount: { currency: currency, value: (amount * 0.06).toFixed(2) }
          }
        ],
        total: {
          label: 'Total',
          amount: { currency: currency, value: amount.toFixed(2) }
        }
      }
    );

    return paymentRequest;
  };

  const handlePaymentRequest = async () => {
    if (!isSupported) {
      onPaymentError("Payment Request API not supported on this device");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const paymentRequest = createPaymentRequest();
      
      // Check if payment can be made
      const canMakePayment = await paymentRequest.canMakePayment();
      if (!canMakePayment) {
        throw new Error("Payment method not available");
      }

      // Show payment sheet
      const paymentResponse = await paymentRequest.show();
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Complete the payment
      await paymentResponse.complete('success');
      
      onPaymentSuccess({
        method: 'payment_request',
        transactionId: `txn_${Date.now()}`,
        amount: amount,
        currency: currency
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Payment failed";
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplePay = async () => {
    if (!isSupported) {
      onPaymentError("Apple Pay not available on this device");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Check for Apple Pay support
      const paymentRequest = new PaymentRequest(
        [
          {
            supportedMethods: 'https://apple.com/apple-pay',
            data: {
              version: 3,
              merchantIdentifier: 'merchant.com.kopitapau',
              merchantCapabilities: ['supports3DS'],
              supportedNetworks: ['visa', 'mastercard', 'amex'],
              countryCode: 'MY',
              currencyCode: currency
            }
          }
        ],
        {
          label: 'Kopitapau Order',
          amount: { currency: currency, value: amount.toFixed(2) }
        }
      );

      const canMakePayment = await paymentRequest.canMakePayment();
      if (!canMakePayment) {
        throw new Error("Apple Pay not available");
      }

      const paymentResponse = await paymentRequest.show();
      await paymentResponse.complete('success');
      
      onPaymentSuccess({
        method: 'apple_pay',
        transactionId: `apple_${Date.now()}`,
        amount: amount,
        currency: currency
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Apple Pay failed";
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGooglePay = async () => {
    if (!isSupported) {
      onPaymentError("Google Pay not available on this device");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Check for Google Pay support
      const paymentRequest = new PaymentRequest(
        [
          {
            supportedMethods: 'https://google.com/pay',
            data: {
              environment: 'TEST',
              apiVersion: 2,
              apiVersionMinor: 0,
              allowedPaymentMethods: [
                {
                  type: 'CARD',
                  parameters: {
                    allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                    allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX']
                  }
                }
              ],
              merchantInfo: {
                merchantId: 'kopitapau_merchant',
                merchantName: 'Kopitapau'
              },
              transactionInfo: {
                totalPriceStatus: 'FINAL',
                totalPrice: amount.toFixed(2),
                currencyCode: currency
              }
            }
          }
        ],
        {
          label: 'Kopitapau Order',
          amount: { currency: currency, value: amount.toFixed(2) }
        }
      );

      const canMakePayment = await paymentRequest.canMakePayment();
      if (!canMakePayment) {
        throw new Error("Google Pay not available");
      }

      const paymentResponse = await paymentRequest.show();
      await paymentResponse.complete('success');
      
      onPaymentSuccess({
        method: 'google_pay',
        transactionId: `google_${Date.now()}`,
        amount: amount,
        currency: currency
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Google Pay failed";
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Payment Request API not supported. Please use a different payment method.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          ref={buttonRef}
          onClick={handleApplePay}
          disabled={disabled || isLoading}
          className="h-12 bg-black hover:bg-gray-800 text-white"
        >
          <Smartphone className="h-4 w-4 mr-2" />
          {isLoading ? "Processing..." : "Apple Pay"}
        </Button>
        
        <Button
          onClick={handleGooglePay}
          disabled={disabled || isLoading}
          className="h-12 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Smartphone className="h-4 w-4 mr-2" />
          {isLoading ? "Processing..." : "Google Pay"}
        </Button>
      </div>
      
      <div className="text-center">
        <Button
          onClick={handlePaymentRequest}
          variant="outline"
          disabled={disabled || isLoading}
          className="w-full h-12"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          {isLoading ? "Processing..." : "Use Saved Card"}
        </Button>
      </div>
    </div>
  );
};
