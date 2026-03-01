import { Link } from "react-router-dom";
import { User, Settings } from "lucide-react";
import { Button } from "./ui/button";
import sovereignKey from "@/assets/sovereign-key.png";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useAdmin } from "@/hooks/useAdmin";

interface HeaderProps {
  isLoggedIn?: boolean;
  userName?: string;
}

export function Header({ isLoggedIn = false, userName }: HeaderProps) {
  const { isAdmin } = useAdmin();
  
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-40 glass shadow-sm">
      <div className="container flex items-center justify-between h-16">
        <Link to={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="w-9 h-9 flex items-center justify-center">
            <img src={sovereignKey} alt="LCU Prep" className="w-7 h-7 object-contain" style={{ filter: 'brightness(0)' }} />
          </div>
          <span className="font-display font-bold text-lg text-foreground">LCU Prep</span>
        </Link>

        {isLoggedIn ? (
          <div className="flex items-center gap-2">
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
