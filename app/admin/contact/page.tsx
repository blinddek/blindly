import { getContactSubmissions } from "@/lib/admin/queries";
import { ContactTable } from "./contact-table";

export default async function AdminContactPage() {
  const submissions = await getContactSubmissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="mt-1 text-muted-foreground">
          Contact form submissions.{" "}
          {submissions.some((s) => !s.read)
            ? `${submissions.filter((s) => !s.read).length} unread.`
            : "All caught up."}
        </p>
      </div>

      <ContactTable submissions={submissions} />
    </div>
  );
}
