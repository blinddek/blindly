import * as React from "react";
import { Text, Hr } from "@react-email/components";
import {
  BaseLayout,
  CtaButton,
  styles,
} from "./_base-layout";
import type { EnrollmentConfirmationProps } from "@/lib/email-types";

export default function EnrollmentConfirmation({
  studentName,
  courseName,
  courseUrl,
}: EnrollmentConfirmationProps) {
  return (
    <BaseLayout preview={`You're enrolled in ${courseName}!`}>
      <Text style={styles.h1}>You&apos;re In, {studentName}!</Text>

      <Text style={styles.paragraph}>
        Great news — you&apos;re now enrolled in <strong>{courseName}</strong>.
        Your course is ready and waiting for you.
      </Text>

      <Text style={styles.paragraph}>
        Jump straight into the first lesson and start learning at your own pace.
        You can track your progress anytime from your portal.
      </Text>

      <Hr style={styles.hr} />

      <CtaButton href={courseUrl}>Start Learning</CtaButton>
    </BaseLayout>
  );
}
