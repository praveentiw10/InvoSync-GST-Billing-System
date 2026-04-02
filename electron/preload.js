import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("desktop", {
  sendInvoice: (payload) => ipcRenderer.invoke("send-invoice", payload),
  saveInvoiceToGoogleDrive: (payload) => ipcRenderer.invoke("save-invoice-to-drive", payload),
  downloadDesktopApp: () => ipcRenderer.invoke("download-desktop-app"),
  getEmailQueueStatus: () => ipcRenderer.invoke("get-email-queue-status"),
  processEmailQueue: () => ipcRenderer.invoke("process-email-queue"),
  onEmailQueueUpdated: (callback) => {
    if (typeof callback !== "function") {
      return () => {};
    }

    const listener = (_event, payload) => {
      callback(payload);
    };

    ipcRenderer.on("email-queue-updated", listener);
    return () => ipcRenderer.removeListener("email-queue-updated", listener);
  }
});
