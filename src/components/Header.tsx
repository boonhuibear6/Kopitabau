import { ShoppingCart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TrustBadges } from "./TrustBadges";
import eldmatchaLogo from "@/assets/eldmatcha-logo-new.png";

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
        className="text-sm font-medium text-white hover:text-green-100 transition-colors"
      >
        Menu
      </a>
      <Link 
        to="/how-its-made" 
        className="text-sm font-medium text-white hover:text-green-100 transition-colors"
        onClick={() => setIsOpen(false)}
      >
        How it's made
      </Link>
      <Link 
        to="/faq" 
        className="text-sm font-medium text-white hover:text-green-100 transition-colors"
        onClick={() => setIsOpen(false)}
      >
        FAQ
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-green-600">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img 
            src={eldmatchaLogo} 
            alt="ELDmatcha Logo" 
            className="h-8 w-8 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-white">ELDmatcha</h1>
            <p className="text-xs text-green-100">Premium Matcha Drinks</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLinks />
          <Button size="sm" onClick={scrollToMenu} className="bg-white text-green-600 hover:bg-green-50">
            Order Now
          </Button>
        </nav>

        {/* Mobile Navigation & Cart */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onCartClick} className="relative h-12 w-12 text-white hover:bg-green-700">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-white text-green-600">
                {cartCount}
              </Badge>
            )}
          </Button>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-12 w-12 text-white hover:bg-green-700">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                <NavLinks />
                <Button onClick={scrollToMenu} className="w-full bg-green-600 text-white hover:bg-green-700">
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
