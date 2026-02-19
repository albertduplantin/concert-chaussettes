import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { EmailVerificationBanner } from "@/components/layout/email-verification-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  let showBanner = false;
  if (session) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { emailVerified: true, passwordHash: true },
    });
    // Show banner only for credential users (not OAuth) who haven't verified
    showBanner = !!user?.passwordHash && !user?.emailVerified;
  }

  return (
    <>
      {showBanner && session && (
        <EmailVerificationBanner email={session.user.email} />
      )}
      {children}
    </>
  );
}
