"use client";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth.store";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { CouncilMembersSettings } from "@/components/council-members-settings";
export default function SettingsPage() {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  return (
    <ProtectedRoute>
      <main className="bg-background text-foreground relative flex h-full flex-1 flex-col overflow-hidden overflow-y-auto rounded-tl-4xl">
        {/* Mobile Header */}
        <header className="border-border flex h-16 shrink-0 items-center justify-between border-b px-4 md:hidden">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Kakcil Logo"
              width={24}
              height={24}
              className="invert dark:invert-0"
            />
            <span className="font-bold">KAKCIL</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => logout()}>
            <LogOut className="h-5 w-5" />
          </Button>
        </header>
        <div className="mx-auto w-full max-w-4xl space-y-8 p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account and preferences
            </p>
          </div>
          <div className="grid gap-6">
            <Card className="border-border border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" /> Appearance
                </CardTitle>
                <CardDescription>Customize how Kakcil looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className={cn(
                      "hover:bg-accent hover:text-accent-foreground flex h-24 flex-col gap-2 border-2",
                      theme === "light"
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border"
                    )}
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="h-6 w-6" />
                    <span>Light</span>
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "hover:bg-accent hover:text-accent-foreground flex h-24 flex-col gap-2 border-2",
                      theme === "dark"
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border"
                    )}
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="h-6 w-6" />
                    <span>Dark</span>
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "hover:bg-accent hover:text-accent-foreground flex h-24 flex-col gap-2 border-2",
                      theme === "system"
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border"
                    )}
                    onClick={() => setTheme("system")}
                  >
                    <Monitor className="h-6 w-6" />
                    <span>System</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Council Members Section */}
            <CouncilMembersSettings />
            <Card className="border-border border-2">
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input
                    value={user?.name || ""}
                    readOnly
                    className="border-input bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    value={user?.email || ""}
                    readOnly
                    className="border-input bg-muted"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
