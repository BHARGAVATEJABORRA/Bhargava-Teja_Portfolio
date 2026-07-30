import { HashScroll } from "@/components/layout/hash-scroll";
import { HomeShell } from "@/components/layout/home-shell";
import { StructuredData } from "@/components/seo/structured-data";
import { portfolioContent } from "@/content/portfolio-content";
import { getPublishedProjects } from "@/lib/content-store";

// Public project data is database-backed and may be changed outside an admin
// API request (imports, scripts, or direct Turso maintenance). Keep this route
// dynamic so that content freshness is never traded for a render optimization.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  let projects = portfolioContent.projects;
  try {
    projects = await getPublishedProjects();
  } catch (error) {
    // Keep the portfolio available during a transient database outage; the
    // bundled snapshot is deliberately a fallback, never the production CMS
    // source of truth.
    console.error("[home] failed to load live projects; using bundled fallback:", error);
  }

  return (
    <>
      <StructuredData projects={projects} />
      <HashScroll />
      <HomeShell projects={projects} />
    </>
  );
}
