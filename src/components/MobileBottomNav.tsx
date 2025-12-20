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
        "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
        isActive 
          ? "bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 scale-110 -translate-y-1" 
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
      )}
    >
      {/* Icon only - cleaner look for capsule */}
      <div className={cn("transition-transform duration-300", isActive && "scale-105")}>
        {icon}
      </div>
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
    // FLOATING CAPSULE CONTAINER
    // z-50 ensures it's on top.
    // bottom-6 lifts it up away from the iPhone home bar.
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-auto md:hidden">
      <nav className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-full px-2 py-2 flex items-center gap-1">
        
        <NavItem
          to="/dashboard"
          icon={<Home className="w-5 h-5" />}
          label="Home"
          isActive={activeState === "home"}
        />
        
        <div className="w-px h-6 bg-slate-200/50 mx-1"></div>
        
        <NavItem
          to="/library"
          icon={<BookOpen className="w-5 h-5" />}
          label="Library"
          isActive={activeState === "library"}
        />
        
        <div className="w-px h-6 bg-slate-200/50 mx-1"></div>
        
        <NavItem
          to="/profile"
          icon={<User className="w-5 h-5" />}
          label="Account"
          isActive={activeState === "account"}
        />

      </nav>
    </div>
  );
}
