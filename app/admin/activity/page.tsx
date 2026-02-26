import { getActivityLog } from "@/lib/admin/queries";

export default async function AdminActivityPage() {
  const entries = await getActivityLog();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
        <p className="mt-1 text-muted-foreground">
          Recent actions performed in the admin panel.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          No activity recorded yet.
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-4 rounded-lg border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {entry.action}
                  {entry.entity_type && (
                    <span className="ml-1 text-muted-foreground">
                      on {entry.entity_type}
                      {entry.entity_id && (
                        <span className="ml-1 font-mono text-xs">
                          #{entry.entity_id.slice(0, 8)}
                        </span>
                      )}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString()}
                  {entry.actor_id && (
                    <span className="ml-2 font-mono">
                      by {entry.actor_id.slice(0, 8)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
