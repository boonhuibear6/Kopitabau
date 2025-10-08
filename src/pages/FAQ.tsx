import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
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

        <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>What makes your matcha special?</AccordionTrigger>
            <AccordionContent>
              Our matcha is shade-grown in Japan and stone-milled using traditional methods. It's third-party tested for purity, completely vegan, and contains no added sugar or artificial ingredients. We prioritize quality and authenticity in every cup.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>Do you offer dairy-free options?</AccordionTrigger>
            <AccordionContent>
              Yes! All our drinks are 100% vegan and made with premium plant-based milk. We use high-quality oat milk that complements the natural umami flavor of our matcha perfectly.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>What are the health benefits of matcha?</AccordionTrigger>
            <AccordionContent>
              Matcha is rich in antioxidants, particularly EGCG, which supports immune health. It provides clean, sustained energy without the jitters from coffee, promotes calm focus thanks to L-theanine, and supports metabolism and overall wellness.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>How do I place an order?</AccordionTrigger>
            <AccordionContent>
              Simply browse our menu, customize your drink preferences (ice level, sweetness, add-ons), and add items to your cart. We require a minimum of 2 items per order. Once you're ready, click "Proceed" to checkout.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>What's your delivery area?</AccordionTrigger>
            <AccordionContent>
              We're home-based in Bukit Indah, Ampang, and deliver throughout KL. Free delivery is available for orders over RM60. Delivery times and areas may vary, so check during checkout for availability in your area.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger>Can I customize my drink?</AccordionTrigger>
            <AccordionContent>
              Absolutely! You can customize ice level (0%, 50%, 100%), sweetness level (0-100%), and add premium toppings like pearls, grass jelly, or pudding. Some drinks also offer size options.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger>What if I'm not satisfied with my order?</AccordionTrigger>
            <AccordionContent>
              Your satisfaction is our priority. If there's any issue with your order, please contact us immediately and we'll make it right. We stand behind the quality of every drink we serve.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger>Do you have any promotions?</AccordionTrigger>
            <AccordionContent>
              Yes! We regularly offer promotions like our Mix & Match packs and special deals. Check the menu for current offers, and follow us on social media to stay updated on new promotions and seasonal specials.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>
    </div>
  );
};

export default FAQ;
