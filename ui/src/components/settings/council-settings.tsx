"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/page-loader";
import {
  useAvailableModels,
  useCouncilMembers,
  useUpdateCouncilMembers,
} from "@/hooks/use-council";
import { useApiKeys } from "@/hooks/use-api-keys";
import { AI_PROVIDERS, PROVIDER_LABELS } from "@/types/api-key";
import type { AvailableModel } from "@/types/council";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./settings-section";

const MAX_MEMBERS = 6;

export function CouncilSettings() {
  const { members, isLoading: membersLoading } = useCouncilMembers();
  const { models, isLoading: modelsLoading } = useAvailableModels();
  const { activeProviders, isLoading: keysLoading } = useApiKeys();
  const updateMembers = useUpdateCouncilMembers();
  const [draft, setDraft] = useState<Set<string> | null>(null);

  const saved = useMemo(
    () =>
      new Set(
        members.filter((member) => member.is_active).map((m) => m.model_name)
      ),
    [members]
  );
  const selected = draft ?? saved;

  const hasChanges =
    selected.size !== saved.size ||
    [...selected].some((model) => !saved.has(model));

  const modelsByProvider = useMemo(() => {
    const groups = new Map<string, AvailableModel[]>();
    for (const model of models) {
      const list = groups.get(model.provider) ?? [];
      list.push(model);
      groups.set(model.provider, list);
    }
    return groups;
  }, [models]);

  const toggle = (modelName: string) => {
    const next = new Set(selected);
    if (next.has(modelName)) next.delete(modelName);
    else if (next.size < MAX_MEMBERS) next.add(modelName);
    setDraft(next);
  };

  const save = () =>
    updateMembers.mutate([...selected], { onSuccess: () => setDraft(null) });

  const isLoading = membersLoading || modelsLoading || keysLoading;

  return (
    <SettingsSection
      id="council"
      title="Council"
      description={`Pick up to ${MAX_MEMBERS} models. Each one answers every question, then they vote on the best response. Only providers with an active key can join.`}
    >
      {isLoading ? (
        <PageLoader className="h-fit min-h-0 bg-transparent py-4" />
      ) : (
        <div className="space-y-6">
          {AI_PROVIDERS.map((provider) => {
            const providerModels = modelsByProvider.get(provider) ?? [];
            if (providerModels.length === 0) return null;
            const enabled = activeProviders.has(provider);

            return (
              <div key={provider} className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">
                    {PROVIDER_LABELS[provider]}
                  </h3>
                  {!enabled && (
                    <Link
                      href="#api-keys"
                      className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                    >
                      Add a key to enable
                    </Link>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {providerModels.map((model) => {
                    const isSelected = selected.has(model.model_name);
                    const disabled =
                      (!enabled && !isSelected) ||
                      (!isSelected && selected.size >= MAX_MEMBERS);

                    return (
                      <button
                        key={model.model_name}
                        type="button"
                        role="checkbox"
                        aria-checked={isSelected}
                        disabled={disabled || updateMembers.isPending}
                        onClick={() => toggle(model.model_name)}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                          isSelected
                            ? "border-foreground bg-surface-muted"
                            : "hover:border-border-strong",
                          (disabled || updateMembers.isPending) &&
                            "cursor-not-allowed opacity-50"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                            isSelected &&
                              "bg-primary text-primary-foreground border-transparent"
                          )}
                        >
                          {isSelected && <Check className="size-3" />}
                        </span>
                        <span className="min-w-0 space-y-0.5">
                          <span className="block truncate font-mono text-xs font-medium">
                            {model.model_name}
                          </span>
                          {model.description && (
                            <span className="text-muted-foreground line-clamp-2 block text-xs">
                              {model.description}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-muted-foreground text-sm">
              {selected.size} of {MAX_MEMBERS} selected
              {hasChanges && " · unsaved changes"}
            </p>
            <div className="flex gap-2">
              {hasChanges && (
                <Button variant="ghost" onClick={() => setDraft(null)}>
                  Reset
                </Button>
              )}
              <Button
                onClick={save}
                disabled={
                  !hasChanges || selected.size === 0 || updateMembers.isPending
                }
              >
                {updateMembers.isPending && (
                  <Loader2 className="animate-spin" />
                )}
                Save council
              </Button>
            </div>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}
