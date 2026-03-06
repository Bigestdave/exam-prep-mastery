import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfflineFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          You're offline
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          It looks like you've lost your internet connection. Check your network and try again.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="h-12 px-8 rounded-2xl gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
