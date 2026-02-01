"use client";
import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/use-auth";
import { useChats } from "@/hooks/use-chats";
import { usePathname, useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import { LogOut, MessageSquare, Settings, Loader2, Plus, X } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarSeparator, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const currentChatId = params.id ?? ("" as string);
  const { chats, isLoading, error } = useChats();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNewChat = useCallback(() => {
    if (pathname === "/chat" && !currentChatId) {
      window.location.href = "/chat";
    } else {
      router.push("/chat");
    }
    if (isMobile) setOpenMobile(false);
  }, [pathname, currentChatId, router, isMobile, setOpenMobile]);

  const handleNavigation = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar className="w-56">
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Kakcil Logo" width={24} height={24} className="shrink-0" />
            <span className="font-bold">KAKCIL</span>
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setOpenMobile(false)} className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          )}
          {!isMobile && <SidebarTrigger className="h-7 w-7" />}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleNewChat} isActive={pathname === "/chat" && !currentChatId} tooltip="New Chat">
                <Plus className="h-4 w-4" />
                <span>New Chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {error && <p className="px-2 text-xs text-muted-foreground">Failed to load chats</p>}
              {!isLoading && !error && chats.length === 0 && (
                <p className="px-2 text-xs text-muted-foreground">No chats yet</p>
              )}
              {!isLoading && !error && chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton asChild isActive={currentChatId === chat.id} tooltip={chat.title || "Untitled Chat"} onClick={handleNavigation}>
                    <Link href={`/chat/${encodeURIComponent(chat.id)}`}>
                      <MessageSquare className="h-4 w-4" />
                      <span className="truncate">{chat.title || "Untitled Chat"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/settings"} tooltip="Settings" onClick={handleNavigation}>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-2 flex items-center gap-2 rounded-md bg-sidebar-accent/50 p-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {user?.name?.[0] || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{user?.name || "User"}</p>
            <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => logout()} className="mt-2 w-full justify-start gap-2">
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
