import { PropsWithChildren } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import LogoutButton from "@/components/button/logout";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background sticky top-0 left-0 z-10 flex h-12 shrink-0 items-center justify-between border-b px-4 lg:hidden">
          <div className="bg-foreground/10 flex items-center gap-2 rounded-sm p-1">
            <SidebarTrigger className="cursor-pointer" />
          </div>

          <LogoutButton />
        </header>
        <main className="bg-foreground flex-1 overflow-hidden group-data-[collapsible=icon]:ml-[3rem] md:ml-[15rem] lg:pt-6 lg:pl-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
