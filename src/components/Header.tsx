import { Coffee, ShoppingCart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
}

export const Header = ({ cartCount, onCartClick }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const NavLinks = () => (
    <>
      <a 
        href="#menu" 
        onClick={scrollToMenu}
        className="text-sm font-medium hover:text-primary transition-colors"
      >
        Menu
      </a>
      <Link 
        to="/how-its-made" 
        className="text-sm font-medium hover:text-primary transition-colors"
        onClick={() => setIsOpen(false)}
      >
        How it's made
      </Link>
      <Link 
        to="/faq" 
        className="text-sm font-medium hover:text-primary transition-colors"
        onClick={() => setIsOpen(false)}
      >
        FAQ
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Coffee className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-primary">ELDmatcha</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Premium Matcha Drinks</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLinks />
          <Button size="sm" onClick={scrollToMenu}>
            Order Now
          </Button>
        </nav>

        {/* Mobile Navigation & Cart */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onCartClick} className="relative h-10 w-10 sm:h-12 sm:w-12">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {cartCount}
              </Badge>
            )}
          </Button>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                <NavLinks />
                <Button onClick={scrollToMenu} className="w-full">
                  Order Now
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
