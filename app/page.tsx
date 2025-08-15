export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import FantasyDashboard from "@/app/components/fantasy-dashboard";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default function Page({ searchParams }: PageProps) {
  return <FantasyDashboard searchParams={searchParams} />;
}
