import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const HowItsMade = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Announcement Bar */}
      <div className="w-full bg-primary text-primary-foreground text-center py-2 px-4 text-xs sm:text-sm font-medium">
        Free delivery over RM60 — Today only
      </div>
      
      <Header cartCount={0} onCartClick={() => {}} />

      <main className="container py-8 px-4 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Button>
        </Link>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-6">How it's made</h1>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our Matcha Journey</h2>
            <p className="text-muted-foreground mb-4">
              We source our matcha directly from shade-grown tea gardens in Japan, where leaves are carefully protected from direct sunlight for weeks before harvest. This process increases chlorophyll production, giving our matcha its vibrant green color and rich umami flavor.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Stone-Milled Perfection</h2>
            <p className="text-muted-foreground mb-4">
              After harvesting, the leaves are steamed, dried, and sorted. Only the finest leaves are stone-milled into the ultra-fine powder you know and love. This traditional method takes hours but preserves the delicate nutrients and antioxidants that make matcha so beneficial.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Quality You Can Taste</h2>
            <p className="text-muted-foreground mb-4">
              Every batch is third-party tested for purity and quality. We never add sugar, artificial flavors, or preservatives. What you get is pure, premium matcha — nothing more, nothing less.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Crafted Fresh Daily</h2>
            <p className="text-muted-foreground mb-4">
              Each drink is prepared to order using our signature whisking technique, ensuring the perfect froth and smooth texture every time. We combine our premium matcha with high-quality plant-based milk for a creamy, satisfying experience.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default HowItsMade;
