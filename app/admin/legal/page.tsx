import Link from "next/link";
import { getLegalDocuments } from "@/lib/admin/legal-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Plus, ArrowRight, FileText } from "lucide-react";

export default async function AdminLegalPage() {
  const documents = await getLegalDocuments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Legal Documents
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage terms, policies, and other legal documents.
          </p>
        </div>
        <Link href="/admin/legal/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </Button>
        </Link>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Scale className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium text-foreground">
                No legal documents yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first legal document to get started.
              </p>
            </div>
            <Link href="/admin/legal/new">
              <Button variant="outline" size="sm">
                Create Document
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const dateDisplay = new Date(doc.created_at).toLocaleDateString(
              "en-ZA",
              {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              }
            );

            return (
              <Link key={doc.id} href={`/admin/legal/${doc.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{doc.title}</span>
                        <Badge variant="outline">v{doc.version}</Badge>
                        {doc.required && (
                          <Badge variant="default">Required</Badge>
                        )}
                        {!doc.active && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        /{doc.slug} &middot; {dateDisplay}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
