import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ComingSoon } from "@/components/layout/ComingSoon";
import { SignOutButton } from "@/components/settings/SignOutButton";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <SectionHeader>Account</SectionHeader>
        <SignOutButton />
      </Card>
      <ComingSoon title="Settings — coming soon" />
    </div>
  );
}
