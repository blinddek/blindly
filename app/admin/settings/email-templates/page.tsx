import { EmailTemplatesClient } from "./email-templates-client";
import { getEmailTemplates } from "@/lib/admin/email-template-actions";

export default async function EmailTemplatesPage() {
  const templates = await getEmailTemplates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Email Templates</h1>
        <p className="mt-1 text-muted-foreground">
          Customize notification emails. Use {"{{variable}}"} for dynamic
          content.
        </p>
      </div>
      <EmailTemplatesClient templates={templates} />
    </div>
  );
}
