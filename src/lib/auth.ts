import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type StaffUser = { id: string; email: string; displayName: string | null };

// Returns the logged-in staff member, or redirects.
// Cached per request so layout and page share one lookup.
export const requireStaff = cache(async (): Promise<StaffUser> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: staff } = await supabase
    .from("inv_staff")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!staff) redirect("/no-access");

  return { id: user.id, email: user.email ?? "", displayName: staff.display_name };
});
