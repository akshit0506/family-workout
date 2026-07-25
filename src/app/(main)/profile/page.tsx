import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/athletes";

export default async function ProfileRedirectPage() {
  const currentUser = await getCurrentUser();
  redirect(`/profile/${currentUser.id}`);
}
