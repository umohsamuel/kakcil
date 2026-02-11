"use client";

import { useState } from "react";
import { useApiKeys } from "@/hooks/use-api-keys";
import {
  AI_PROVIDERS,
  PROVIDER_LABELS,
  type AIProvider,
  type UserApiKey,
} from "@/types/api-key";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Key,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";

interface EditState {
  provider: AIProvider;
  apiKey: string;
  is_active: boolean;
}

export function ApiKeySettings() {
  const {
    apiKeys,
    isLoading,
    addKey,
    isAdding,
    updateKey,
    isUpdating,
    deleteKey,
    isDeleting,
  } = useApiKeys();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProvider, setSelectedProvider] =
    useState<AIProvider>("openai");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    provider: "openai",
    apiKey: "",
    is_active: true,
  });
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // Providers that already have an active key
  const activeProviders = new Set(
    apiKeys
      .filter((k: UserApiKey) => k.is_active)
      .map((k: UserApiKey) => k.provider)
  );

  const availableProviders = AI_PROVIDERS.filter(
    (p) => !activeProviders.has(p)
  );

  const handleAdd = () => {
    if (!newKeyValue.trim()) return;
    addKey(
      { provider: selectedProvider, apiKey: newKeyValue.trim() },
      {
        onSuccess: () => {
          setNewKeyValue("");
          setShowAddForm(false);
        },
      }
    );
  };

  const startEditing = (key: UserApiKey) => {
    setEditingKeyId(key.id);
    setEditState({
      provider: key.provider,
      apiKey: "",
      is_active: key.is_active,
    });
  };

  const cancelEditing = () => {
    setEditingKeyId(null);
    setEditState({ provider: "openai", apiKey: "", is_active: true });
  };

  const handleUpdate = (id: string) => {
    const payload: {
      id: string;
      is_active?: boolean;
      apiKey?: string;
      provider?: AIProvider;
    } = { id };

    // Find the original key to compare changes
    const originalKey = apiKeys.find((k: UserApiKey) => k.id === id);
    if (!originalKey) return;

    let hasChanges = false;

    if (editState.is_active !== originalKey.is_active) {
      payload.is_active = editState.is_active;
      hasChanges = true;
    }

    if (editState.provider !== originalKey.provider) {
      payload.provider = editState.provider;
      hasChanges = true;
    }

    if (editState.apiKey.trim()) {
      payload.apiKey = editState.apiKey.trim();
      hasChanges = true;
    }

    if (!hasChanges) {
      cancelEditing();
      return;
    }

    updateKey(payload, {
      onSuccess: () => {
        cancelEditing();
      },
    });
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
  };

  return (
    <Card className="lg:border-border w-full border-2 border-none shadow-none lg:shadow">
      <CardHeader className="px-0 lg:px-6">
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" /> Bring Your Own API Key
        </CardTitle>
        <CardDescription>
          Add your own API keys to use specific providers. You can have one
          active key per provider.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-0 lg:px-6">
        {/* Warning Note */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
            Adding or updating an API key may deactivate council members
            configured for other providers.
          </p>
        </div>
        {/* Existing Keys */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </div>
        ) : apiKeys.length > 0 ? (
          <div className="space-y-3">
            {apiKeys.map((key: UserApiKey) => (
              <div key={key.id} className="bg-muted/50 rounded-lg border p-3">
                {editingKeyId === key.id ? (
                  /* ─── Expanded Edit Form ─── */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                        Editing Key
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={cancelEditing}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Status Toggle */}
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Status</Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEditState((prev) => ({
                              ...prev,
                              is_active: true,
                            }))
                          }
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider uppercase transition-colors ${
                            editState.is_active
                              ? "bg-emerald-500/20 text-emerald-600 ring-1 ring-emerald-500/40"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          Active
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditState((prev) => ({
                              ...prev,
                              is_active: false,
                            }))
                          }
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider uppercase transition-colors ${
                            !editState.is_active
                              ? "bg-red-500/10 text-red-500 ring-1 ring-red-500/30"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          Inactive
                        </button>
                      </div>
                    </div>

                    {/* Provider Select */}
                    <div className="grid gap-1.5">
                      <Label
                        htmlFor={`edit-provider-${key.id}`}
                        className="text-xs"
                      >
                        Provider
                      </Label>
                      <select
                        id={`edit-provider-${key.id}`}
                        value={editState.provider}
                        onChange={(e) =>
                          setEditState((prev) => ({
                            ...prev,
                            provider: e.target.value as AIProvider,
                          }))
                        }
                        className="border-input bg-background flex h-8 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
                      >
                        {AI_PROVIDERS.map((p) => (
                          <option key={p} value={p}>
                            {PROVIDER_LABELS[p]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* API Key Input */}
                    <div className="grid gap-1.5">
                      <Label htmlFor={`edit-key-${key.id}`} className="text-xs">
                        New API Key{" "}
                        <span className="text-muted-foreground font-normal">
                          (leave blank to keep current)
                        </span>
                      </Label>
                      <Input
                        id={`edit-key-${key.id}`}
                        type="password"
                        value={editState.apiKey}
                        onChange={(e) =>
                          setEditState((prev) => ({
                            ...prev,
                            apiKey: e.target.value,
                          }))
                        }
                        placeholder="sk-..."
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(key.id)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Save Changes
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ─── Display Mode ─── */
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold tracking-wider uppercase">
                          {PROVIDER_LABELS[key.provider]}
                        </span>
                        {key.is_active ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-600 uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="border-border bg-muted text-muted-foreground inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-1">
                        <code className="text-muted-foreground text-xs">
                          {visibleKeys.has(key.id)
                            ? key.encrypted_key
                            : maskKey(key.encrypted_key)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleVisibility(key.id)}
                        >
                          {visibleKeys.has(key.id) ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startEditing(key)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => deleteKey(key.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No API keys added yet.
          </p>
        )}

        {/* Add Form */}
        {showAddForm ? (
          <div className="space-y-3 rounded-lg border border-dashed p-4">
            <div className="grid gap-2">
              <Label htmlFor="provider-select">Provider</Label>
              <select
                id="provider-select"
                value={selectedProvider}
                onChange={(e) =>
                  setSelectedProvider(e.target.value as AIProvider)
                }
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
              >
                {availableProviders.length > 0
                  ? availableProviders.map((p) => (
                      <option key={p} value={p}>
                        {PROVIDER_LABELS[p]}
                      </option>
                    ))
                  : AI_PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {PROVIDER_LABELS[p]}
                      </option>
                    ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="api-key-input">API Key</Label>
              <Input
                id="api-key-input"
                type="password"
                value={newKeyValue}
                onChange={(e) => setNewKeyValue(e.target.value)}
                placeholder="sk-..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAdd}
                disabled={isAdding || !newKeyValue.trim()}
                size="sm"
              >
                {isAdding ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : null}
                Add Key
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewKeyValue("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowAddForm(true);
              if (availableProviders.length > 0) {
                setSelectedProvider(availableProviders[0]);
              }
            }}
            className="w-full"
          >
            <Plus className="mr-2 h-3.5 w-3.5" /> Add API Key
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
