import { PropsWithChildren } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import LogoutButton from "@/components/button/logout";
import Image from "next/image";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center justify-between border-b px-4 md:hidden">
          <div className="bg-foreground/20 flex items-center gap-2 rounded-sm p-1">
            <SidebarTrigger className="hover:text-white" />

            <Image
              src="/logo.png"
              alt="Kakcil Logo"
              width={24}
              height={24}
              className="shrink-0 invert-100 dark:invert-0"
            />
          </div>

          <LogoutButton />
        </header>
        <main className="bg-foreground flex-1 overflow-hidden group-data-[collapsible=icon]:ml-[3rem] lg:ml-[15rem] lg:pt-6 lg:pl-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
