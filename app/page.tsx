export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import FantasyDashboard from "@/app/components/fantasy-dashboard";
import { SearchParams } from "next/dist/server/request/search-params";

type PageProps = {
  searchParams: SearchParams;
};

export default async function Page({ searchParams }: PageProps) {
  return <FantasyDashboard searchParams={searchParams} />;
}
