import { Link } from "react-router-dom";
import sovereignKey from "@/assets/sovereign-key.png";
import lcuLogo from "@/assets/lcu-logo.png";

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="container px-4">
        <div className="flex flex-col items-center gap-6">
          {/* Partnership badge */}
          <div className="flex items-center gap-3">
            <img src={lcuLogo} alt="Lead City University" className="w-8 h-8 object-contain" />
            <span className="text-muted-foreground/40 font-light text-xl select-none">×</span>
            <div className="flex items-center gap-1.5">
              <img src={sovereignKey} alt="LCU Prep" className="w-5 h-5 object-contain" style={{ filter: 'brightness(0)' }} />
              <span className="font-display font-semibold text-foreground">LCU Prep</span>
            </div>
          </div>
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
            Built for Lead City University students
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
            <Link to="/become-ambassador" className="hover:text-foreground transition-colors">
              Become an Ambassador
            </Link>
            <span className="hidden sm:inline">·</span>
            <p>© 2026 LCU Prep. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
