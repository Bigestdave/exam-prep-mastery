import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Non-blocking offline indicator. Sits at the top of the screen so users
 * keep seeing whatever is already loaded; only new requests will fail.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] flex justify-center pointer-events-none animate-fade-in">
      <div className="mt-3 flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-xs font-display font-semibold shadow-elevated pointer-events-auto">
        <WifiOff className="w-3.5 h-3.5" />
        You're offline — showing saved content
      </div>
    </div>
  );
}
