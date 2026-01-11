import { BaseMap } from "@/components/map";
import { MainLayout } from "@/components/layout";
import { FilterBar } from "@/components/filters";

export default function Home() {
  return (
    <MainLayout>
      <BaseMap className="absolute inset-0" />
      <FilterBar />
    </MainLayout>
  );
}
