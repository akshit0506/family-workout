import { HomeStats } from "@/components/home/HomeStats";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Feed } from "@/components/home/Feed";

export default function HomePage() {
  return (
    <>
      <HomeStats />
      <SectionHeader variant="heading">Recent Activity</SectionHeader>
      <Feed />
    </>
  );
}
