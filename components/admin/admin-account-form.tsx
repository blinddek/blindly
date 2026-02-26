"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2 } from "lucide-react";
import { updateProfile, updatePassword } from "@/lib/auth/actions";
import { toast } from "sonner";
import type { UserProfile } from "@/types";

interface AdminAccountFormProps {
  user: UserProfile;
}

export function AdminAccountForm({ user }: Readonly<AdminAccountFormProps>) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and security settings.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab user={user} />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab({ user }: { user: UserProfile }) {
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
              Email cannot be changed here.
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
