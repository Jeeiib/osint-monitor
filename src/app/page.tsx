import { BaseMap } from "@/components/map";
import { MainLayout } from "@/components/layout";

export default function Home() {
  return (
    <MainLayout>
      <BaseMap className="absolute inset-0" />
    </MainLayout>
  );
}
