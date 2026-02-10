"use client";

import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/use-auth";
import { useChats } from "@/hooks/use-chats";
import { useSubscription } from "@/hooks/use-subscription";
import { useDeleteChat } from "@/hooks/use-delete-chat";
import { usePathname, useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  LogOut,
  Settings,
  Loader2,
  Plus,
  X,
  BadgeCheck,
  ChevronsUpDown,
  Crown,
  Trash2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { SubscriptionBadge } from "@/components/subscription-badge";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppSidebar() {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const currentChatId = params.id ?? ("" as string);
  const { chats, isLoading, error } = useChats();
  const { isMobile, setOpenMobile } = useSidebar();
  const { tier } = useSubscription();
  const { deleteChat, isDeleting } = useDeleteChat();
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

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

  const handleDeleteChat = (
    e: React.MouseEvent,
    chatId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingChatId(chatId);
    deleteChat(chatId, {
      onSettled: () => {
        setDeletingChatId(null);
        // If we deleted the current chat, navigate away
        if (currentChatId === chatId) {
          router.push("/chat");
        }
      },
    });
  };

  return (
    <Sidebar className={`bg-foreground lg:w-[16rem]`}>
      <SidebarHeader className="bg-foreground text-background group-data-[collapsible=icon]:hidden">
        <div className="flex items-center justify-between p-2">
          <Link href={`/`} className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Kakcil Logo"
              width={24}
              height={24}
              className="shrink-0 invert-0 dark:invert-100"
            />

            <span
              className={
                "text-background/70 font-bitcount-grid-double pt-1 text-xl font-light tracking-wide"
              }
            >
              KAKCIL
            </span>
          </Link>

          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenMobile(false)}
              className="h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={`bg-foreground text-background`}>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleNewChat}
                isActive={pathname === "/chat" && !currentChatId}
                tooltip="New Chat"
                className={`cursor-pointer`}
              >
                <Plus className="h-4 w-4" />
                <span>New Chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/subscription"}
                tooltip="Subscription"
                onClick={handleNavigation}
              >
                <Link href="/subscription">
                  <Crown className="h-4 w-4" />
                  <span>Subscription</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className={`text-background/50`}>
            Recent Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                </div>
              )}
              {error && (
                <p className="text-muted-foreground px-2 text-xs">
                  Failed to load chats
                </p>
              )}
              {!isLoading && !error && chats.length === 0 && (
                <p className="text-muted-foreground px-2 text-xs">
                  No chats yet
                </p>
              )}
              {!isLoading &&
                !error &&
                chats.map((chat) => (
                  <SidebarMenuItem key={chat.id} className="group/chat">
                    <SidebarMenuButton
                      asChild
                      isActive={currentChatId === chat.id}
                      tooltip={chat.title || "Untitled Chat"}
                      onClick={handleNavigation}
                      className="hover:bg-background/60 pr-8"
                    >
                      <Link
                        href={`/chat/${encodeURIComponent(chat.id)}`}
                        className={`max-w-[14rem] group-data-[collapsible=icon]:max-w-[3rem]`}
                      >
                        <span className="line-clamp-1 truncate font-medium capitalize group-data-[collapsible=icon]:truncate">
                          {chat.title || "Untitled Chat"}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                    {/* Delete button on hover */}
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      disabled={isDeleting && deletingChatId === chat.id}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 opacity-0 transition-opacity hover:bg-red-500/20 group-hover/chat:opacity-100 group-data-[collapsible=icon]:hidden"
                      title="Delete chat"
                    >
                      {isDeleting && deletingChatId === chat.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </button>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-foreground text-background">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/settings"}
              tooltip="Settings"
              onClick={handleNavigation}
            >
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={undefined} alt={user?.name?.[0] || "U"} />
                    <AvatarFallback className="rounded-lg">
                      {user?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs">{user?.email}</span>
                      <SubscriptionBadge tier={tier} size="sm" />
                    </div>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-foreground text-background w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={undefined}
                        alt={user?.name?.[0] || "U"}
                      />
                      <AvatarFallback className="rounded-lg">
                        {user?.name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user?.name}</span>
                      <span className="truncate text-xs">{user?.email}</span>
                    </div>
                    <SubscriptionBadge tier={tier} size="sm" />
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className={`hover:bg-background hover:text-foreground cursor-pointer`}
                  >
                    <BadgeCheck />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={`hover:bg-background hover:text-foreground cursor-pointer`}
                    asChild
                  >
                    <Link href="/subscription">
                      <Crown />
                      Subscription
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
