"use client";

import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useChats } from "@/hooks/use-chats";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function AppSidebar() {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const pathname = usePathname();
  const params = useParams();
  const currentChatId = params.id ?? ("" as string);
  const { chats, isLoading, error } = useChats();

  const [isOpenSidebar, setIsOpenSidebar] = useState(true);

  const navItems = [{ name: "New Chat", icon: MessageSquare, href: "/chat" }];

  function handleIsOpenSidebar() {
    setIsOpenSidebar(!isOpenSidebar);
  }

  return (
    <aside
      className={
        "border-border bg-foreground text-background relative z-50 flex h-full w-full min-w-12 flex-col border-r font-mono"
      }
    >
      <button
        onClick={handleIsOpenSidebar}
        className={cn(
          "absolute top-4 z-20 cursor-pointer p-1 transition-all duration-150 ease-in-out",
          isOpenSidebar ? "right-4" : "left-1/2 -translate-x-1/2"
        )}
      >
        {isOpenSidebar ? (
          <PanelLeftClose className={`size-5 h-5 w-5`} />
        ) : (
          <PanelLeftOpen className={`size-5 h-5 w-5`} />
        )}
      </button>

      <div
        className={`hidden h-full w-64 flex-col md:flex ${isOpenSidebar ? "md:flex" : "md:hidden"}`}
      >
        <div className="flex w-full items-center gap-3 p-6">
          <Image
            src="/logo.png"
            alt="Kakcil Logo"
            width={32}
            height={32}
            className="invert-0 dark:invert-100"
          />
          <span className="text-xl font-bold tracking-wide">KAKCIL</span>
        </div>
        <div className="mt-4 flex w-full flex-1 flex-col gap-2 overflow-y-auto px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href && !currentChatId;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "cursor-pointer justify-start gap-3 transition-all duration-150 ease-linear",
                    isActive
                      ? "bg-background text-foreground hover:bg-background/50 hover:text-background w-full shadow-lg hover:shadow-none"
                      : "text-muted-foreground hover:bg-background/50 hover:text-foreground w-full"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            );
          })}

          <div className="border-border my-2 border-t" />

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
          )}

          {error && (
            <p className="text-muted-foreground px-2 text-xs">
              Failed to load chats
            </p>
          )}

          {!isLoading && !error && chats.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground px-2 text-xs font-semibold tracking-wider uppercase">
                Recent Chats
              </p>
              {chats.map((chat) => {
                const isChatActive = currentChatId === chat.id;
                return (
                  <Link
                    key={chat.id}
                    href={`/chat/${encodeURIComponent(chat.id)}`}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "h-auto w-full cursor-pointer justify-start gap-3 py-2 transition-all duration-150 ease-linear",
                        isChatActive
                          ? "bg-background text-foreground hover:bg-background/50 hover:text-background shadow-lg hover:shadow-none"
                          : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                      )}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="truncate text-left text-sm">
                        {chat.title || "Untitled Chat"}
                      </span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-border border-t p-4">
          <Link href={"/settings"}>
            <Button
              variant="ghost"
              className={cn(
                "cursor-pointer justify-start gap-3 transition-all duration-150 ease-linear",
                pathname === "/settings"
                  ? "bg-background text-foreground hover:bg-background/50 hover:text-background w-full shadow-lg hover:shadow-none"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground w-full"
              )}
            >
              <Settings className="h-5 w-5" /> Settings
            </Button>
          </Link>

          <div className="mt-4 mb-4 flex items-center gap-3 px-2">
            <div className="bg-foreground text-background flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold uppercase shadow-lg">
              {user?.name?.[0] || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-foreground truncate text-sm font-medium">
                {user?.name || "User"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="border-border text-foreground hover:border-destructive hover:bg-destructive hover:text-destructive-foreground w-full transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}
