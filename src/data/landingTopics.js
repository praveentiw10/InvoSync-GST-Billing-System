function buildTopic({
  category,
  title,
  summary,
  metrics,
  pillars,
  execution,
  governance,
  related
}) {
  return {
    category,
    title,
    summary,
    metrics,
    sections: [
      {
        heading: "Operating Model",
        paragraphs: [
          `${title} is designed around repeatable workflows so teams can execute billing operations without fragile manual steps.`,
          "The objective is to keep daily execution fast while preserving documentation quality and operational confidence."
        ],
        bullets: pillars
      },
      {
        heading: "Execution Plan",
        paragraphs: [
          "Each team should implement this capability in phases, starting with baseline workflow reliability and then expanding to optimization.",
          "A phased model lowers rollout risk and gives finance, operations, and support teams enough time to align on ownership."
        ],
        bullets: execution
      },
      {
        heading: "Governance and Scale",
        paragraphs: [
          "Long-term value comes from consistent standards, measurable quality checks, and clear release discipline.",
          "Governance practices keep this area stable as invoice volume, customer complexity, and compliance requirements increase."
        ],
        bullets: governance
      }
    ],
    related
  };
}

export const landingTopicPages = {
  product_overview: buildTopic({
    category: "Product",
    title: "InvoiceGen Product Overview",
    summary:
      "InvoiceGen combines invoice creation, template control, payment tracking, and export reliability in one operational workspace.",
    metrics: [
      { value: "1", label: "unified billing workspace" },
      { value: "A4", label: "stable export standard" },
      { value: "Fast", label: "daily execution cycle" }
    ],
    pillars: [
      "Centralized invoice builder and live preview",
      "Template-driven branded output",
      "Tax-ready field coverage",
      "Operational continuity across workflows"
    ],
    execution: [
      "Standardize invoice format and profile defaults",
      "Define template usage by invoice type",
      "Establish export verification checkpoints",
      "Align support and finance handoffs"
    ],
    governance: [
      "Monthly quality reviews on invoice output",
      "Error and correction tracking",
      "Process ownership by team function",
      "Release-readiness checklist"
    ],
    related: [
      { key: "payments", label: "Payments" },
      { key: "subscriptions", label: "Subscriptions" },
      { key: "tax_invoicing", label: "Tax Invoicing" }
    ]
  }),

  use_cases_overview: buildTopic({
    category: "Use Cases",
    title: "Use Cases Overview",
    summary:
      "InvoiceGen supports digital-first businesses that need reliable invoicing for subscriptions, software sales, and online products.",
    metrics: [
      { value: "3", label: "core digital business models" },
      { value: "High", label: "invoice consistency" },
      { value: "Lower", label: "manual billing overhead" }
    ],
    pillars: [
      "SaaS and AI recurring billing workflows",
      "Software licensing and renewal support",
      "Digital product invoicing for fast cycles",
      "Cross-team finance and support alignment"
    ],
    execution: [
      "Map use case specific invoice fields",
      "Create template rules by segment",
      "Define payment follow-up cadence",
      "Track performance by segment KPIs"
    ],
    governance: [
      "Quarterly use-case performance review",
      "Template drift prevention checks",
      "Support ticket pattern audits",
      "Escalation paths for payment disputes"
    ],
    related: [
      { key: "saas_ai", label: "SaaS and AI" },
      { key: "software_sales", label: "Software" },
      { key: "digital_goods", label: "Digital Goods" }
    ]
  }),

  developer_hub: buildTopic({
    category: "Developers",
    title: "Developer Hub",
    summary:
      "Developer workflows focus on clean integration, offline-safe behavior, and stable PDF export pipelines for production usage.",
    metrics: [
      { value: "3", label: "core reliability domains" },
      { value: "Offline", label: "queue-first behavior" },
      { value: "Stable", label: "export rendering path" }
    ],
    pillars: [
      "Predictable invoice data model",
      "Offline runtime and queue handling",
      "Controlled render-to-PDF flow",
      "Operational visibility for incidents"
    ],
    execution: [
      "Adopt invoice payload schema and validation",
      "Enable queue and retry status surfaces",
      "Verify template-aware export outcomes",
      "Add monitoring checkpoints by workflow stage"
    ],
    governance: [
      "Integration contract version tracking",
      "Retry failure and queue depth review",
      "PDF regression checks by template",
      "Release impact and rollback playbook"
    ],
    related: [
      { key: "integration", label: "Integration" },
      { key: "offline_runtime", label: "Offline Runtime" },
      { key: "pdf_pipeline", label: "PDF Pipeline" }
    ]
  }),

  resources_center: buildTopic({
    category: "Resources",
    title: "Resources Center",
    summary:
      "Use operational guides, support playbooks, and release communication to keep invoice workflows stable as teams scale.",
    metrics: [
      { value: "3", label: "resource tracks" },
      { value: "Stepwise", label: "implementation guidance" },
      { value: "Ongoing", label: "release clarity" }
    ],
    pillars: [
      "Support playbooks for recurring issues",
      "Implementation guides by team function",
      "Release updates with impact summaries",
      "Operational checklist templates"
    ],
    execution: [
      "Define support triage by workflow stage",
      "Onboard teams with role-specific guides",
      "Review release updates before rollout",
      "Capture and prioritize recurring friction points"
    ],
    governance: [
      "Support resolution quality scoring",
      "Guide adoption health checks",
      "Release communication audit trail",
      "Post-release verification reports"
    ],
    related: [
      { key: "support_center", label: "Support" },
      { key: "implementation_guides", label: "Guides" },
      { key: "release_updates", label: "Release Updates" }
    ]
  }),

  payments: buildTopic({
    category: "Product",
    title: "Payments",
    summary:
      "Improve collection workflows with cleaner payment status tracking, better invoice context, and lower follow-up ambiguity.",
    metrics: [
      { value: "Real-time", label: "status visibility" },
      { value: "Clear", label: "collection ownership" },
      { value: "Lower", label: "reconciliation effort" }
    ],
    pillars: [
      "Paid, unpaid, and partial state tracking",
      "Payment mode and reference visibility",
      "Balance due monitoring per invoice",
      "Cleaner follow-up context for teams"
    ],
    execution: [
      "Define payment state transitions",
      "Standardize follow-up templates",
      "Review overdue and partial buckets weekly",
      "Align finance and support escalation rules"
    ],
    governance: [
      "Collection aging report audits",
      "Reference completeness checks",
      "Dispute cause classification",
      "Performance review for reminder workflows"
    ],
    related: [
      { key: "subscriptions", label: "Subscriptions" },
      { key: "tax_invoicing", label: "Tax Invoicing" },
      { key: "support_center", label: "Support" }
    ]
  }),

  subscriptions: buildTopic({
    category: "Product",
    title: "Subscriptions",
    summary:
      "Run recurring revenue operations with predictable invoicing, structured renewal cycles, and stronger month-end reporting inputs.",
    metrics: [
      { value: "Recurring", label: "invoice cycle support" },
      { value: "Fast", label: "renewal processing" },
      { value: "Reliable", label: "reporting inputs" }
    ],
    pillars: [
      "Recurring billing readiness",
      "Renewal-friendly invoice structure",
      "Subscription line-item clarity",
      "Payment-state alignment across teams"
    ],
    execution: [
      "Build subscription invoice templates",
      "Set renewal preparation checkpoints",
      "Validate payment and due-date logic",
      "Create monthly close workflow for renewals"
    ],
    governance: [
      "Renewal accuracy reviews",
      "Template consistency by plan type",
      "Revenue recognition coordination",
      "Customer communication quality checks"
    ],
    related: [
      { key: "payments", label: "Payments" },
      { key: "saas_ai", label: "SaaS and AI" },
      { key: "implementation_guides", label: "Guides" }
    ]
  }),

  tax_invoicing: buildTopic({
    category: "Product",
    title: "Tax Invoicing",
    summary:
      "Maintain GST-ready invoice quality with complete tax fields, consistent totals, and export output suitable for audits and reviews.",
    metrics: [
      { value: "GST", label: "structured tax fields" },
      { value: "Clear", label: "tax breakdown visibility" },
      { value: "Audit", label: "ready documentation" }
    ],
    pillars: [
      "CGST, SGST, and IGST coverage",
      "Buyer and consignee tax detail support",
      "Declaration and terms sections",
      "Professional, readable tax presentation"
    ],
    execution: [
      "Set tax mode defaults and validation",
      "Define line item and HSN entry standards",
      "Verify tax summaries before export",
      "Audit sample invoices each billing period"
    ],
    governance: [
      "Tax field completeness monitoring",
      "Template compliance checks",
      "Exception handling for corrections",
      "Quarterly audit-readiness review"
    ],
    related: [
      { key: "payments", label: "Payments" },
      { key: "pdf_pipeline", label: "PDF Pipeline" },
      { key: "support_center", label: "Support" }
    ]
  }),

  saas_ai: buildTopic({
    category: "Solutions",
    title: "SaaS and AI",
    summary:
      "Support product-led and sales-led recurring business models with invoice operations built for high cadence and rapid growth.",
    metrics: [
      { value: "High", label: "billing cadence support" },
      { value: "Clear", label: "customer invoice communication" },
      { value: "Scalable", label: "operations model" }
    ],
    pillars: [
      "Recurring invoice readiness for SaaS plans",
      "AI service and subscription mix support",
      "Better collection coordination",
      "Consistent customer-facing output"
    ],
    execution: [
      "Segment templates by revenue model",
      "Define billing cycle checkpoints",
      "Align support scripts to invoice states",
      "Track payment patterns by cohort"
    ],
    governance: [
      "Monthly pipeline performance reviews",
      "Template quality across plan tiers",
      "Issue resolution turnaround metrics",
      "Cross-functional billing governance cadence"
    ],
    related: [
      { key: "subscriptions", label: "Subscriptions" },
      { key: "software_sales", label: "Software" },
      { key: "integration", label: "Integration" }
    ]
  }),

  software_sales: buildTopic({
    category: "Solutions",
    title: "Software",
    summary:
      "Manage software license sales, renewals, and add-on billing with structured invoices and enterprise-ready output standards.",
    metrics: [
      { value: "License", label: "focused workflows" },
      { value: "Renewal", label: "cycle management" },
      { value: "Enterprise", label: "document quality" }
    ],
    pillars: [
      "License and extension line-item support",
      "Renewal cycle visibility",
      "Procurement-friendly document structure",
      "Payment-state traceability"
    ],
    execution: [
      "Map SKU and license terms into templates",
      "Build renewal reminder process",
      "Create QA checks for enterprise invoices",
      "Align tax and payment data ownership"
    ],
    governance: [
      "Renewal dispute tracking",
      "Document quality audits",
      "High-value account checklist",
      "Monthly process improvement cycle"
    ],
    related: [
      { key: "digital_goods", label: "Digital Goods" },
      { key: "tax_invoicing", label: "Tax Invoicing" },
      { key: "pdf_pipeline", label: "PDF Pipeline" }
    ]
  }),

  digital_goods: buildTopic({
    category: "Solutions",
    title: "Digital Goods",
    summary:
      "Give creator and digital commerce teams a faster billing workflow while preserving professional invoice quality and tax readiness.",
    metrics: [
      { value: "Fast", label: "invoice generation" },
      { value: "Creator", label: "friendly operations" },
      { value: "Reliable", label: "export quality" }
    ],
    pillars: [
      "Quick invoice generation for online sales",
      "Clear customer-facing line item details",
      "Payment and reference context for support",
      "Consistent branded output"
    ],
    execution: [
      "Standardize product category templates",
      "Define support workflow for corrections",
      "Validate payment-state capture discipline",
      "Review export quality before campaigns"
    ],
    governance: [
      "Weekly refund and correction analysis",
      "Template drift prevention checks",
      "Support SLA tracking by issue type",
      "Performance review by campaign period"
    ],
    related: [
      { key: "software_sales", label: "Software" },
      { key: "payments", label: "Payments" },
      { key: "support_center", label: "Support" }
    ]
  }),

  integration: buildTopic({
    category: "Developers",
    title: "Integration",
    summary:
      "Adopt InvoiceGen in phases with a predictable data model, controlled rollout checkpoints, and safer operational behavior.",
    metrics: [
      { value: "Phased", label: "adoption path" },
      { value: "Predictable", label: "data contracts" },
      { value: "Lower", label: "rollout risk" }
    ],
    pillars: [
      "Stable invoice schema and metadata",
      "Template-aware routing logic",
      "Queue-compatible delivery flow",
      "Clear ownership by integration stage"
    ],
    execution: [
      "Start with draft and save workflows",
      "Add export and delivery integration",
      "Introduce monitoring and failure alerts",
      "Complete rollout with support playbooks"
    ],
    governance: [
      "Contract compatibility tracking",
      "Failure-mode review by workflow",
      "Template regression watchlist",
      "Change management sign-off process"
    ],
    related: [
      { key: "offline_runtime", label: "Offline Runtime" },
      { key: "pdf_pipeline", label: "PDF Pipeline" },
      { key: "implementation_guides", label: "Guides" }
    ]
  }),

  offline_runtime: buildTopic({
    category: "Developers",
    title: "Offline Runtime",
    summary:
      "Protect critical invoice operations during network drops with queue-first processing and predictable retry behavior.",
    metrics: [
      { value: "Queue", label: "first reliability model" },
      { value: "Auto", label: "retry support" },
      { value: "Resilient", label: "user workflow continuity" }
    ],
    pillars: [
      "Action queue for delayed network operations",
      "User-visible queue status surfaces",
      "Automatic retry with safe state handling",
      "Graceful online recovery"
    ],
    execution: [
      "Define queue entry and exit conditions",
      "Build retry timing and backoff policy",
      "Expose queue metrics in UI",
      "Create recovery and escalation runbooks"
    ],
    governance: [
      "Queue depth and retry success monitoring",
      "Offline incident retrospective process",
      "Support response standardization",
      "Performance budget for offline paths"
    ],
    related: [
      { key: "integration", label: "Integration" },
      { key: "support_center", label: "Support" },
      { key: "release_updates", label: "Release Updates" }
    ]
  }),

  pdf_pipeline: buildTopic({
    category: "Developers",
    title: "PDF Pipeline",
    summary:
      "Keep invoice exports consistent across templates and sharing channels with a controlled rendering pipeline tuned for A4 output.",
    metrics: [
      { value: "A4", label: "layout consistency" },
      { value: "Template", label: "aware rendering" },
      { value: "Stable", label: "download output" }
    ],
    pillars: [
      "Controlled render dimensions and scaling",
      "Template-specific preview rendering",
      "Consistent typography and table readability",
      "Business-ready export quality"
    ],
    execution: [
      "Validate preview and export parity",
      "Run template-level regression checks",
      "Test export readability for long invoices",
      "Define fallback behavior for edge cases"
    ],
    governance: [
      "Export quality scorecard",
      "Template regression alerting",
      "Support escalation for format issues",
      "Release gate for PDF-impacting changes"
    ],
    related: [
      { key: "integration", label: "Integration" },
      { key: "tax_invoicing", label: "Tax Invoicing" },
      { key: "developer_hub", label: "Developer Hub" }
    ]
  }),

  support_center: buildTopic({
    category: "Help",
    title: "Support",
    summary:
      "Resolve billing and invoice issues faster with structured triage, repeatable playbooks, and workflow-specific diagnostics.",
    metrics: [
      { value: "Faster", label: "triage time" },
      { value: "Repeatable", label: "resolution path" },
      { value: "Lower", label: "case escalation noise" }
    ],
    pillars: [
      "Issue triage by workflow stage",
      "Playbook-based troubleshooting",
      "Queue and export diagnosis patterns",
      "Clear escalation ownership"
    ],
    execution: [
      "Create issue taxonomy by workflow",
      "Document first-response checklists",
      "Set escalation thresholds and routing",
      "Review top issue clusters weekly"
    ],
    governance: [
      "Support quality score monitoring",
      "Case turnaround SLA checks",
      "Customer feedback loop integration",
      "Continuous improvement sprint inputs"
    ],
    related: [
      { key: "implementation_guides", label: "Guides" },
      { key: "release_updates", label: "Release Updates" },
      { key: "resources_center", label: "Resources" }
    ]
  }),

  implementation_guides: buildTopic({
    category: "Help",
    title: "Guides",
    summary:
      "Use implementation guides to deploy InvoiceGen cleanly across teams while keeping operations understandable and maintainable.",
    metrics: [
      { value: "Stepwise", label: "deployment model" },
      { value: "Cross-team", label: "ownership alignment" },
      { value: "Lower", label: "onboarding delay" }
    ],
    pillars: [
      "Role-based onboarding tracks",
      "Template setup and validation guidance",
      "Export and delivery verification checklists",
      "Support handoff instructions"
    ],
    execution: [
      "Run initial setup workshop",
      "Assign owners for each workflow stage",
      "Validate core paths with dry runs",
      "Document local standards and exceptions"
    ],
    governance: [
      "Guide adoption and usage reporting",
      "Checklist completion audits",
      "Rollback and recovery preparedness",
      "Quarterly guide refresh cycle"
    ],
    related: [
      { key: "integration", label: "Integration" },
      { key: "support_center", label: "Support" },
      { key: "resources_center", label: "Resources" }
    ]
  }),

  release_updates: buildTopic({
    category: "Help",
    title: "Release Updates",
    summary:
      "Plan upgrades confidently with clear impact summaries, rollout guidance, and post-release verification checkpoints.",
    metrics: [
      { value: "Clear", label: "change communication" },
      { value: "Planned", label: "rollout discipline" },
      { value: "Lower", label: "upgrade risk" }
    ],
    pillars: [
      "Impact-first release notes",
      "Rollout sequencing guidance",
      "Post-release verification checklist",
      "Feedback and rollback readiness"
    ],
    execution: [
      "Review release scope by workflow",
      "Pilot with controlled user subset",
      "Expand after quality verification",
      "Capture follow-up actions for next cycle"
    ],
    governance: [
      "Release health dashboard review",
      "Regression and incident tracking",
      "Communication audit with stakeholders",
      "Continuous release process improvement"
    ],
    related: [
      { key: "resources_center", label: "Resources" },
      { key: "offline_runtime", label: "Offline Runtime" },
      { key: "support_center", label: "Support" }
    ]
  })
};

export const landingLinkTargets = {
  nav_product: "product_overview",
  nav_use_cases: "use_cases_overview",
  nav_developers: "developer_hub",
  nav_resources: "resources_center",

  resource_product_overview: "product_overview",
  resource_integration_notes: "integration",
  resource_support_resources: "support_center",

  footer_payments: "payments",
  footer_subscriptions: "subscriptions",
  footer_tax_invoicing: "tax_invoicing",

  footer_saas_ai: "saas_ai",
  footer_software: "software_sales",
  footer_digital_goods: "digital_goods",

  footer_integration: "integration",
  footer_offline_runtime: "offline_runtime",
  footer_pdf_pipeline: "pdf_pipeline",

  footer_support: "support_center",
  footer_guides: "implementation_guides",
  footer_release_updates: "release_updates"
};

export function getLandingTopic(topicKey) {
  return landingTopicPages[topicKey] || landingTopicPages.product_overview;
}
