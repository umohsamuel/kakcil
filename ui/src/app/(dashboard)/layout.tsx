import { PropsWithChildren } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger />
          <span className="text-sm font-bold">KAKCIL</span>
        </header>
        <main className="bg-foreground flex-1 overflow-hidden group-data-[collapsible=icon]:ml-[3rem] lg:ml-[15rem] lg:pt-6 lg:pl-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
