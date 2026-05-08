"use client";

import { useState, useEffect } from "react";
import { Bot, ChevronDown, Cpu, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import type { ModelInfo } from "@/lib/types";

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  className?: string;
  compact?: boolean;
}

const PROVIDER_ICONS: Record<string, typeof Bot> = {
  openai: Zap,
  anthropic: Cpu,
};

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
};

export function ModelSelector({
  value,
  onChange,
  className,
  compact = false,
}: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);

  useEffect(() => {
    api
      .get<{ models: ModelInfo[] }>("/models")
      .then((r) => setModels(r.models))
      .catch(() => {
        // Fallback models if API is unavailable
        setModels([
          { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
          { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
          { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "openai" },
          { id: "gpt-4.1", name: "GPT-4.1", provider: "openai" },
          {
            id: "claude-sonnet-4-6",
            name: "Claude Sonnet 4.6",
            provider: "anthropic",
          },
          {
            id: "claude-haiku-4-5-20251001",
            name: "Claude Haiku 4.5",
            provider: "anthropic",
          },
        ]);
      });
  }, []);

  const selected = models.find((m) => m.id === value);
  const grouped = models.reduce(
    (acc, m) => {
      (acc[m.provider] = acc[m.provider] || []).push(m);
      return acc;
    },
    {} as Record<string, ModelInfo[]>,
  );

  const SelectedIcon = selected
    ? PROVIDER_ICONS[selected.provider] || Bot
    : Bot;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size={compact ? "xs" : "sm"}
            className={cn(
              "gap-1.5 font-normal transition-all duration-200",
              "border-border/60 hover:border-ember/30 hover:bg-ember-muted",
              className,
            )}
          />
        }
      >
        <SelectedIcon className="size-3.5 text-ember" />
        <span className="max-w-[140px] truncate">
          {selected?.name || "Select model"}
        </span>
        <ChevronDown className="size-3 opacity-50" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-56"
      >
        {Object.entries(grouped).map(([provider, providerModels], gi) => {
          const Icon = PROVIDER_ICONS[provider] || Bot;
          return (
            <DropdownMenuGroup key={provider}>
              {gi > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel>
                <span className="flex items-center gap-1.5">
                  <Icon className="size-3 text-ember" />
                  {PROVIDER_LABELS[provider] || provider}
                </span>
              </DropdownMenuLabel>
              {providerModels.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => onChange(m.id)}
                  className={cn(
                    "cursor-pointer gap-2",
                    m.id === value && "bg-ember-muted text-ember",
                  )}
                >
                  <span className="flex-1">{m.name}</span>
                  {m.id === value && (
                    <span className="size-1.5 rounded-full bg-ember" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
