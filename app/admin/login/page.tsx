import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/AdminLogin";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  // Already signed in? Skip the form.
  if (await getAdminSession()) redirect("/admin");
  return <AdminLogin />;
}
