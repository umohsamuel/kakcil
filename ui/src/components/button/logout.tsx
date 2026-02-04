"use client";

import { LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function LogoutButton() {
  const { logout } = useAuth();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => logout()}
      className="bg-foreground/20 hover:text-background rounded-sm p-1 text-red-500 hover:bg-red-500"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
}
