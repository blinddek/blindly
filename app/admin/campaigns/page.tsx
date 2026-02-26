"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getCampaigns,
  deleteCampaign,
  getDripEmails,
  toggleDripEmail,
  deleteDripEmail,
} from "@/lib/admin/campaign-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Plus,
  Trash2,
  Megaphone,
  Mail,
  Clock,
  Zap,
  ListOrdered,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// ---------- Types ----------

interface Campaign {
  id: string;
  name: string;
  subject: string | null;
  body_html: string | null;
  status: string;
  is_multi_step: boolean;
  campaign_type: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  start_date: string | null;
  created_at: string;
  campaign_emails: { count: number }[];
}

interface DripEmail {
  id: string;
  phase: string;
  step: number;
  day_offset: number;
  subject: string;
  body_html: string;
  is_active: boolean;
  created_at: string;
}

// ---------- Badge helpers ----------

const STATUS_VARIANT: Record<string, "outline" | "default" | "secondary" | "destructive"> = {
  draft: "outline",
  scheduled: "secondary",
  active: "default",
  sending: "default",
  sent: "secondary",
  completed: "secondary",
  paused: "outline",
  failed: "destructive",
};

const PHASE_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  newsletter: "Newsletter",
};

// ---------- Component ----------

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dripEmails, setDripEmails] = useState<DripEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function loadData() {
    try {
      const [c, d] = await Promise.all([getCampaigns(), getDripEmails()]);
      setCampaigns(c as Campaign[]);
      setDripEmails(d as DripEmail[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleDeleteCampaign(id: string) {
    startTransition(async () => {
      const result = await deleteCampaign(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Campaign deleted");
        await loadData();
      }
    });
  }

  function handleToggleDrip(id: string, active: boolean) {
    startTransition(async () => {
      const result = await toggleDripEmail(id, active);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(active ? "Drip email activated" : "Drip email paused");
        await loadData();
      }
    });
  }

  function handleDeleteDrip(id: string) {
    startTransition(async () => {
      const result = await deleteDripEmail(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Drip email deleted");
        await loadData();
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  // Separate standard and birthday campaigns
  const standardCampaigns = campaigns.filter((c) => c.campaign_type !== "birthday");
  const birthdayCampaigns = campaigns.filter((c) => c.campaign_type === "birthday");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
        <p className="text-sm text-muted-foreground">
          Manage email campaigns and automated drip emails.
        </p>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">
            <Mail className="mr-1.5 h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="drip">
            <Zap className="mr-1.5 h-4 w-4" />
            Drip Emails
          </TabsTrigger>
        </TabsList>

        {/* ---- Campaigns Tab ---- */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-end">
            <Button size="sm" asChild>
              <Link href="/admin/campaigns/new">
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Link>
            </Button>
          </div>

          {/* Standard campaigns */}
          {standardCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <Megaphone className="h-12 w-12 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="font-medium text-foreground">No campaigns yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create your first email campaign to get started.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {standardCampaigns.map((campaign) => {
                const stepCount = campaign.campaign_emails?.[0]?.count ?? 0;
                return (
                  <Card key={campaign.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/campaigns/${campaign.id}`}
                            className="font-medium hover:underline"
                          >
                            {campaign.name}
                          </Link>
                          <Badge variant={STATUS_VARIANT[campaign.status] ?? "outline"}>
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {campaign.is_multi_step ? (
                              <><ListOrdered className="mr-1 h-3 w-3" />{stepCount} steps</>
                            ) : (
                              <><Mail className="mr-1 h-3 w-3" />Broadcast</>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {campaign.subject || (campaign.is_multi_step ? "Multi-step sequence" : "—")}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Recipients: {campaign.total_recipients}</span>
                          <span>Sent: {campaign.sent_count}</span>
                          {campaign.failed_count > 0 && (
                            <span className="text-destructive">Failed: {campaign.failed_count}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {campaign.status === "draft" && (
                          <>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/admin/campaigns/${campaign.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              disabled={isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Birthday campaigns */}
          {birthdayCampaigns.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Automated Campaigns
              </h3>
              {birthdayCampaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/campaigns/${campaign.id}`}
                          className="font-medium hover:underline"
                        >
                          {campaign.name}
                        </Link>
                        <Badge variant={STATUS_VARIANT[campaign.status] ?? "outline"}>
                          {campaign.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Birthday
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Sent: {campaign.sent_count}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/campaigns/${campaign.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---- Drip Emails Tab ---- */}
        <TabsContent value="drip" className="space-y-4">
          {dripEmails.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <Zap className="h-12 w-12 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="font-medium text-foreground">No drip emails yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create automated drip email sequences for onboarding and engagement.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {dripEmails.map((drip) => (
                <Card key={drip.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {PHASE_LABELS[drip.phase] || drip.phase}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Step {drip.step + 1}
                        </Badge>
                        <span className="font-medium">{drip.subject}</span>
                      </div>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Day {drip.day_offset}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`drip-active-${drip.id}`}
                          className="text-xs text-muted-foreground"
                        >
                          {drip.is_active ? "Active" : "Paused"}
                        </Label>
                        <Switch
                          id={`drip-active-${drip.id}`}
                          checked={drip.is_active}
                          onCheckedChange={(checked) =>
                            handleToggleDrip(drip.id, checked)
                          }
                          disabled={isPending}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDrip(drip.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
