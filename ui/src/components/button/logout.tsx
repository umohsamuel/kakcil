"use client";

import { LogOut, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/use-auth";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";

export default function LogoutButton() {
  const { logout } = useAuth();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => logout()}
      className="bg-foreground/10 hover:text-background rounded-sm p-1 text-red-500 hover:bg-red-500"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
}

export function LogoutButtonMobileTopbar() {
  const { user } = useAuthStore();
  const { logout } = useAuth();

  return (
    <div className="">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-8 w-8 rounded-full">
            <AvatarImage src={undefined} alt={user?.name?.[0] || "U"} />
            <AvatarFallback className="bg-foreground/10 rounded-full">
              {user?.name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="bg-foreground text-background w-(--radix-dropdown-menu-trigger-width) min-w-32 rounded-lg"
          side={"bottom"}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuItem
            className={`hover:bg-background/90 hover:text-foreground cursor-pointer`}
          >
            <Link href={`/settings`}>
              <Settings />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={`cursor-pointer bg-red-500 hover:bg-red-500/50`}
            onClick={() => logout()}
          >
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
