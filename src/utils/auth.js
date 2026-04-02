import { getSupabaseClient } from "../lib/supabase";

function getErrorMessage(error, fallback) {
  if (error?.message) {
    return error.message;
  }

  return fallback;
}

function mapUser(user, profileName = "") {
  const fallbackName = profileName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return {
    id: user.id,
    name: fallbackName,
    email: user.email
  };
}

async function getProfileName(userId) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();

  if (error || !data?.full_name) {
    return "";
  }

  return data.full_name;
}

async function upsertProfile(user, nameOverride = "") {
  if (!user?.id) {
    return;
  }

  const fullName = nameOverride || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: fullName,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "id"
    }
  );

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to save user profile."));
  }
}

export async function registerUser({ name, email, password }) {
  const trimmedName = String(name || "").trim();
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  if (!trimmedName || !normalizedEmail || !password) {
    throw new Error("Name, email, and password are required.");
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: trimmedName
      }
    }
  });

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to register with Supabase."));
  }

  if (data?.user && data?.session) {
    await upsertProfile(data.user, trimmedName);
  }

  if (!data?.user) {
    throw new Error("Supabase signup did not return a user.");
  }

  return mapUser(data.user, trimmedName);
}

export async function loginUser({ email, password }) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  if (!normalizedEmail || !password) {
    throw new Error("Email and password are required.");
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password
  });

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to login."));
  }

  if (!data?.user) {
    throw new Error("Supabase login did not return a user.");
  }

  await upsertProfile(data.user);
  const profileName = await getProfileName(data.user.id);

  return {
    token: data.session?.access_token || "",
    user: mapUser(data.user, profileName)
  };
}

export async function getAuthenticatedUser() {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return null;
  }

  let profileName = await getProfileName(data.user.id);

  if (!profileName) {
    await upsertProfile(data.user);
    profileName = await getProfileName(data.user.id);
  }

  return mapUser(data.user, profileName);
}

export async function logoutUser() {
  const supabase = await getSupabaseClient();
  await supabase.auth.signOut();
}
