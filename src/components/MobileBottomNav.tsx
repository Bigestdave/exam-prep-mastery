import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

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
        isActive ? "text-[#2563EB]" : "text-slate-400 hover:text-slate-600"
      )}
    >
      {/* Icon floats up slightly when active */}
      <div className={cn("transition-transform duration-300", isActive && "-translate-y-1")}>
        {icon}
      </div>
      
      {/* Label appears/fades in */}
      <span className={cn(
        "text-[9px] font-bold absolute bottom-1.5 transition-opacity duration-300", 
        isActive ? "opacity-100" : "opacity-0"
      )}>
        {label}
      </span>

      {/* Active Dot indicator */}
      {isActive && (
        <span className="absolute -bottom-2 w-1 h-1 bg-[#2563EB] rounded-full" />
      )}
    </Link>
  );
}

export function MobileBottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const getActiveState = () => {
    if (currentPath === "/profile") return "account";
    if (currentPath === "/library") return "library";
    if (currentPath === "/dashboard" || currentPath.startsWith("/course/")) return "home";
    return "home";
  };

  const activeState = getActiveState();

  return (
    // FLOATING CAPSULE DESIGN
    // z-50 ensures it's on top.
    // bottom-8 lifts it up away from the iPhone home bar rubber-band area.
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-auto md:hidden">
      <nav className="bg-white/95 backdrop-blur-2xl border border-white/20 shadow-[0_8px_40px_rgba(0,0,0,0.12)] rounded-full px-6 h-16 flex items-center gap-2">
        
        <NavItem
          to="/dashboard"
          icon={<Home className={cn("w-6 h-6", activeState === "home" && "fill-current")} />}
          label="Home"
          isActive={activeState === "home"}
        />
        
        <div className="w-px h-6 bg-slate-200/50 mx-2"></div>
        
        <NavItem
          to="/library"
          icon={<BookOpen className={cn("w-6 h-6", activeState === "library" && "fill-current")} />}
          label="Library"
          isActive={activeState === "library"}
        />
        
        <div className="w-px h-6 bg-slate-200/50 mx-2"></div>
        
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
