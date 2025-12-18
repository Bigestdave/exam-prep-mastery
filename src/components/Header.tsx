import { Link } from "react-router-dom";
import { GraduationCap, User } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  isLoggedIn?: boolean;
  userName?: string;
}

export function Header({ isLoggedIn = false, userName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">LCU Prep</span>
        </Link>

        {isLoggedIn ? (
          <Link to="/profile">
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="w-4 h-4" />
              {userName || 'Profile'}
            </Button>
          </Link>
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
