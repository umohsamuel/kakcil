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
  Eye,
  EyeOff,
} from "lucide-react";

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
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>("openai");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editKeyValue, setEditKeyValue] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // Providers that already have an active key
  const activeProviders = new Set(
    apiKeys.filter((k: UserApiKey) => k.is_active).map((k: UserApiKey) => k.provider),
  );

  const availableProviders = AI_PROVIDERS.filter(
    (p) => !activeProviders.has(p),
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
      },
    );
  };

  const handleUpdate = (id: string) => {
    if (!editKeyValue.trim()) return;
    updateKey(
      { id, apiKey: editKeyValue.trim() },
      {
        onSuccess: () => {
          setEditingKeyId(null);
          setEditKeyValue("");
        },
      },
    );
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
        {/* Existing Keys */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </div>
        ) : apiKeys.length > 0 ? (
          <div className="space-y-3">
            {apiKeys.map((key: UserApiKey) => (
              <div
                key={key.id}
                className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {PROVIDER_LABELS[key.provider]}
                    </span>
                    {key.is_active && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                        Active
                      </span>
                    )}
                  </div>

                  {editingKeyId === key.id ? (
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        type="text"
                        value={editKeyValue}
                        onChange={(e) => setEditKeyValue(e.target.value)}
                        placeholder="Enter new API key..."
                        className="h-8 text-sm"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleUpdate(key.id)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={() => {
                          setEditingKeyId(null);
                          setEditKeyValue("");
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
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
                  )}
                </div>

                {editingKeyId !== key.id && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingKeyId(key.id);
                        setEditKeyValue("");
                      }}
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
                {availableProviders.length > 0 ? (
                  availableProviders.map((p) => (
                    <option key={p} value={p}>
                      {PROVIDER_LABELS[p]}
                    </option>
                  ))
                ) : (
                  AI_PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {PROVIDER_LABELS[p]}
                    </option>
                  ))
                )}
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
