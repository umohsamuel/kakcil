import { PropsWithChildren } from "react";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div className="bg-background flex h-screen overflow-hidden">
      <div className={"max-w-64"}>
        <AppSidebar />
      </div>

      <div className={"h-full w-full"}>{children}</div>
    </div>
  );
}
