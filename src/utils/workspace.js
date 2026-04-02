import { defaultCompanyProfile } from "../data/defaults";
import { getInvoiceTemplate } from "../data/invoiceTemplates";
import { getSupabaseClient } from "../lib/supabase";

const LEGACY_USERS_STORAGE_KEY = "mamo-auth-users";

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toSafeDraft(draft) {
  if (!draft || typeof draft !== "object") {
    return null;
  }

  const safeDraft = { ...draft };

  if (!safeDraft.id) {
    safeDraft.id = `INV-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  }

  if (!safeDraft.savedAt) {
    safeDraft.savedAt = new Date().toISOString();
  }

  safeDraft.templateId = getInvoiceTemplate(safeDraft.templateId).id;

  return safeDraft;
}

function sortDraftsBySavedAtDesc(drafts) {
  return [...drafts].sort((left, right) => {
    const leftDate = new Date(left.savedAt || 0).getTime();
    const rightDate = new Date(right.savedAt || 0).getTime();
    return rightDate - leftDate;
  });
}

export function readLegacyWorkspaceByEmail(email) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  if (!normalizedEmail || typeof window === "undefined") {
    return null;
  }

  const legacyUsers = parseJson(localStorage.getItem(LEGACY_USERS_STORAGE_KEY), []);
  const matchedUser = legacyUsers.find((entry) => String(entry?.email || "").toLowerCase() === normalizedEmail);

  if (!matchedUser?.id) {
    return null;
  }

  const companyStorageKey = `mamo:${matchedUser.id}:company-profile`;
  const draftsStorageKey = `mamo:${matchedUser.id}:invoice-drafts`;
  const companyProfile = parseJson(localStorage.getItem(companyStorageKey), null);
  const drafts = parseJson(localStorage.getItem(draftsStorageKey), []).map(toSafeDraft).filter(Boolean);

  return {
    companyProfile,
    drafts: sortDraftsBySavedAtDesc(drafts)
  };
}

export async function getCompanyProfile(userId) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.from("company_profiles").select("payload").eq("user_id", userId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.payload || typeof data.payload !== "object") {
    return null;
  }

  return data.payload;
}

export async function saveCompanyProfile(userId, companyProfile) {
  const payload = companyProfile && typeof companyProfile === "object" ? companyProfile : defaultCompanyProfile;

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("company_profiles").upsert(
    {
      user_id: userId,
      payload,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "user_id"
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return payload;
}

export async function listInvoices(userId) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_id,payload,saved_at,updated_at")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return sortDraftsBySavedAtDesc(
    (data || [])
      .map((row) => {
        if (!row?.payload || typeof row.payload !== "object") {
          return null;
        }

        const draft = { ...row.payload };
        draft.id = draft.id || row.invoice_id;
        draft.savedAt = draft.savedAt || row.saved_at || row.updated_at || new Date().toISOString();
        return toSafeDraft(draft);
      })
      .filter(Boolean)
  );
}

export async function upsertInvoice(userId, invoice) {
  const safeDraft = toSafeDraft(invoice);

  if (!safeDraft) {
    throw new Error("Invalid invoice payload.");
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("invoices").upsert(
    {
      user_id: userId,
      invoice_id: safeDraft.id,
      invoice_number: safeDraft.invoiceNumber || null,
      invoice_date: safeDraft.invoiceDate || null,
      payload: safeDraft,
      saved_at: safeDraft.savedAt
    },
    {
      onConflict: "user_id,invoice_id"
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return safeDraft;
}

export async function deleteInvoice(userId, invoiceId) {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("invoices").delete().eq("user_id", userId).eq("invoice_id", invoiceId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function migrateLegacyWorkspaceToSupabase({ userId, email }) {
  const legacyWorkspace = readLegacyWorkspaceByEmail(email);

  if (!legacyWorkspace) {
    return {
      migrated: false,
      companyProfile: null,
      drafts: []
    };
  }

  const tasks = [];

  if (legacyWorkspace.companyProfile) {
    tasks.push(saveCompanyProfile(userId, legacyWorkspace.companyProfile));
  }

  const invoiceTasks = legacyWorkspace.drafts.map((draft) => upsertInvoice(userId, draft));
  tasks.push(...invoiceTasks);

  if (!tasks.length) {
    return {
      migrated: false,
      companyProfile: legacyWorkspace.companyProfile,
      drafts: legacyWorkspace.drafts
    };
  }

  await Promise.all(tasks);

  return {
    migrated: true,
    companyProfile: legacyWorkspace.companyProfile,
    drafts: legacyWorkspace.drafts
  };
}
