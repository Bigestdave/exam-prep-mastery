import { Link } from "react-router-dom";
import sovereignKey from "@/assets/sovereign-key.png";

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center">
              <img src={sovereignKey} alt="LCU Prep" className="w-5 h-5 object-contain" style={{ filter: 'brightness(0)' }} />
            </div>
            <span className="font-display font-semibold text-foreground">LCU Prep</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/become-ambassador" className="hover:text-foreground transition-colors">
              Become an Ambassador
            </Link>
            <span>·</span>
            <p>© 2026 LCU Prep. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
