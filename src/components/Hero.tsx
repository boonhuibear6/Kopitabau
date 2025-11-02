import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import heroImage from '@/assets/hero-matcha-drink.png';

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-900 mb-4">
              Ceremonial‑grade matcha, freshly whisked
            </h1>
            <p className="mt-2 max-w-xl text-lg text-brand-700">
              Stone‑milled in Japan, rich umami flavour and calm energy. Delivered to your door in 45–75 mins within KL and the Klang Valley.
            </p>
            <div className="mt-8 flex gap-4">
              <Button 
                asChild 
                size="lg" 
                className="bg-brand-500 hover:bg-brand-600 text-white"
              >
                <a 
                  href="#menu"
                  onClick={(e) => {
                    e.preventDefault();
                    const menuSection = document.getElementById('menu');
                    if (menuSection) {
                      menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  Order now
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-brand-500 text-brand-600 hover:bg-brand-50"
              >
                <a 
                  href="#menu"
                  onClick={(e) => {
                    e.preventDefault();
                    const menuSection = document.getElementById('menu');
                    if (menuSection) {
                      menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  See menu
                </a>
              </Button>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <img
              src={heroImage}
              alt="Freshly whisked matcha with ice"
              className="w-full max-w-lg rounded-2xl shadow-card"
              loading="eager"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

