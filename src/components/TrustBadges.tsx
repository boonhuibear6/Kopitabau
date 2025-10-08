import { Shield, Clock, CheckCircle } from "lucide-react";

interface TrustBadgesProps {
  variant?: "default" | "compact" | "inline";
  className?: string;
}

export const TrustBadges = ({ variant = "default", className = "" }: TrustBadgesProps) => {
  const badges = [
    {
      icon: CheckCircle,
      label: "Halal Certified",
      description: "100% Halal",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      icon: Shield,
      label: "Secure Payment",
      description: "SSL Encrypted",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      icon: Clock,
      label: "Fresh Daily",
      description: "Made fresh",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    }
  ];

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {badges.map((badge, index) => {
          const Icon = badge.icon;
          return (
            <div
              key={index}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${badge.bgColor} ${badge.borderColor} border`}
            >
              <Icon className={`h-3 w-3 ${badge.color}`} />
              <span className={badge.color}>{badge.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-4 text-xs text-muted-foreground ${className}`}>
        <span className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-600" />
          Halal
        </span>
        <span className="flex items-center gap-1">
          <Shield className="h-3 w-3 text-blue-600" />
          Secure
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-orange-600" />
          Fresh
        </span>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`}>
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        return (
          <div
            key={index}
            className={`flex items-center gap-3 p-3 rounded-lg border ${badge.bgColor} ${badge.borderColor}`}
          >
            <Icon className={`h-5 w-5 ${badge.color}`} />
            <div>
              <div className={`font-medium text-sm ${badge.color}`}>
                {badge.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {badge.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
