import { useEffect, useRef, useState } from "react";
import CompanyProfileCard from "./components/CompanyProfileCard";
import InvoiceEditor from "./components/InvoiceEditor";
import InvoicePreview from "./components/InvoicePreview";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import { defaultCompanyProfile, defaultInvoice } from "./data/defaults";
import { getInvoiceTemplate, RECOMMENDED_INVOICE_TEMPLATE_ID } from "./data/invoiceTemplates";
import { getAuthenticatedUser, loginUser, logoutUser, registerUser } from "./utils/auth";
import {
  deleteInvoice,
  getCompanyProfile,
  listInvoices,
  migrateLegacyWorkspaceToSupabase,
  saveCompanyProfile,
  upsertInvoice
} from "./utils/workspace";
import {
  downloadDesktopAppFromRenderer,
  getEmailQueueStatusFromDesktop,
  processEmailQueueFromDesktop,
  saveInvoiceToGoogleDriveFromRenderer,
  sendInvoiceFromRenderer,
  subscribeToEmailQueueUpdates
} from "./utils/desktop";
import { blobToBase64, buildInvoicePdf, calculateInvoiceTotals, formatMoney } from "./utils/invoice";

function generateInvoiceNumber() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const randomCode = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `INV-${month}${year}-${randomCode}`;
}

function createNewInvoice() {
  return {
    ...defaultInvoice,
    id: `INV-${Date.now()}`,
    templateId: RECOMMENDED_INVOICE_TEMPLATE_ID,
    invoiceNumber: generateInvoiceNumber(),
    buyer: { ...defaultInvoice.buyer },
    consignee: { ...defaultInvoice.consignee },
    items: defaultInvoice.items.map((item) => ({ ...item, id: `item-${crypto.randomUUID()}` }))
  };
}

function normalizeInvoiceTemplate(invoiceLike) {
  if (!invoiceLike || typeof invoiceLike !== "object") {
    return invoiceLike;
  }

  return {
    ...invoiceLike,
    templateId: getInvoiceTemplate(invoiceLike.templateId).id
  };
}

function normalizeAssetPath(pathValue) {
  if (typeof pathValue === "string" && pathValue.startsWith("/assets/")) {
    return pathValue.slice(1);
  }

  return pathValue;
}

function normalizeCompanyProfile(profile) {
  if (!profile || typeof profile !== "object") {
    return profile;
  }

  return {
    ...profile,
    logo: normalizeAssetPath(profile.logo),
    signature: normalizeAssetPath(profile.signature),
    qrCode: normalizeAssetPath(profile.qrCode)
  };
}

function NavigationTab({ label, active, onClick }) {
  return (
    <button className={`nav-tab ${active ? "nav-tab-active" : ""}`} type="button" onClick={onClick}>
      {label}
    </button>
  );
}

function getUserInitials(name) {
  const initials = String(name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return initials || "U";
}

function parseInvoiceDate(invoiceDate, fallbackIso) {
  const source = invoiceDate || fallbackIso;

  if (!source) {
    return null;
  }

  const parsed = new Date(source);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function getPaidAmountInr(draft, totalInr) {
  const status = String(draft.paymentStatus || "").toLowerCase();
  let paidAmount = Number(draft.amountPaidInr || 0);

  if (status === "paid") {
    paidAmount = totalInr;
  } else if (status === "unpaid") {
    paidAmount = 0;
  }

  return Math.max(0, Math.min(paidAmount, totalInr));
}

function buildDashboardSnapshot(drafts) {
  const now = new Date();
  const lastSixMonths = [];
  const monthTotals = new Map();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleString("en-IN", { month: "short" });
    lastSixMonths.push({ monthKey, label });
    monthTotals.set(monthKey, 0);
  }

  let totalSalesInr = 0;
  let totalReceivedInr = 0;
  let totalPendingInr = 0;

  drafts.forEach((draft) => {
    const totals = calculateInvoiceTotals(draft);
    const totalInr = totals.totalInr;
    const paidInr = getPaidAmountInr(draft, totalInr);
    const pendingInr = Math.max(totalInr - paidInr, 0);
    const invoiceDate = parseInvoiceDate(draft.invoiceDate, draft.savedAt);

    totalSalesInr += totalInr;
    totalReceivedInr += paidInr;
    totalPendingInr += pendingInr;

    if (invoiceDate) {
      const monthKey = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, "0")}`;

      if (monthTotals.has(monthKey)) {
        monthTotals.set(monthKey, monthTotals.get(monthKey) + totalInr);
      }
    }
  });

  return {
    totalSalesInr,
    totalReceivedInr,
    totalPendingInr,
    totalInvoices: drafts.length,
    monthlySales: lastSixMonths.map((month) => ({
      month: month.label,
      salesInr: monthTotals.get(month.monthKey) || 0
    }))
  };
}

function fetchDashboardSnapshot(drafts) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(buildDashboardSnapshot(drafts));
    }, 350);
  });
}

function DashboardMetricCard({ label, value, loading, delay = 0 }) {
  return (
    <article className="dashboard-metric-card shadow-md rounded-2xl transition-all duration-300 fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <p className="dashboard-metric-label">{label}</p>
      {loading ? <div className="skeleton-line skeleton-line-lg" /> : <h3 className="dashboard-metric-value">{value}</h3>}
    </article>
  );
}

function MonthlySalesChart({ data }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const maxValue = Math.max(...data.map((point) => Number(point.salesInr || 0)), 1);

  return (
    <div className="dashboard-chart-wrap">
      <div className="simple-chart-grid">
        {data.map((point, index) => {
          const value = Number(point.salesInr || 0);
          const heightPercent = Math.max((value / maxValue) * 100, value > 0 ? 10 : 4);

          return (
            <div key={`${point.month}-${index}`} className="simple-chart-column">
              <div
                className="simple-chart-bar-shell"
                tabIndex={0}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
              >
                {activeIndex === index ? (
                  <div className="simple-chart-tooltip">
                    <strong>{point.month}</strong>
                    <span>{formatMoney(value, "INR")}</span>
                  </div>
                ) : null}
                <div
                  className="simple-chart-bar transition-all duration-300"
                  style={{
                    height: `${heightPercent}%`,
                    animationDelay: `${index * 70}ms`
                  }}
                />
              </div>
              <span className="simple-chart-label">{point.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DashboardPage({ drafts, searchValue, onSearchChange, onCreateInvoice, onOpenDraft, onDeleteDraft }) {
  const [dashboard, setDashboard] = useState(() => buildDashboardSnapshot(drafts));
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setDashboardLoading(true);

    fetchDashboardSnapshot(drafts).then((nextSnapshot) => {
      if (!active) {
        return;
      }

      setDashboard(nextSnapshot);
      setDashboardLoading(false);
    });

    return () => {
      active = false;
    };
  }, [drafts]);

  const filteredDrafts = drafts.filter((draft) => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [draft.invoiceNumber, draft.buyer.companyName, draft.invoiceDate].join(" ").toLowerCase().includes(query);
  });

  return (
    <section className="page-body">
      <div className="page-header dashboard-header">
        <div>
          <h1>Invoices</h1>
          <p>Manage invoices, payments, and monthly sales performance</p>
        </div>
        <button className="primary-button" type="button" onClick={onCreateInvoice}>
          Create Invoice
        </button>
      </div>

      <section className="dashboard-overview-grid">
        <DashboardMetricCard label="Total Sales" value={formatMoney(dashboard.totalSalesInr, "INR")} loading={dashboardLoading} delay={0} />
        <DashboardMetricCard label="Total Received" value={formatMoney(dashboard.totalReceivedInr, "INR")} loading={dashboardLoading} delay={80} />
        <DashboardMetricCard label="Total Pending" value={formatMoney(dashboard.totalPendingInr, "INR")} loading={dashboardLoading} delay={160} />
        <DashboardMetricCard label="Total Invoices" value={String(dashboard.totalInvoices)} loading={dashboardLoading} delay={240} />
      </section>

      <section className="dashboard-chart-card shadow-md rounded-2xl transition-all duration-300 fade-in-up" style={{ animationDelay: "100ms" }}>
        <div className="dashboard-chart-header">
          <h2>Monthly Sales (Last 6 Months)</h2>
        </div>
        {dashboardLoading ? (
          <div className="dashboard-chart-skeleton">
            <div className="skeleton-line skeleton-line-xl" />
            <div className="skeleton-bars">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-bar-${index}`} className="skeleton-bar" />
              ))}
            </div>
          </div>
        ) : (
          <MonthlySalesChart data={dashboard.monthlySales} />
        )}
      </section>

      <div className="dashboard-toolbar">
        <input
          className="search-input"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by invoice number or buyer name..."
        />
      </div>

      <div className="table-card">
        <table className="invoice-list-table">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Buyer</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrafts.length ? (
              filteredDrafts.map((draft) => {
                const totals = calculateInvoiceTotals(draft);

                return (
                  <tr
                    key={draft.id}
                    className="invoice-row hover:bg-gray-50 transition-all duration-300"
                    onClick={() => onOpenDraft(draft)}
                  >
                    <td>{draft.invoiceNumber || "-"}</td>
                    <td>{draft.buyer.companyName || "-"}</td>
                    <td>{draft.invoiceDate || "-"}</td>
                    <td>{formatMoney(totals.totalInr, draft.currency || "INR")}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="table-link"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenDraft(draft);
                          }}
                        >
                          Open
                        </button>
                        <button
                          className="table-link table-link-danger"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteDraft(draft.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="empty-table">
                  No invoices found yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CreateInvoicePage({ invoice, companyProfile, invoiceRef, onSave, onBack, children }) {
  const selectedTemplate = getInvoiceTemplate(invoice?.templateId);

  return (
    <section className="page-body create-page-shell">
      <div className="create-hero">
        <div className="create-hero-copy">
          <button className="back-link create-back-link" type="button" onClick={onBack}>
            Back to Dashboard
          </button>
          <p className="create-kicker">Invoice Studio</p>
          <h1>Create Invoice</h1>
          <p>Design, edit, and export polished invoices with live preview.</p>
        </div>
        <button className="primary-button create-save-button" type="button" onClick={onSave}>
          Save Invoice
        </button>
      </div>

      <div className="workspace-grid create-workspace-grid">
        <div className="workspace-column">{children}</div>
        <div className="workspace-preview-card create-preview-card">
          <div className="workspace-card-header create-preview-header">
            <div>
              <p className="eyebrow">Live Render</p>
              <h2>Invoice Preview</h2>
            </div>
            <span className="template-pill">{selectedTemplate.name}</span>
          </div>
          <div className="preview-frame">
            <InvoicePreview invoice={invoice} companyProfile={companyProfile} invoiceRef={invoiceRef} />
          </div>
        </div>
      </div>
    </section>
  );
}

function CompanySettingsPage({ onSaveSettings, saveMessage, children }) {
  return (
    <section className="page-body">
      <div className="page-header">
        <div>
          <h1>Company Settings</h1>
          <p>Update your company information</p>
        </div>
      </div>

      <div className="settings-page">
        {children}
        <div className="settings-footer">
          {saveMessage ? <p className="settings-feedback">{saveMessage}</p> : <span />}
          <button className="primary-button" type="button" onClick={onSaveSettings}>
            Save Settings
          </button>
        </div>
      </div>
    </section>
  );
}

function InvoiceStudio({ authUser, onLogout }) {
  const invoiceRef = useRef(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceFeedback, setWorkspaceFeedback] = useState("");
  const [companyProfile, setCompanyProfile] = useState(() => normalizeCompanyProfile(defaultCompanyProfile));
  const [invoice, setInvoice] = useState(() => createNewInvoice());
  const [drafts, setDrafts] = useState([]);
  const [emailState, setEmailState] = useState({
    to: "",
    subject: "Tax Invoice",
    message: "Please find the attached invoice.",
    loading: false,
    feedback: ""
  });
  const [driveState, setDriveState] = useState({
    loading: false,
    feedback: "",
    webViewLink: ""
  });
  const [activePage, setActivePage] = useState("dashboard");
  const [searchValue, setSearchValue] = useState("");
  const [companyMessage, setCompanyMessage] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [queuedEmailCount, setQueuedEmailCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      setWorkspaceLoading(true);
      setWorkspaceFeedback("");

      try {
        const [remoteCompanyProfile, remoteDrafts] = await Promise.all([getCompanyProfile(authUser.id), listInvoices(authUser.id)]);
        let nextCompanyProfile = normalizeCompanyProfile(remoteCompanyProfile || defaultCompanyProfile);
        let nextDrafts = remoteDrafts;
        let feedback = "";

        if (!remoteCompanyProfile && !remoteDrafts.length) {
          const migration = await migrateLegacyWorkspaceToSupabase({
            userId: authUser.id,
            email: authUser.email
          });

          if (migration.migrated) {
            nextCompanyProfile = normalizeCompanyProfile(migration.companyProfile || defaultCompanyProfile);
            nextDrafts = migration.drafts;
            feedback = "Local data imported to Supabase.";
          }
        }

        if (!active) {
          return;
        }

        setCompanyProfile(nextCompanyProfile);
        setDrafts(nextDrafts.map((draft) => normalizeInvoiceTemplate(draft)));
        setWorkspaceFeedback(feedback);
      } catch (error) {
        if (!active) {
          return;
        }

        setWorkspaceFeedback(error instanceof Error ? error.message : "Unable to load your Supabase workspace.");
        setCompanyProfile(normalizeCompanyProfile(defaultCompanyProfile));
        setDrafts([]);
      } finally {
        if (active) {
          setWorkspaceLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      active = false;
    };
  }, [authUser.email, authUser.id]);

  useEffect(() => {
    let active = true;

    const unsubscribe = subscribeToEmailQueueUpdates((status) => {
      setQueuedEmailCount(Number(status?.queueSize || 0));
    });

    getEmailQueueStatusFromDesktop()
      .then((status) => {
        if (active) {
          setQueuedEmailCount(Number(status?.queueSize || 0));
        }
      })
      .catch(() => {
        if (active) {
          setQueuedEmailCount(0);
        }
      });

    void processEmailQueueFromDesktop().catch(() => { });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  function updateInvoice(field, value) {
    setInvoice((current) => {
      const next = { ...current, [field]: value };

      if (field === "paymentStatus") {
        if (value === "unpaid") {
          next.amountPaidInr = 0;
        } else if (value === "paid") {
          next.amountPaidInr = calculateInvoiceTotals(next).totalInr;
        }
      }

      return next;
    });
  }

  function updateBuyer(field, value) {
    setInvoice((current) => ({
      ...current,
      buyer: {
        ...current.buyer,
        [field]: value
      }
    }));
  }

  function updateConsignee(field, value) {
    setInvoice((current) => ({
      ...current,
      consignee: {
        ...current.consignee,
        [field]: value
      }
    }));
  }

  function updateItem(itemId, field, value) {
    setInvoice((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    }));
  }

  function addItem() {
    setInvoice((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          id: `item-${crypto.randomUUID()}`,
          description: "Additional service",
          details: "",
          hsnSac: "",
          quantity: 1,
          unit: "Service",
          rateInr: 0
        }
      ]
    }));
  }

  function removeItem(itemId) {
    setInvoice((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId)
    }));
  }

  function updateCompanyProfile(field, value) {
    setCompanyProfile((current) => ({ ...current, [field]: value }));
    setCompanyMessage("");
  }

  function handleLogoUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updateCompanyProfile("logo", String(reader.result));
    reader.readAsDataURL(file);
  }

  function handleSignatureUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updateCompanyProfile("signature", String(reader.result));
    reader.readAsDataURL(file);
  }

  async function saveDraft() {
    const snapshot = {
      ...invoice,
      savedAt: new Date().toISOString()
    };

    setDraftMessage("Saving invoice...");

    try {
      const persistedDraft = await upsertInvoice(authUser.id, snapshot);

      setDrafts((current) => {
        const existingDraftIndex = current.findIndex((draft) => draft.id === persistedDraft.id);

        if (existingDraftIndex === -1) {
          return [persistedDraft, ...current];
        }

        return current.map((draft) => (draft.id === persistedDraft.id ? persistedDraft : draft));
      });

      setDraftMessage("Invoice saved successfully.");
      setActivePage("dashboard");
    } catch (error) {
      setDraftMessage(error instanceof Error ? error.message : "Unable to save invoice.");
    }
  }

  function createInvoiceFromScratch() {
    setInvoice(createNewInvoice());
    setDraftMessage("");
    setActivePage("create");
  }

  function openDraft(draft) {
    setInvoice(normalizeInvoiceTemplate(draft));
    setDraftMessage("");
    setActivePage("create");
  }

  async function deleteDraft(id) {
    try {
      await deleteInvoice(authUser.id, id);
      setDrafts((current) => current.filter((draft) => draft.id !== id));

      if (invoice.id === id) {
        setInvoice(createNewInvoice());
      }
    } catch (error) {
      setDraftMessage(error instanceof Error ? error.message : "Unable to delete invoice.");
    }
  }

  async function saveCompanySettings() {
    setCompanyMessage("Saving company settings...");

    try {
      const persistedProfile = await saveCompanyProfile(authUser.id, companyProfile);
      setCompanyProfile(normalizeCompanyProfile(persistedProfile));
      setCompanyMessage("Company settings saved.");
    } catch (error) {
      setCompanyMessage(error instanceof Error ? error.message : "Unable to save company settings.");
    }
  }

  async function handleDownload() {
    if (!invoiceRef.current) {
      return;
    }

    await buildInvoicePdf(invoiceRef.current, `${invoice.invoiceNumber || "invoice"}.pdf`);
  }

  async function handleSaveToGoogleDrive() {
    if (!invoiceRef.current) {
      return;
    }

    setDriveState({
      loading: true,
      feedback: "",
      webViewLink: ""
    });

    try {
      const { blob } = await buildInvoicePdf(invoiceRef.current);
      const attachmentContent = await blobToBase64(blob);
      const result = await saveInvoiceToGoogleDriveFromRenderer({
        attachmentName: `${invoice.invoiceNumber || "invoice"}.pdf`,
        attachmentContent,
        mimeType: "application/pdf"
      });

      setDriveState({
        loading: false,
        feedback: result.message || "Invoice saved to Google Drive.",
        webViewLink: String(result?.file?.webViewLink || result?.file?.webContentLink || "")
      });
    } catch (error) {
      setDriveState({
        loading: false,
        feedback: error instanceof Error ? error.message : "Unable to save invoice to Google Drive.",
        webViewLink: ""
      });
    }
  }

  async function handleSendEmail(event) {
    event.preventDefault();

    if (!invoiceRef.current || !emailState.to) {
      setEmailState((current) => ({ ...current, feedback: "Recipient email is required." }));
      return;
    }

    setEmailState((current) => ({ ...current, loading: true, feedback: "" }));

    try {
      const { blob } = await buildInvoicePdf(invoiceRef.current);
      const attachmentContent = await blobToBase64(blob);
      const result = await sendInvoiceFromRenderer({
        to: emailState.to,
        subject: emailState.subject || `Invoice ${invoice.invoiceNumber}`,
        message: emailState.message,
        attachmentName: `${invoice.invoiceNumber || "invoice"}.pdf`,
        attachmentContent
      });

      if (result.queued) {
        setQueuedEmailCount((current) => Number(result.queueSize ?? current + 1));
      } else {
        const status = await getEmailQueueStatusFromDesktop().catch(() => ({ queueSize: 0 }));
        setQueuedEmailCount(Number(status.queueSize || 0));
      }

      setEmailState((current) => ({
        ...current,
        loading: false,
        feedback: result.queued
          ? result.message || "No network connection. The invoice email has been queued and will retry automatically."
          : result.message || "Invoice emailed successfully."
      }));
    } catch (error) {
      setEmailState((current) => ({
        ...current,
        loading: false,
        feedback: error instanceof Error ? error.message : "Unable to send invoice email."
      }));
    }
  }

  const totals = calculateInvoiceTotals(invoice);
  const userInitials = getUserInitials(authUser.name);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand-mark">
            InvoSync
            <div className="internship-badge">
              Internship @ MaMo Technolabs
            </div>
          </div>
          <nav className="nav-tabs topbar-nav-shell">
            <NavigationTab label="Dashboard" active={activePage === "dashboard"} onClick={() => setActivePage("dashboard")} />
            <NavigationTab label="Create Invoice" active={activePage === "create"} onClick={() => setActivePage("create")} />
            <NavigationTab label="Company Settings" active={activePage === "settings"} onClick={() => setActivePage("settings")} />
          </nav>
        </div>
        <div className="topbar-right">
          <div className="topbar-profile">
            <span className="topbar-avatar">{userInitials}</span>
            <div className="topbar-profile-copy">
              <span className="topbar-user">{authUser.name}</span>
              <span className="topbar-status">Workspace Active</span>
            </div>
          </div>
          <button className="table-link topbar-logout" type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {workspaceLoading ? (
        <section className="page-body">
          <p className="page-message">Loading your secure workspace...</p>
        </section>
      ) : (
        <>
          {workspaceFeedback ? <p className="page-message">{workspaceFeedback}</p> : null}

          {activePage === "dashboard" ? (
            <DashboardPage
              drafts={drafts}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              onCreateInvoice={createInvoiceFromScratch}
              onOpenDraft={openDraft}
              onDeleteDraft={deleteDraft}
            />
          ) : null}

          {activePage === "create" ? (
            <CreateInvoicePage invoice={invoice} companyProfile={companyProfile} invoiceRef={invoiceRef} onSave={saveDraft} onBack={() => setActivePage("dashboard")}>
              {draftMessage ? <p className="page-message">{draftMessage}</p> : null}
              <InvoiceEditor
                invoice={invoice}
                onInvoiceChange={updateInvoice}
                onBuyerChange={updateBuyer}
                onConsigneeChange={updateConsignee}
                onItemChange={updateItem}
                onAddItem={addItem}
                onRemoveItem={removeItem}
              />

              <section className="panel summary-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Invoice Summary</p>
                    <h2>{formatMoney(totals.totalInr, invoice.currency)}</h2>
                  </div>
                  <div className="summary-actions">
                    <button className="secondary-button" type="button" onClick={handleDownload}>
                      Download PDF
                    </button>
                    <button className="secondary-button" type="button" onClick={handleSaveToGoogleDrive} disabled={driveState.loading}>
                      {driveState.loading ? "Saving..." : "Save to Google Drive"}
                    </button>
                  </div>
                </div>
                <div className="summary-rows">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <strong>{formatMoney(totals.subtotalInr, invoice.currency)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>CGST</span>
                    <strong>{formatMoney(totals.cgstInr, invoice.currency)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>SGST</span>
                    <strong>{formatMoney(totals.sgstInr, invoice.currency)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>IGST</span>
                    <strong>{formatMoney(totals.igstInr, invoice.currency)}</strong>
                  </div>
                </div>
                {driveState.feedback ? (
                  <p className="settings-feedback">
                    {driveState.feedback}
                    {driveState.webViewLink ? (
                      <>
                        {" "}
                        <a href={driveState.webViewLink} target="_blank" rel="noreferrer">
                          Open in Drive
                        </a>
                      </>
                    ) : null}
                  </p>
                ) : null}

                <form className="email-card" onSubmit={handleSendEmail}>
                  {queuedEmailCount > 0 ? (
                    <p className="settings-feedback">
                      {queuedEmailCount} queued email{queuedEmailCount > 1 ? "s" : ""} will retry automatically when internet is available.
                    </p>
                  ) : null}
                  <label className="field">
                    <span>Recipient email</span>
                    <input
                      type="email"
                      value={emailState.to}
                      onChange={(event) => setEmailState((current) => ({ ...current, to: event.target.value }))}
                      placeholder="client@example.com"
                    />
                  </label>
                  <label className="field">
                    <span>Email subject</span>
                    <input
                      value={emailState.subject}
                      onChange={(event) => setEmailState((current) => ({ ...current, subject: event.target.value }))}
                    />
                  </label>
                  <button className="primary-button" type="submit" disabled={emailState.loading}>
                    {emailState.loading ? "Sending..." : "Send Invoice"}
                  </button>
                  {emailState.feedback ? <p className="settings-feedback">{emailState.feedback}</p> : null}
                </form>
              </section>
            </CreateInvoicePage>
          ) : null}

          {activePage === "settings" ? (
            <CompanySettingsPage onSaveSettings={saveCompanySettings} saveMessage={companyMessage}>
              <CompanyProfileCard
                companyProfile={companyProfile}
                onCompanyChange={updateCompanyProfile}
                onLogoUpload={handleLogoUpload}
                onSignatureUpload={handleSignatureUpload}
                onReset={() => setCompanyProfile(defaultCompanyProfile)}
              />
            </CompanySettingsPage>
          ) : null}
        </>
      )}
    </main>
  );
}

export default function App() {
  const [authStatus, setAuthStatus] = useState("loading");
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authFeedback, setAuthFeedback] = useState("");
  const [authPage, setAuthPage] = useState("login");
  const [downloadState, setDownloadState] = useState({
    loading: false,
    feedback: ""
  });

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const sessionUser = await getAuthenticatedUser();

        if (!active) {
          return;
        }

        if (sessionUser) {
          setAuthUser(sessionUser);
          setAuthStatus("authenticated");
          return;
        }

        setAuthStatus("unauthenticated");
      } catch {
        if (active) {
          setAuthStatus("unauthenticated");
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(credentials) {
    setAuthLoading(true);
    setAuthFeedback("");

    try {
      const { user } = await loginUser(credentials);
      setAuthUser(user);
      setAuthStatus("authenticated");
    } catch (error) {
      setAuthFeedback(error instanceof Error ? error.message : "Unable to login.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(details) {
    if (details.password !== details.confirmPassword) {
      setAuthFeedback("Passwords do not match.");
      return;
    }

    setAuthLoading(true);
    setAuthFeedback("");

    try {
      await registerUser(details);
      setAuthPage("login");
      setAuthFeedback("Registration successful. If email confirmation is enabled in Supabase, verify email first, then login.");
    } catch (error) {
      setAuthFeedback(error instanceof Error ? error.message : "Unable to register.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleDesktopDownload() {
    setDownloadState({
      loading: true,
      feedback: ""
    });

    try {
      const result = await downloadDesktopAppFromRenderer();
      setDownloadState({
        loading: false,
        feedback: result.message || "Starting desktop app download."
      });
    } catch (error) {
      setDownloadState({
        loading: false,
        feedback: error instanceof Error ? error.message : "Unable to start desktop app download."
      });
    }
  }

  async function handleLogout() {
    await logoutUser().catch(() => { });
    setAuthUser(null);
    setAuthStatus("unauthenticated");
    setAuthPage("login");
    setAuthFeedback("");
  }

  if (authStatus === "loading") {
    return (
      <main className="auth-shell">
        <section className="auth-card auth-loading-card">
          <p className="eyebrow">InvoSync</p>
          <h1>Checking your session</h1>
          <p>Restoring your Supabase session and preparing the invoice workspace.</p>
        </section>
      </main>
    );
  }

  if (!authUser) {
    return authPage === "login" ? (
      <LoginPage
        onLogin={handleLogin}
        onShowRegister={() => setAuthPage("register")}
        onDownloadApp={handleDesktopDownload}
        downloadLoading={downloadState.loading}
        downloadFeedback={downloadState.feedback}
        loading={authLoading}
        feedback={authFeedback}
      />
    ) : (
      <RegisterPage
        onRegister={handleRegister}
        onShowLogin={() => {
          setAuthPage("login");
          setAuthFeedback("");
        }}
        onDownloadApp={handleDesktopDownload}
        downloadLoading={downloadState.loading}
        downloadFeedback={downloadState.feedback}
        loading={authLoading}
        feedback={authFeedback}
      />
    );
  }

  return <InvoiceStudio key={authUser.id} authUser={authUser} onLogout={handleLogout} />;
}
