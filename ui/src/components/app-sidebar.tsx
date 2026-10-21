"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  ChevronsUpDown,
  Loader2,
  LogOut,
  MoreHorizontal,
  Plus,
  Settings,
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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/use-auth";
import { useChats } from "@/hooks/use-chats";
import { useDeleteChat } from "@/hooks/use-delete-chat";
import { isStreamActive, useCouncilStreamStore } from "@/store/council-stream";
import type { Chat } from "@/types/chat";

const DAY = 24 * 60 * 60 * 1000;

function groupChats(chats: Chat[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = startOfToday.getTime();

  const groups: { label: string; chats: Chat[] }[] = [
    { label: "Today", chats: [] },
    { label: "Yesterday", chats: [] },
    { label: "Previous 7 days", chats: [] },
    { label: "Previous 30 days", chats: [] },
    { label: "Older", chats: [] },
  ];

  for (const chat of chats) {
    const time = new Date(
      chat.last_message_at ?? chat.created_at ?? 0
    ).getTime();
    const index =
      time >= today
        ? 0
        : time >= today - DAY
          ? 1
          : time >= today - 7 * DAY
            ? 2
            : time >= today - 30 * DAY
              ? 3
              : 4;
    groups[index]!.chats.push(chat);
  }

  return groups.filter((group) => group.chats.length > 0);
}

function initials(name?: string) {
  return (
    name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

export function AppSidebar() {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { chats, isLoading, error, hasMore, isFetchingMore, fetchMore } =
    useChats();
  const deleteChat = useDeleteChat();
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const streamingKeys = useCouncilStreamStore((state) =>
    Object.values(state.streams)
      .filter(isStreamActive)
      .map((stream) => stream.key)
      .join("|")
  );
  const streamingChats = useMemo(
    () => new Set(streamingKeys.split("|")),
    [streamingKeys]
  );

  const currentChatId = params.id;
  const groups = useMemo(() => groupChats(chats), [chats]);

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const confirmDelete = () => {
    if (!chatToDelete) return;
    const id = chatToDelete.id;
    deleteChat.mutate(id, {
      onSuccess: () => {
        setChatToDelete(null);
        if (currentChatId === id) router.push("/chat");
      },
    });
  };

  return (
    <Sidebar>
      <SidebarHeader className="gap-3 px-3 pt-4">
        <Logo href="/chat" className="px-1" />
        <Button
          asChild
          variant="outline"
          className="bg-background w-full justify-start gap-2"
        >
          <Link href="/chat" onClick={closeOnMobile}>
            <Plus />
            New chat
          </Link>
        </Button>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {isLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          </div>
        )}
        {error && (
          <p className="text-muted-foreground px-4 py-2 text-xs">
            Could not load your chats.
          </p>
        )}
        {!isLoading && !error && chats.length === 0 && (
          <p className="text-muted-foreground px-4 py-2 text-xs">
            Your conversations will appear here.
          </p>
        )}

        {groups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="text-muted-foreground text-[11px]">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.chats.map((chat) => {
                  const streaming = streamingChats.has(chat.id);
                  return (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={currentChatId === chat.id}
                        tooltip={chat.title || "Untitled chat"}
                      >
                        <Link
                          href={`/chat/${encodeURIComponent(chat.id)}`}
                          onClick={closeOnMobile}
                        >
                          {streaming && (
                            <Loader2 className="text-muted-foreground animate-spin" />
                          )}
                          <span>{chat.title || "Untitled chat"}</span>
                        </Link>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction
                            showOnHover
                            aria-label="Chat options"
                          >
                            <MoreHorizontal />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setChatToDelete(chat)}
                          >
                            <Trash2 />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {hasMore && (
          <div className="px-3 pb-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground w-full"
              disabled={isFetchingMore}
              onClick={() => fetchMore()}
            >
              {isFetchingMore && <Loader2 className="animate-spin" />}
              Load more
            </Button>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t p-3">
        <div className="flex items-center justify-between gap-2">
          <SidebarMenu className="w-auto">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/settings"}
                className="w-auto"
              >
                <Link href="/settings" onClick={closeOnMobile}>
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <ThemeToggle />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="bg-primary text-primary-foreground rounded-lg text-xs font-medium">
                  {initials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <span className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate text-sm font-medium">
                  {user?.name}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {user?.email}
                </span>
              </span>
              <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "top" : "right"}
            align="end"
            className="w-56"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="truncate text-sm font-medium">{user?.name}</div>
              <div className="text-muted-foreground truncate text-xs">
                {user?.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" onClick={closeOnMobile}>
                <Settings />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => logout()}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <Dialog
        open={!!chatToDelete}
        onOpenChange={(open) => !open && setChatToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this chat?</DialogTitle>
            <DialogDescription>
              &ldquo;{chatToDelete?.title || "Untitled chat"}&rdquo; and all of
              its branches will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChatToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteChat.isPending}
            >
              {deleteChat.isPending && <Loader2 className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
