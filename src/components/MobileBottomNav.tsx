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
        "flex flex-col items-center justify-center gap-1 py-2 px-4 transition-colors",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/50 md:hidden">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        <NavItem
          to="/dashboard"
          icon={<Home className="w-5 h-5" />}
          label="Home"
          isActive={activeState === "home"}
        />
        <NavItem
          to="/library"
          icon={<BookOpen className="w-5 h-5" />}
          label="Library"
          isActive={activeState === "library"}
        />
        <NavItem
          to="/profile"
          icon={<User className="w-5 h-5" />}
          label="Account"
          isActive={activeState === "account"}
        />
      </div>
    </nav>
  );
}
