import { Link, useLocation } from "react-router-dom";
import { User, Settings, Megaphone } from "lucide-react";
import { Button } from "./ui/button";
import sovereignKey from "@/assets/sovereign-key.png";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useAdmin } from "@/hooks/useAdmin";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";

interface HeaderProps {
  isLoggedIn?: boolean;
  userName?: string;
}

export function Header({ isLoggedIn = false, userName }: HeaderProps) {
  const { isAdmin } = useAdmin();
  const { isAmbassador } = useRole();
  const location = useLocation();
  
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-40 glass shadow-sm border-b border-border/60">
      <div className="container flex items-center justify-between h-16">
        <Link to={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <img src={lcuLogo} alt="Lead City University" className="w-7 h-7 object-contain" />
            <span className="text-muted-foreground/40 font-light text-lg select-none">×</span>
            <img src={sovereignKey} alt="LCU Prep" className="w-6 h-6 object-contain" style={{ filter: 'brightness(0)' }} />
          </div>
          <span className="font-display font-bold text-lg text-foreground">LCU Prep</span>
        </Link>

        {isLoggedIn ? (
          <div className="flex items-center gap-1">
            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-1 mr-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className={cn(
                  "text-sm",
                  location.pathname === "/dashboard" || location.pathname.startsWith("/course/")
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                )}>
                  Home
                </Button>
              </Link>
              <Link to="/library">
                <Button variant="ghost" size="sm" className={cn(
                  "text-sm",
                  location.pathname === "/library"
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                )}>
                  Library
                </Button>
              </Link>
            </nav>
            
            {isAmbassador && (
              <Link to="/ambassador">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Megaphone className="w-4 h-4" />
                  <span className="hidden sm:inline">Ambassador</span>
                </Button>
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
            )}
            <Link to="/profile">
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-display">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{userName?.split(" ")[0] || "Profile"}</span>
              </Button>
            </Link>
          </div>
        ) : (
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
