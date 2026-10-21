"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiKeySettings } from "@/components/settings/api-key-settings";
import { CouncilSettings } from "@/components/settings/council-settings";
import { SettingsSection } from "@/components/settings/settings-section";
import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const THEMES = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
] as const;

const NAV = [
  { href: "#api-keys", label: "API keys" },
  { href: "#council", label: "Council" },
  { href: "#appearance", label: "Appearance" },
  { href: "#account", label: "Account" },
];

const subscribe = () => () => {};

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  return (
    <SettingsSection
      id="appearance"
      title="Appearance"
      description="Choose a theme, or follow your system setting."
    >
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map(({ key, label, icon: Icon }) => {
          const active = mounted && theme === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm transition-colors",
                active
                  ? "border-foreground bg-surface-muted font-medium"
                  : "text-muted-foreground hover:border-border-strong hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              {label}
            </button>
          );
        })}
      </div>
    </SettingsSection>
  );
}

function AccountSettings() {
  const { user } = useAuthStore();
  const { logout, isLoggingOut } = useAuth();

  return (
    <SettingsSection
      id="account"
      title="Account"
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={() => logout()}
          disabled={isLoggingOut}
        >
          <LogOut />
          Log out
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="account-name">Name</Label>
          <Input id="account-name" value={user?.name ?? ""} readOnly />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="account-email">Email</Label>
          <Input id="account-email" value={user?.email ?? ""} readOnly />
        </div>
      </div>
    </SettingsSection>
  );
}

export default function SettingsPage() {
  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 md:px-8 md:py-12">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <nav className="flex flex-wrap gap-1.5">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full border px-3 py-1 text-xs transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <ApiKeySettings />
        <CouncilSettings />
        <AppearanceSettings />
        <AccountSettings />
      </div>
    </div>
  );
}
