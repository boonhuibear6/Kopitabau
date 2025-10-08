import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Phone } from "lucide-react";

interface PhoneValidationProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange: (isValid: boolean) => void;
  className?: string;
}

export const PhoneValidation = ({ 
  value, 
  onChange, 
  onValidationChange, 
  className = "" 
}: PhoneValidationProps) => {
  const [error, setError] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isTouched, setIsTouched] = useState<boolean>(false);

  // Malaysian phone number validation with +60 format
  const validatePhone = (phone: string): { isValid: boolean; error: string } => {
    if (!phone.trim()) {
      return { isValid: false, error: "Phone number is required" };
    }

    // Check if it starts with +60
    if (!phone.startsWith('+60')) {
      return { 
        isValid: false, 
        error: "Malaysian numbers must start with +60" 
      };
    }

    // Remove +60 prefix and get digits only
    const cleanPhone = phone.replace('+60', '').replace(/\D/g, "");
    
    // Check if it's a valid Malaysian mobile number
    // Malaysian mobile numbers: 01X-XXXXXXX (10-11 digits starting with 01)
    const malaysianMobileRegex = /^01[0-9]{8,9}$/;
    
    if (cleanPhone.length < 10) {
      return { 
        isValid: false, 
        error: "Phone number too short. Malaysian numbers need 10-11 digits after +60" 
      };
    }
    
    if (cleanPhone.length > 11) {
      return { 
        isValid: false, 
        error: "Phone number too long. Malaysian numbers have max 11 digits after +60" 
      };
    }
    
    if (!malaysianMobileRegex.test(cleanPhone)) {
      return { 
        isValid: false, 
        error: "Invalid Malaysian mobile number format" 
      };
    }
    
    return { isValid: true, error: "" };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Malaysian phone number formatting with +60 mask
    // Remove all non-digit characters first
    const digitsOnly = inputValue.replace(/\D/g, '');
    
    // If user starts typing without +60, add it
    if (digitsOnly.length > 0 && !inputValue.startsWith('+60')) {
      // If it starts with 0, replace with +60
      if (digitsOnly.startsWith('0')) {
        inputValue = '+60' + digitsOnly.substring(1);
      } else {
        // If it doesn't start with 0, add +60
        inputValue = '+60' + digitsOnly;
      }
    }
    
    // Limit to Malaysian format: +60XXXXXXXXX (max 14 characters)
    if (inputValue.length > 14) {
      inputValue = inputValue.substring(0, 14);
    }
    
    onChange(inputValue);
    setIsTouched(true);
  };

  const handleBlur = () => {
    setIsTouched(true);
  };

  useEffect(() => {
    const validation = validatePhone(value);
    setError(validation.error);
    setIsValid(validation.isValid);
    onValidationChange(validation.isValid);
  }, [value, onValidationChange]);

  const getInputState = () => {
    if (!isTouched) return "default";
    return isValid ? "valid" : "error";
  };

  const getExampleText = () => {
    if (error.includes("too short")) return "Example: +60123456789";
    if (error.includes("too long")) return "Example: +60123456789";
    if (error.includes("Invalid format")) return "Example: +60123456789 or +601123456789";
    return "Example: +60123456789";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="phone" className="text-sm font-medium">
        Phone Number <span className="text-destructive">*</span>
      </Label>
      
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="phone"
          type="tel"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="+60123456789"
          className={`pl-10 ${
            getInputState() === "error" 
              ? "border-destructive focus:border-destructive" 
              : getInputState() === "valid" 
                ? "border-green-500 focus:border-green-500" 
                : ""
          }`}
        />
        {isTouched && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        )}
      </div>

      {isTouched && error && (
        <Alert variant="destructive" className="py-2">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <div className="font-medium mb-1">{error}</div>
            <div className="text-xs text-muted-foreground">
              {getExampleText()}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isTouched && isValid && (
        <Alert className="py-2 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-700">
            Valid Malaysian mobile number
          </AlertDescription>
        </Alert>
      )}

      {!isTouched && (
        <div className="text-xs text-muted-foreground">
          Enter your Malaysian mobile number (+60 format)
        </div>
      )}
      
      {/* Microcopy */}
      <div className="text-xs text-muted-foreground mt-1">
        No spam. For delivery updates only.
      </div>
    </div>
  );
};
