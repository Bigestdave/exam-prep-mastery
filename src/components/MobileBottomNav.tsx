import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, User, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ to, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center w-14 h-full transition-all duration-300 relative group",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className={cn("transition-transform duration-300", isActive && "-translate-y-1")}>
        {icon}
      </div>
      
      <span className={cn(
        "text-[9px] font-bold absolute bottom-1.5 transition-opacity duration-300", 
        isActive ? "opacity-100" : "opacity-0"
      )}>
        {label}
      </span>

      {isActive && (
        <span className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full" />
      )}
    </Link>
  );
}

export function MobileBottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAmbassador, isLoading: isRoleLoading } = useRole();

  // Cache ambassador status to prevent flicker
  const [cachedIsAmbassador, setCachedIsAmbassador] = useState(() => {
    try {
      return localStorage.getItem('is_ambassador') === 'true';
    } catch { return false; }
  });

  useEffect(() => {
    if (!isRoleLoading) {
      setCachedIsAmbassador(isAmbassador);
      try {
        localStorage.setItem('is_ambassador', String(isAmbassador));
      } catch {}
    }
  }, [isAmbassador, isRoleLoading]);

  // Hide on public/auth pages and quiz
  const hiddenPaths = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/admin", "/become-ambassador"];
  const isQuizRoute = currentPath.includes("/quiz");
  const isVipRoute = currentPath.startsWith("/vip/");
  const isCourseDetail = currentPath.startsWith("/course/");
  if (hiddenPaths.includes(currentPath) || isQuizRoute || isVipRoute || isCourseDetail) return null;

  const getActiveState = () => {
    if (currentPath === "/profile") return "account";
    if (currentPath === "/library") return "library";
    if (currentPath === "/ambassador") return "ambassador";
    if (currentPath === "/dashboard" || currentPath.startsWith("/course/")) return "home";
    return "home";
  };

  const activeState = getActiveState();
  const showAmbassador = isRoleLoading ? cachedIsAmbassador : isAmbassador;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-auto md:hidden pointer-events-auto">
      <nav className="glass-pill rounded-full px-8 h-14 flex items-center gap-3 shadow-elevated">
        
        <NavItem
          to="/dashboard"
          icon={<Home className={cn("w-6 h-6", activeState === "home" && "fill-current")} />}
          label="Home"
          isActive={activeState === "home"}
        />
        
        <div className="w-px h-6 bg-foreground/10 mx-2"></div>

        {showAmbassador && (
          <>
            <NavItem
              to="/ambassador"
              icon={<Megaphone className={cn("w-6 h-6", activeState === "ambassador" && "fill-current")} />}
              label="Upload"
              isActive={activeState === "ambassador"}
            />
            <div className="w-px h-6 bg-foreground/10 mx-2"></div>
          </>
        )}
        
        <NavItem
          to="/library"
          icon={<BookOpen className={cn("w-6 h-6", activeState === "library" && "fill-current")} />}
          label="Library"
          isActive={activeState === "library"}
        />
        
        <div className="w-px h-6 bg-foreground/10 mx-2"></div>
        
        <NavItem
          to="/profile"
          icon={<User className={cn("w-6 h-6", activeState === "account" && "fill-current")} />}
          label="Account"
          isActive={activeState === "account"}
        />

      </nav>
    </div>
  );
}
