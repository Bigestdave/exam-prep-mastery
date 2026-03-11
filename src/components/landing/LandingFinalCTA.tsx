import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function LandingFinalCTA() {
  return (
    <section className="py-16 md:py-24 border-t border-border">
      <div className="container px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-5">
            Stop hoping you'll remember.<br/>
            <span className="font-serif italic text-accent">Know</span> you will.
          </h2>
          <p className="text-muted-foreground mb-4">
            2,400+ students already preparing with certainty.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Used by students across 30+ departments in Lead City University.
          </p>
          <Link to="/signup">
            <Button size="xl" variant="hero" className="group">
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
