import { AvisConcertClient } from "./client";

export default async function AvisConcertPage({
  params,
}: {
  params: Promise<{ concertId: string }>;
}) {
  const { concertId } = await params;

  const res = await fetch(
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/avis/concert/${concertId}`,
    { cache: "no-store" }
  );
  const data = await res.json();

  if (!res.ok) {
    return <AvisConcertClient concertId={concertId} data={null} error={data.error} />;
  }

  return <AvisConcertClient concertId={concertId} data={data} error={null} />;
}
