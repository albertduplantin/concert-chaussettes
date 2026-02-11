import { AvisInviteClient } from "./client";

export default async function AvisInvitePage({
  params,
}: {
  params: Promise<{ reviewToken: string }>;
}) {
  const { reviewToken } = await params;

  // Fetch data server-side to pre-populate form
  const res = await fetch(
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/avis/invitation/${reviewToken}`,
    { cache: "no-store" }
  );
  const data = await res.json();

  if (!res.ok) {
    return <AvisInviteClient reviewToken={reviewToken} data={null} error={data.error} />;
  }

  return <AvisInviteClient reviewToken={reviewToken} data={data} error={null} />;
}
