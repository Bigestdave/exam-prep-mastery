import { Home, BookOpen, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
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
        "flex flex-col items-center justify-center gap-1 h-full w-full transition-all duration-200 active:scale-90",
        isActive 
          ? "text-[#2563EB]" // Royal Blue when active
          : "text-slate-400 hover:text-slate-600"
      )}
    >
      {/* Icon size logic */}
      <div className={cn("transition-transform", isActive && "-translate-y-0.5")}>
        {icon}
      </div>
      <span className={cn("text-[10px] leading-none transition-all", isActive ? "font-bold" : "font-medium")}>
        {label}
      </span>
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
    // FIXES APPLIED:
    // 1. z-[9999]: Forces it to top layer
    // 2. transform-gpu: Uses hardware acceleration to stop flickering
    // 3. pb-5: Adds hard padding for iPhone home bar
    // 4. border-t: Adds a clear separation line
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] transform-gpu pb-5 pt-2 md:hidden block">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        <NavItem
          to="/dashboard"
          icon={<Home className={cn("w-6 h-6", activeState === "home" && "fill-current")} />}
          label="Home"
          isActive={activeState === "home"}
        />
        <NavItem
          to="/library"
          icon={<BookOpen className={cn("w-6 h-6", activeState === "library" && "fill-current")} />}
          label="Library"
          isActive={activeState === "library"}
        />
        <NavItem
          to="/profile"
          icon={<User className={cn("w-6 h-6", activeState === "account" && "fill-current")} />}
          label="Account"
          isActive={activeState === "account"}
        />
      </div>
    </nav>
  );
}
