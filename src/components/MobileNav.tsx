import { Menu, Wallet } from "lucide-react";
import { useAuth } from "../App";

interface MobileNavProps {
  onMenuToggle: () => void;
}

export default function MobileNav({ onMenuToggle }: MobileNavProps) {
  const { user } = useAuth();

  return (
    <div className="flex h-14 items-center justify-between border-b bg-card px-4 lg:hidden">
      <div className="flex items-center gap-2">
        <button onClick={onMenuToggle} className="rounded-md p-2 hover:bg-muted">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wallet className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold">FinTrack</span>
        </div>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
        {user?.name?.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}
