"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCouncilMembers, useUpdateCouncilMembers, useAvailableModels, useClearCouncilMembers } from "@/hooks/use-council";
import {
  MODEL_DESCRIPTIONS,
  AIProvider,
} from "@/types/council";
import { Users, Check, Loader2, Bot, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PROVIDER_LABELS: Record<AIProvider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

const PROVIDER_COLORS: Record<AIProvider, { bg: string; border: string; text: string }> = {
  anthropic: {
    bg: "bg-orange-500/10 dark:bg-orange-500/20",
    border: "border-orange-500/30",
    text: "text-orange-600 dark:text-orange-400",
  },
  openai: {
    bg: "bg-green-500/10 dark:bg-green-500/20",
    border: "border-green-500/30",
    text: "text-green-600 dark:text-green-400",
  },
  google: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    border: "border-blue-500/30",
    text: "text-blue-600 dark:text-blue-400",
  },
};

export function CouncilMembersSettings() {
  const { members, isLoading: isMembersLoading } = useCouncilMembers();
  const { models: availableModels, isLoading: isModelsLoading } = useAvailableModels();
  const { updateMembers, isUpdating } = useUpdateCouncilMembers();
  const { clearMembers, isClearing } = useClearCouncilMembers();
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  const isLoading = isMembersLoading || isModelsLoading;

  // Group models by provider
  const modelsByProvider = useMemo(() => {
    return availableModels.reduce(
      (acc, model) => {
        if (!acc[model.provider]) {
          acc[model.provider] = [];
        }
        acc[model.provider].push({
          model_name: model.model_name,
          description: model.description || MODEL_DESCRIPTIONS[model.model_name],
        });
        return acc;
      },
      {} as Record<AIProvider, { model_name: string; description?: string }[]>
    );
  }, [availableModels]);

  // Initialize selected models from current members
  useEffect(() => {
    if (members.length > 0) {
      const activeModels = new Set(
        members.filter((m) => m.is_active).map((m) => m.model_name)
      );
      setSelectedModels(activeModels);
    }
  }, [members]);

  // Check if there are changes
  useEffect(() => {
    const currentModels = new Set(
      members.filter((m) => m.is_active).map((m) => m.model_name)
    );
    const isDifferent =
      selectedModels.size !== currentModels.size ||
      [...selectedModels].some((m) => !currentModels.has(m));
    setHasChanges(isDifferent);
  }, [selectedModels, members]);

  const toggleModel = (modelName: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(modelName)) {
        // Don't allow removing if it would leave no models selected
        if (next.size <= 1) {
          return prev;
        }
        next.delete(modelName);
      } else {
        next.add(modelName);
      }
      return next;
    });
  };

  const handleSave = () => {
    const membersArray = Array.from(selectedModels);
    updateMembers(membersArray);
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Council Members
          </CardTitle>
          <CardDescription>Loading your council configuration...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> Council Members
        </CardTitle>
        <CardDescription>
          Select the AI models that will participate in your council debates.
          Each model will provide a response and vote on the best answer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Members Summary */}
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>
              {selectedModels.size} model{selectedModels.size !== 1 ? "s" : ""}{" "}
              selected
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...selectedModels].map((model) => (
              <span
                key={model}
                className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {model}
              </span>
            ))}
          </div>
        </div>

        {/* Models by Provider */}
        {(Object.entries(modelsByProvider) as [AIProvider, { model_name: string; description?: string }[]][]).map(
          ([provider, models]) => {
            if (models.length === 0) return null;
            const colors = PROVIDER_COLORS[provider];

            return (
              <div key={provider} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className={cn("h-4 w-4", colors.text)} />
                  <h4 className="text-sm font-semibold">
                    {PROVIDER_LABELS[provider]}
                  </h4>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {models.map((model) => {
                    const isSelected = selectedModels.has(model.model_name);

                    return (
                      <button
                        key={model.model_name}
                        onClick={() => toggleModel(model.model_name)}
                        disabled={isUpdating}
                        className={cn(
                          "group relative flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all duration-200",
                          isSelected
                            ? cn(
                                "border-primary bg-primary/5 dark:bg-primary/10",
                                "hover:bg-primary/10 dark:hover:bg-primary/15"
                              )
                            : cn(
                                "border-border bg-card",
                                "hover:border-muted-foreground/50 hover:bg-muted/50"
                              ),
                          isUpdating && "cursor-not-allowed opacity-60"
                        )}
                      >
                        {/* Selection Indicator */}
                        <div
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[3px] transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30 bg-background"
                          )}
                        >
                          {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                        </div>

                        {/* Model Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">
                              {model.model_name}
                            </span>
                          </div>
                          {model.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {model.description}
                            </p>
                          )}
                        </div>

                        {/* Provider Badge */}
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                            colors.bg,
                            colors.border,
                            colors.text
                          )}
                        >
                          {provider}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            {hasChanges
              ? "You have unsaved changes"
              : "Your council is up to date"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                clearMembers();
                setSelectedModels(new Set());
              }}
              disabled={isClearing || isUpdating || selectedModels.size === 0}
            >
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </>
              )}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating || isClearing || !hasChanges}
              className="min-w-[100px]"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
