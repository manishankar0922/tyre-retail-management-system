import { redirect } from "next/navigation";

export default function OwnerRootRedirect() {
  redirect("/owner/dashboard");
}