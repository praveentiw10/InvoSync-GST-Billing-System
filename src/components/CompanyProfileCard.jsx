export default function CompanyProfileCard({ companyProfile, onCompanyChange, onLogoUpload, onSignatureUpload, onReset }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Static Company Profile</p>
          <h2>Brand and bank details</h2>
        </div>
        <button className="ghost-button" type="button" onClick={onReset}>
          Restore defaults
        </button>
      </div>

      <div className="logo-editor">
        <img className="logo-preview" src={companyProfile.logo} alt={companyProfile.name} />
        <label className="field">
          <span>Upload logo</span>
          <input type="file" accept="image/*" onChange={onLogoUpload} />
        </label>
      </div>

      <div className="signature-editor">
        {companyProfile.signature ? (
          <img className="signature-preview" src={companyProfile.signature} alt={`${companyProfile.name} signature`} />
        ) : (
          <div className="signature-placeholder">No signature uploaded</div>
        )}
        <label className="field">
          <span>Upload signature</span>
          <input type="file" accept="image/*" onChange={onSignatureUpload} />
        </label>
      </div>

      <div className="field-grid">
        <label className="field">
          <span>Company name</span>
          <input value={companyProfile.name} onChange={(event) => onCompanyChange("name", event.target.value)} />
        </label>
        <label className="field">
          <span>Tagline</span>
          <input value={companyProfile.tagline} onChange={(event) => onCompanyChange("tagline", event.target.value)} />
        </label>
        <label className="field field-span-2">
          <span>Address line 1</span>
          <input value={companyProfile.addressLine1} onChange={(event) => onCompanyChange("addressLine1", event.target.value)} />
        </label>
        <label className="field field-span-2">
          <span>Address line 2</span>
          <input value={companyProfile.addressLine2} onChange={(event) => onCompanyChange("addressLine2", event.target.value)} />
        </label>
        <label className="field">
          <span>Email</span>
          <input value={companyProfile.email} onChange={(event) => onCompanyChange("email", event.target.value)} />
        </label>
        <label className="field">
          <span>Phone</span>
          <input value={companyProfile.phone} onChange={(event) => onCompanyChange("phone", event.target.value)} />
        </label>
        <label className="field">
          <span>GST</span>
          <input value={companyProfile.gst} onChange={(event) => onCompanyChange("gst", event.target.value)} />
        </label>
        <label className="field">
          <span>PAN</span>
          <input value={companyProfile.pan} onChange={(event) => onCompanyChange("pan", event.target.value)} />
        </label>
        <label className="field">
          <span>Account type</span>
          <input value={companyProfile.accountType} onChange={(event) => onCompanyChange("accountType", event.target.value)} />
        </label>
        <label className="field">
          <span>Bank name</span>
          <input value={companyProfile.bankName} onChange={(event) => onCompanyChange("bankName", event.target.value)} />
        </label>
        <label className="field">
          <span>Account no.</span>
          <input value={companyProfile.accountNumber} onChange={(event) => onCompanyChange("accountNumber", event.target.value)} />
        </label>
        <label className="field">
          <span>Branch</span>
          <input value={companyProfile.branch} onChange={(event) => onCompanyChange("branch", event.target.value)} />
        </label>
        <label className="field">
          <span>IFSC</span>
          <input value={companyProfile.ifsc} onChange={(event) => onCompanyChange("ifsc", event.target.value)} />
        </label>
        <label className="field">
          <span>QR image URL</span>
          <input value={companyProfile.qrCode} onChange={(event) => onCompanyChange("qrCode", event.target.value)} />
        </label>
      </div>
    </section>
  );
}
