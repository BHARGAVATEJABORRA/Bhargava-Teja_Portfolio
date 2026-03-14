import { HomeShell } from "@/components/layout/home-shell";
import { StructuredData } from "@/components/seo/structured-data";

export default function Home() {
  return (
    <>
      <StructuredData />
      <HomeShell />
    </>
  );
}
