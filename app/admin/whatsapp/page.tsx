"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

// ---------- Types ----------

interface WhatsAppTemplate {
  id: string;
  name: string;
  body: string;
  variables: string[] | null;
  created_at: string;
}

interface WhatsAppLog {
  id: string;
  recipient: string;
  template_name: string;
  body: string;
  status: string;
  message_id: string | null;
  error: string | null;
  created_at: string;
}

const logStatusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  failed: "destructive",
  delivered: "secondary",
  read: "secondary",
};

export default function AdminWhatsAppPage() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [templatesRes, logsRes] = await Promise.all([
        supabase
          .from("whatsapp_templates")
          .select("*")
          .order("name"),
        supabase
          .from("whatsapp_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (templatesRes.error) toast.error(templatesRes.error.message);
      else setTemplates((templatesRes.data as WhatsAppTemplate[]) ?? []);

      if (logsRes.error) toast.error(logsRes.error.message);
      else setLogs((logsRes.data as WhatsAppLog[]) ?? []);

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Manage message templates and view recent WhatsApp logs.
        </p>
      </div>

      {/* ---- Templates ---- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Templates</h2>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="font-medium text-foreground">No templates yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  WhatsApp message templates will appear here once created.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {templates.map((tpl) => (
              <Card key={tpl.id}>
                <CardContent className="space-y-2 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tpl.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tpl.body}
                  </p>
                  {tpl.variables && tpl.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tpl.variables.map((v) => (
                        <Badge key={v} variant="outline" className="text-xs">
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ---- Recent Logs ---- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Logs</h2>

        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages sent yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-2 font-medium text-muted-foreground">
                    Recipient
                  </th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">
                    Template
                  </th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2 font-medium text-muted-foreground">
                    Sent At
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">
                      {log.recipient}
                    </td>
                    <td className="px-4 py-2">{log.template_name}</td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={logStatusVariant[log.status] ?? "outline"}
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("en-ZA", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
