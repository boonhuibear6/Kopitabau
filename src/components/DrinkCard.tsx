import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DrinkCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  onCustomize: (drinkId: string) => void;
}

export const DrinkCard = ({ id, name, description, price, image, onCustomize }: DrinkCardProps) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-soft group cursor-pointer">
      <CardContent className="p-0">
        <div className="aspect-square overflow-hidden bg-gradient-card">
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{name}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">RM {price.toFixed(2)}</span>
            <Button 
              size="sm" 
              onClick={() => onCustomize(id)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Customize
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
