"use client";

import { useState, type FormEvent } from "react";
import { ExternalLink, Loader2, Pause, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageLoader } from "@/components/page-loader";
import {
  useAddApiKey,
  useApiKeys,
  useDeleteApiKey,
  useUpdateApiKey,
} from "@/hooks/use-api-keys";
import {
  AI_PROVIDERS,
  PROVIDER_KEY_PLACEHOLDERS,
  PROVIDER_KEY_URLS,
  PROVIDER_LABELS,
  type AIProvider,
  type UserApiKey,
} from "@/types/api-key";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./settings-section";

function KeyForm({
  provider,
  submitLabel,
  isPending,
  onSubmit,
  onCancel,
}: {
  provider: AIProvider;
  submitLabel: string;
  isPending: boolean;
  onSubmit: (apiKey: string) => void;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        type="password"
        autoComplete="off"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={PROVIDER_KEY_PLACEHOLDERS[provider]}
        aria-label={`${PROVIDER_LABELS[provider]} API key`}
        className="bg-background font-mono"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={!value.trim() || isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function ProviderRow({
  provider,
  keys,
  onRemove,
}: {
  provider: AIProvider;
  keys: UserApiKey[];
  onRemove: (key: UserApiKey) => void;
}) {
  const addKey = useAddApiKey();
  const updateKey = useUpdateApiKey();
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const hasActive = keys.some((key) => key.is_active);

  return (
    <div className="space-y-3 py-5 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              hasActive ? "bg-foreground" : "bg-border-strong"
            )}
          />
          <span className="font-medium">{PROVIDER_LABELS[provider]}</span>
          <span className="text-muted-foreground text-xs">
            {hasActive ? "Connected" : "Not connected"}
          </span>
        </div>
        <a
          href={PROVIDER_KEY_URLS[provider]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
        >
          Get a key
          <ExternalLink className="size-3" />
        </a>
      </div>

      {keys.map((key) => (
        <div
          key={key.id}
          className="bg-surface-muted space-y-3 rounded-xl border px-3.5 py-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <code className="font-mono text-sm">••••••••{key.key_hint}</code>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase",
                key.is_active
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "text-muted-foreground"
              )}
            >
              {key.is_active ? "Active" : "Paused"}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={updateKey.isPending || (!key.is_active && hasActive)}
                title={
                  !key.is_active && hasActive
                    ? "Another key for this provider is already active"
                    : undefined
                }
                onClick={() =>
                  updateKey.mutate({ id: key.id, is_active: !key.is_active })
                }
              >
                {key.is_active ? <Pause /> : <Play />}
                {key.is_active ? "Pause" : "Activate"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setReplacingId(replacingId === key.id ? null : key.id)
                }
              >
                Replace
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-8"
                aria-label="Remove key"
                onClick={() => onRemove(key)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          {replacingId === key.id && (
            <KeyForm
              provider={provider}
              submitLabel="Save"
              isPending={updateKey.isPending}
              onCancel={() => setReplacingId(null)}
              onSubmit={(apiKey) =>
                updateKey.mutate(
                  { id: key.id, apiKey },
                  { onSuccess: () => setReplacingId(null) }
                )
              }
            />
          )}
        </div>
      ))}

      {!hasActive && (
        <KeyForm
          provider={provider}
          submitLabel="Add key"
          isPending={addKey.isPending}
          onSubmit={(apiKey) => addKey.mutate({ provider, apiKey })}
        />
      )}
    </div>
  );
}

export function ApiKeySettings() {
  const { apiKeys, isLoading } = useApiKeys();
  const deleteKey = useDeleteApiKey();
  const [keyToRemove, setKeyToRemove] = useState<UserApiKey | null>(null);

  return (
    <SettingsSection
      id="api-keys"
      title="API keys"
      description="Kakcil runs on your own provider keys. Keys are encrypted at rest and only used for your requests. Each provider can have one active key."
    >
      {isLoading ? (
        <PageLoader className="h-fit min-h-0 bg-transparent py-4" />
      ) : (
        <div className="divide-y">
          {AI_PROVIDERS.map((provider) => (
            <ProviderRow
              key={provider}
              provider={provider}
              keys={apiKeys.filter((key) => key.provider === provider)}
              onRemove={setKeyToRemove}
            />
          ))}
        </div>
      )}

      <Dialog
        open={!!keyToRemove}
        onOpenChange={(open) => !open && setKeyToRemove(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this key?</DialogTitle>
            <DialogDescription>
              Council members that use{" "}
              {keyToRemove ? PROVIDER_LABELS[keyToRemove.provider] : "it"} will
              be paused until you add another key.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKeyToRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteKey.isPending}
              onClick={() =>
                keyToRemove &&
                deleteKey.mutate(keyToRemove.id, {
                  onSuccess: () => setKeyToRemove(null),
                })
              }
            >
              {deleteKey.isPending && <Loader2 className="animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}
