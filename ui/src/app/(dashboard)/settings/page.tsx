"use client";

import { ProtectedRoute } from "@/components/protected-route";
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
import { Monitor, Moon, Sun } from "lucide-react";
import { CouncilMembersSettings } from "@/components/council-members-settings";

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <ProtectedRoute>
      <main className="bg-background text-foreground relative flex h-full flex-1 flex-col overflow-hidden overflow-y-auto lg:rounded-tl-4xl">
        <div className="mx-auto w-full max-w-4xl space-y-8 p-4 lg:p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account and preferences
            </p>
          </div>
          <div className="flex flex-col items-center gap-6">
            {/* <Card className="border-border border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" /> Appearance
                </CardTitle>
                <CardDescription>Customize how Kakcil looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {themes.map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      variant="outline"
                      className={cn(
                        "hover:bg-accent hover:text-accent-foreground flex h-24 flex-col gap-2 border-2",
                        theme === key
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border"
                      )}
                      onClick={() => setTheme(key)}
                    >
                      <Icon className="h-6 w-6" />
                      <span>{label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card> */}

            {/* Council Members Section */}
            <CouncilMembersSettings />

            <Card className="lg:border-border w-full border-2 border-none shadow-none lg:shadow">
              <CardHeader className="px-0 lg:px-6">
                <CardTitle>Account</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 px-0 lg:px-6">
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

const _themes = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
] as const;
