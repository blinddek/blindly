"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { updateProfile, updatePassword } from "@/lib/auth/actions";
import { toast } from "sonner";
import type { UserProfile } from "@/types";
import type { ClientFieldKey } from "@/lib/auth/client-fields";
import { CLIENT_FIELD_LABELS } from "@/lib/auth/client-fields";

interface AccountFormProps {
  user: UserProfile;
  enabledClientFields: ClientFieldKey[];
  showAgreements: boolean;
}

export function AccountForm({
  user,
  enabledClientFields,
  showAgreements,
}: Readonly<AccountFormProps>) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your profile, security, and notification preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {showAgreements && (
            <TabsTrigger value="agreements">Agreements</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab user={user} enabledClientFields={enabledClientFields} />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab user={user} />
        </TabsContent>

        {showAgreements && (
          <TabsContent value="agreements">
            <AgreementsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ─── Profile Tab ───────────────────────────────────────────────

function ProfileTab({
  user,
  enabledClientFields,
}: Readonly<{
  user: UserProfile;
  enabledClientFields: ClientFieldKey[];
}>) {
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Profile updated successfully");
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={user.full_name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed here. Contact support if needed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={user.phone}
            />
          </div>

          {/* Config-driven client fields */}
          {enabledClientFields.map((field) => (
            <ClientField key={field} field={field} user={user} />
          ))}

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Client Field Renderer ─────────────────────────────────────

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const RELATIONSHIP_OPTIONS = [
  "Single",
  "In a relationship",
  "Married",
  "Divorced",
  "Widowed",
  "Prefer not to say",
];
const REFERRAL_OPTIONS = [
  "Google search",
  "Social media",
  "Friend / family",
  "Doctor / therapist",
  "Other",
];

function ClientField({
  field,
  user,
}: Readonly<{
  field: ClientFieldKey;
  user: UserProfile;
}>) {
  const label = CLIENT_FIELD_LABELS[field];

  switch (field) {
    case "dateOfBirth":
      return (
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">{label}</Label>
          <Input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            defaultValue={user.date_of_birth || ""}
          />
        </div>
      );

    case "gender":
      return (
        <div className="space-y-2">
          <Label htmlFor="gender">{label}</Label>
          <SelectField
            name="gender"
            defaultValue={user.gender || ""}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
          />
        </div>
      );

    case "relationshipStatus":
      return (
        <div className="space-y-2">
          <Label htmlFor="relationship_status">{label}</Label>
          <SelectField
            name="relationship_status"
            defaultValue={user.relationship_status || ""}
            options={RELATIONSHIP_OPTIONS}
            placeholder="Select status"
          />
        </div>
      );

    case "referralSource":
      return (
        <div className="space-y-2">
          <Label htmlFor="referral_source">{label}</Label>
          <SelectField
            name="referral_source"
            defaultValue={user.referral_source || ""}
            options={REFERRAL_OPTIONS}
            placeholder="How did you hear about us?"
          />
        </div>
      );

    case "address":
      return (
        <div className="space-y-2">
          <Label htmlFor="address">{label}</Label>
          <Textarea
            id="address"
            name="address"
            rows={2}
            defaultValue={user.address || ""}
            placeholder="Street address, city, postal code"
          />
        </div>
      );

    case "emergencyContact":
      return (
        <div className="space-y-2">
          <Label htmlFor="emergency_contact">{label}</Label>
          <Input
            id="emergency_contact"
            name="emergency_contact"
            defaultValue={user.emergency_contact || ""}
            placeholder="Name and phone number"
          />
        </div>
      );

    case "medicalInfo":
      return (
        <div className="space-y-2">
          <Label htmlFor="medical_info">{label}</Label>
          <Textarea
            id="medical_info"
            name="medical_info"
            rows={3}
            defaultValue={user.medical_info || ""}
            placeholder="Any relevant medical conditions or medications"
          />
        </div>
      );

    case "companyName":
      return (
        <div className="space-y-2">
          <Label htmlFor="company_name">{label}</Label>
          <Input
            id="company_name"
            name="company_name"
            defaultValue={user.company_name || ""}
          />
        </div>
      );

    default:
      return null;
  }
}

// ─── Select Field Helper ───────────────────────────────────────

function SelectField({
  name,
  defaultValue,
  options,
  placeholder,
}: {
  name: string;
  defaultValue: string;
  options: string[];
  placeholder: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

// ─── Security Tab ──────────────────────────────────────────────

function SecurityTab() {
  const [state, formAction, isPending] = useActionState(updatePassword, null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Password updated successfully");
      formRef.current?.reset();
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  function validatePassword(pass: string): string | null {
    if (pass.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/\d/.test(pass)) {
      return "Password must contain at least 1 number";
    }
    return null;
  }

  function handleSubmit(formData: FormData) {
    const newPass = formData.get("new_password") as string;
    const confirm = formData.get("confirm_password") as string;

    const error = validatePassword(newPass);
    if (error) {
      setValidationError(error);
      return;
    }

    if (newPass !== confirm) {
      setValidationError("Passwords do not match");
      return;
    }

    setValidationError(null);
    formAction(formData);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              name="new_password"
              type="password"
              onChange={() => setValidationError(null)}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              onChange={() => setValidationError(null)}
              required
              minLength={8}
            />
          </div>

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          <div className="text-xs text-muted-foreground">
            <p>Password requirements:</p>
            <ul className="ml-4 mt-1 list-disc">
              <li>At least 8 characters long</li>
              <li>At least 1 number</li>
            </ul>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Notifications Tab ─────────────────────────────────────────

function NotificationsTab({ user }: Readonly<{ user: UserProfile }>) {
  const [emailNotif, setEmailNotif] = useState(
    user.notification_prefs?.email ?? true
  );
  const [smsNotif, setSmsNotif] = useState(
    user.notification_prefs?.sms ?? false
  );
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Notification preferences updated");
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Pass core fields as hidden to avoid null overwrites */}
          <input type="hidden" name="full_name" value={user.full_name} />
          <input type="hidden" name="phone" value={user.phone || ""} />
          <input
            type="hidden"
            name="business_name"
            value={user.business_name || ""}
          />
          <input
            type="hidden"
            name="notification_prefs"
            value={JSON.stringify({ email: emailNotif, sms: smsNotif })}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_notif" className="text-sm font-medium">
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive updates and notifications via email
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  id="email_notif"
                  type="checkbox"
                  checked={emailNotif}
                  onChange={(e) => setEmailNotif(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full dark:bg-gray-600" />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms_notif" className="text-sm font-medium">
                  SMS Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive important alerts via SMS
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  id="sms_notif"
                  type="checkbox"
                  checked={smsNotif}
                  onChange={(e) => setSmsNotif(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full dark:bg-gray-600" />
              </label>
            </div>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Agreements Tab ────────────────────────────────────────────

function AgreementsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal Agreements</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Legal documents and agreements will appear here once configured by the
          administrator.
        </p>
      </CardContent>
    </Card>
  );
}
