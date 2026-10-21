import { PropsWithChildren } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/protected-route";
import { Logo } from "@/components/brand/logo";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="h-dvh min-w-0 overflow-hidden">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 md:hidden">
            <SidebarTrigger />
            <Logo href="/chat" size={20} className="[&>span]:text-lg" />
          </header>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
