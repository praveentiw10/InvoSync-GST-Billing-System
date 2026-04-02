# InvoSync — Smart GST Billing & Invoicing System

**InvoSync** is a professional, modern GST-ready billing and invoicing platform designed for Indian businesses. It allows digital product teams, SaaS businesses, and digital goods sellers to manage their entire billing workflow seamlessly, both online and offline.

---

### 🎓 Internship Project at MaMo Technolabs LLP
This project was developed during my professional internship time. It has been built and refined to be a production-ready billing solution.

---

## 🚀 Key Features

- **GST-Ready Invoices**: Create professional, branded GST-ready invoices with real-time PDF generation.
- **Multi-Currency Support**: Comprehensive support for INR, USD, and EUR billing.
- **Offline Invoicing**: Use the **Desktop App** (built with Electron) to carry out invoicing even when offline.
- **Tax Workflow Automation**: Built-in calculations for CGST, SGST, IGST, and sub-totals to reduce manual errors.
- **Payment Tracking**: Monitor paid, unpaid, and partial collections in a clean Dashboard view.
- **Supabase Integration**: Secure user authentication and workspace persistence powered by Supabase.
- **Google Drive Export**: Directly save and share generated invoices to your company's Google Drive.
- **Dashboard Metrics**: Real-time sales insights, received payments, and pending collection stats.

## 🛠️ Technology Stack

- **Frontend**: [React.js](https://reactjs.org/), [Vite](https://vitejs.dev/)
- **Backend/Server**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/)
- **Database/Auth**: [Supabase](https://supabase.com/)
- **Desktop Runtime**: [Electron](https://www.electronjs.org/)
- **Invoicing Utilities**: [jspdf](https://github.com/parallax/jsPDF), [html2canvas](https://html2canvas.hertzen.com/), [nodemailer](https://nodemailer.com/)
- **Deployment**: [Vercel](https://vercel.com/) (Web)

## 💻 Local Development

### 1. Prerequisite
- Node.js (v18 or higher)
- npm or yarn

### 2. Clone the repository
```bash
git clone https://github.com/praveentiw10/InvoSync-GST-Billing-System.git
cd InvoSync-GST-Billing-System
```

### 3. Install dependencies
```bash
npm install
```

### 4. Set up environment variables
Create a `.env` file from the example:
```bash
cp .env.example .env
```
Fill in your Supabase, SMTP, and Google Drive credentials.

### 5. Run the project
```bash
# To run the Web + Express server concurrently
npm run dev

# To run the Desktop version (Electron)
npm run dev:desktop
```

## 📄 License
This project is for demonstration and production use within the specified internship scope. Developed at **MaMo Technolabs LLP**.

---

### Developed By:
- **Project Link**: [InvoSync Dashboard](https://github.com/praveentiw10/InvoSync-GST-Billing-System)
- **Email**: [your-email@example.com] (Optional: Update this in the README)
