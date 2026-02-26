"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, MailOpen, Archive, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markContactRead, archiveContact } from "@/lib/admin/actions";
import { toast } from "sonner";
import type { ContactSubmission } from "@/types";

interface ContactTableProps {
  submissions: ContactSubmission[];
}

export function ContactTable({ submissions }: ContactTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        No messages yet.
      </div>
    );
  }

  function handleMarkRead(id: string) {
    startTransition(async () => {
      const result = await markContactRead(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Marked as read.");
        router.refresh();
      }
    });
  }

  function handleArchive(id: string) {
    startTransition(async () => {
      const result = await archiveContact(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Archived.");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      {submissions.map((sub) => {
        const isExpanded = expandedId === sub.id;
        return (
          <div
            key={sub.id}
            className="rounded-lg border bg-card transition-colors hover:border-primary/30"
          >
            <button
              type="button"
              className="flex w-full items-center gap-4 p-4 text-left"
              onClick={() => setExpandedId(isExpanded ? null : sub.id)}
            >
              {sub.read ? (
                <MailOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <Mail className="h-4 w-4 shrink-0 text-primary" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${sub.read ? "" : "font-bold"}`}>
                    {sub.name}
                  </span>
                  {!sub.read && <Badge variant="default" className="text-[10px]">New</Badge>}
                </div>
                <p className="truncate text-xs text-muted-foreground">{sub.email}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(sub.created_at).toLocaleDateString()}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t px-4 py-4">
                <div className="mb-3 space-y-1 text-sm">
                  <p><span className="font-medium">Email:</span> {sub.email}</p>
                  {sub.phone && <p><span className="font-medium">Phone:</span> {sub.phone}</p>}
                </div>
                <p className="mb-4 whitespace-pre-wrap text-sm text-foreground">
                  {sub.message}
                </p>
                <div className="flex gap-2">
                  {!sub.read && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleMarkRead(sub.id)}
                    >
                      <MailOpen className="mr-1.5 h-3.5 w-3.5" />
                      Mark Read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleArchive(sub.id)}
                  >
                    <Archive className="mr-1.5 h-3.5 w-3.5" />
                    Archive
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
