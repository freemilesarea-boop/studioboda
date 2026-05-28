/**
 * Create or promote the initial admin account.
 *
 * Usage:
 *   1. Set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME (and Supabase keys) in .env.local
 *   2. npm run create-admin
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";

config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "STUDIO BODA Admin";

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!email || !password) {
    throw new Error("Missing ADMIN_EMAIL or ADMIN_PASSWORD");
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  const auth = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const db = createClient(url, serviceKey, {
    db: { schema: "boda" },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Try to find existing user by email
  let userId: string | null = null;
  const { data: list } = await auth.auth.admin.listUsers({ perPage: 200 });
  const found = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (found) {
    userId = found.id;
    // Reset password
    await auth.auth.admin.updateUserById(found.id, { password });
    console.log(`✔ user already existed (${email}) — password reset`);
  } else {
    const { data, error } = await auth.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error || !data.user) {
      throw new Error(`Failed to create auth user: ${error?.message ?? "unknown"}`);
    }
    userId = data.user.id;
    console.log(`✔ created auth user ${email}`);
  }

  // Upsert profile with role='admin'
  const { error: pErr } = await db.from("profiles").upsert({
    id: userId,
    email,
    name,
    role: "admin",
  });
  if (pErr) {
    throw new Error(`Failed to upsert profile: ${pErr.message}`);
  }

  console.log(`✔ profile upserted with role=admin (id=${userId})`);
  console.log("\nDone. You can now log in at /admin/login");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
