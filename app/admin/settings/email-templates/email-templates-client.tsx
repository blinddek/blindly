"use client";

import { useState, useTransition } from "react";
import {
  updateEmailTemplate,
  sendTestEmail,
} from "@/lib/admin/email-template-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/admin/email/rich-text-editor";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Send, Eye, Loader2, Check } from "lucide-react";

interface EmailTemplate {
  id: string;
  key: string;
  subject: string;
  body_html: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

interface Props {
  readonly templates: EmailTemplate[];
}

const KEY_LABELS: Record<string, string> = {
  contact_confirmation: "Contact Confirmation",
  booking_confirmation: "Booking Confirmation",
  booking_cancellation: "Booking Cancellation",
  booking_reminder: "Booking Reminder",
  booking_reschedule: "Booking Reschedule",
  order_confirmation: "Order Confirmation",
  welcome: "Welcome Email",
  password_reset: "Password Reset",
};

export function EmailTemplatesClient({ templates }: Props) {
  const [editingTemplate, setEditingTemplate] =
    useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<EmailTemplate | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [isSaving, startSaveTransition] = useTransition();
  const [isSending, startSendTransition] = useTransition();

  function openEdit(template: EmailTemplate) {
    setEditingTemplate(template);
    setSubject(template.subject);
    setBodyHtml(template.body_html);
  }

  function handleSave() {
    if (!editingTemplate) return;
    startSaveTransition(async () => {
      const result = await updateEmailTemplate(
        editingTemplate.id,
        subject,
        bodyHtml
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Template saved");
        setEditingTemplate(null);
      }
    });
  }

  function handleSendTest(template: EmailTemplate) {
    if (!testEmailAddress) {
      toast.error("Enter an email address first");
      return;
    }
    startSendTransition(async () => {
      const result = await sendTestEmail(template.id, testEmailAddress);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Test email sent to ${testEmailAddress}`);
      }
    });
  }

  function getPreviewHtml(template: EmailTemplate) {
    let html = template.body_html;
    for (const v of template.variables) {
      html = html.replace(
        new RegExp(`\\{\\{${v}\\}\\}`, "g"),
        `<span style="background:#fef3c7;padding:1px 4px;border-radius:2px;font-family:monospace;font-size:12px">${v}</span>`
      );
    }
    html = html.replace(
      /\{\{#\w+\}\}([\s\S]*?)\{\{\/\w+\}\}/g,
      '$1'
    );
    return html;
  }

  return (
    <>
      {/* Test email input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Label htmlFor="testEmail" className="shrink-0 text-sm">
              Test recipient
            </Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="you@example.com"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground hidden sm:block">
              Used for sending test emails from any template below.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Template list */}
      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">
                    {KEY_LABELS[template.key] || template.key}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {template.subject}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {template.key}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {template.variables.map((v) => (
                  <Badge key={v} variant="outline" className="text-xs">
                    {`{{${v}}}`}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(template)}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendTest(template)}
                  disabled={isSending || !testEmailAddress}
                >
                  {isSending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Test
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit:{" "}
              {editingTemplate &&
                (KEY_LABELS[editingTemplate.key] || editingTemplate.key)}
            </DialogTitle>
            <DialogDescription>
              Modify the subject and body HTML. Use{" "}
              {"{{variable}}"} placeholders for dynamic content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editSubject">Subject</Label>
              <Input
                id="editSubject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Body HTML</Label>
              {editingTemplate && (
                <RichTextEditor
                  value={bodyHtml}
                  onChange={setBodyHtml}
                  variables={editingTemplate.variables.map((v) => ({
                    key: v,
                    label: v,
                  }))}
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingTemplate(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Preview:{" "}
              {previewTemplate &&
                (KEY_LABELS[previewTemplate.key] || previewTemplate.key)}
            </DialogTitle>
            <DialogDescription>
              {previewTemplate?.subject}
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div
              className="rounded-md border p-4 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: getPreviewHtml(previewTemplate),
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
