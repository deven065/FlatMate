import { useState } from "react";
import { ref as dbRef, push } from "firebase/database";
import { ref as stRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../../firebase";
import { useToast } from "../Toast/useToast";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function NoticeUploadModal({ open, onClose }) {
  const { push: toast } = useToast();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [expiry, setExpiry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [task, setTask] = useState(null);
  const [etaSeconds, setEtaSeconds] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [autoResumed, setAutoResumed] = useState(false);
  const stallRef = { timerId: null };

  const formatETA = (s) => {
    if (!Number.isFinite(s) || s <= 0) return "--";
    const m = Math.floor(s / 60);
    const sec = Math.max(0, Math.round(s - m * 60));
    if (m <= 0) return `${sec}s left`;
    return `${m}m ${sec}s left`;
  };

  const todayISO = new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);

  if (!open) return null;

  const submit = async () => {
    if (!title.trim()) {
      toast({ type: "error", title: "Enter title" });
      return;
    }
    if (!file) {
      toast({ type: "error", title: "Choose a file" });
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast({ type: "error", title: "File too large", description: "Max size is 5 MB" });
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ type: "error", title: "Unsupported file type" });
      return;
    }
    if (expiry) {
      const d = new Date(expiry);
      const startOfToday = new Date(todayISO);
      if (!isNaN(d) && d < startOfToday) {
        toast({ type: 'error', title: 'Expiry cannot be in the past' });
        return;
      }
    }

    setSubmitting(true);
    setProgress(0);
    setEtaSeconds(null);
    setErrorMsg("");
    try {
      const name = `${Date.now()}_${file.name}`;
      const path = `notices/${name}`;
      const storageRef = stRef(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });
      setTask(uploadTask);
  const start = Date.now();
      const url = await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            setProgress(pct);
            const elapsed = (Date.now() - start) / 1000;
            const speed = snap.bytesTransferred / Math.max(1, elapsed); // bytes/sec
            const remaining = Math.max(0, snap.totalBytes - snap.bytesTransferred);
            const eta = speed > 0 ? remaining / speed : null;
            setEtaSeconds(eta);
          },
          (err) => reject(err),
          async () => {
            try {
              // add a timeout guard for getDownloadURL
              const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Timed out finalizing upload')), 15000));
              const urlP = getDownloadURL(uploadTask.snapshot.ref);
              const u = await Promise.race([urlP, timeout]);
              resolve(u);
            } catch (e) {
              reject(e);
            }
          }
        );

        // Stall watchdog: if still at 0% after 10s, try a one-time resume; if still 0% at 15s, abort
        let checks = 0;
        stallRef.timerId = setInterval(() => {
          checks += 1;
          const current = uploadTask.snapshot?.bytesTransferred || 0;
          if (current > 0) {
            clearInterval(stallRef.timerId);
            stallRef.timerId = null;
            return;
          }
          if (checks === 4 && uploadTask.snapshot?.state === 'running' && !autoResumed) {
            // after ~12s (3s*4), attempt resume once
            try { uploadTask.resume?.(); setAutoResumed(true); } catch { /* ignore */ }
          }
          if (checks >= 5) { // ~15s
            try { uploadTask.cancel?.(); } catch { /* ignore */ }
            clearInterval(stallRef.timerId);
            stallRef.timerId = null;
            reject(new Error('Upload stalled at 0%. Check network or Firebase Storage rules.'));
          }
        }, 3000);
      });

      let expiryAt;
      if (expiry) {
        const d = new Date(expiry);
        if (!isNaN(d)) expiryAt = d.getTime();
      }

      const rec = {
        title,
        url,
        path,
        createdAt: Date.now(),
        uploadedBy: "admin",
        description: description || undefined,
        expiryAt,
      };
      await push(dbRef(db, "notices"), rec);
      toast({ type: "success", title: "Notice uploaded" });
      onClose?.();
      setTitle("");
      setFile(null);
      setDescription("");
      setExpiry("");
      setProgress(0);
      setTask(null);
      setEtaSeconds(null);
      if (stallRef.timerId) { clearInterval(stallRef.timerId); stallRef.timerId = null; }
    } catch (err) {
      const code = err?.code || '';
      const msg = code.includes('unauthorized') ? 'Permission denied. Check Firebase Storage rules.'
        : code.includes('canceled') ? 'Upload canceled.'
        : err.message;
      setErrorMsg(msg || 'Upload failed');
      toast({ type: "error", title: "Upload failed", description: msg });
      try {
        await push(dbRef(db, 'logs/uploadErrors'), {
          createdAt: Date.now(),
          code: err?.code || null,
          message: err?.message || String(err),
          fileName: file?.name || null,
          fileType: file?.type || null,
          fileSize: file?.size || null,
          uploaderUid: auth?.currentUser?.uid || null,
        });
      } catch { /* ignore log errors */ }
    } finally {
      setSubmitting(false);
      if (stallRef.timerId) { clearInterval(stallRef.timerId); stallRef.timerId = null; }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={submitting ? undefined : onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="upload-notice-title"
    >
      <div
        className="w-full max-w-md rounded-xl shadow-xl bg-white dark:bg-[#111827] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="upload-notice-title" className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold">Upload Notice</div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Title</label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-3 py-2 text-sm outline-none"
              placeholder="e.g., Water shutdown on 18th"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Description (optional)</label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-3 py-2 text-sm min-h-[72px] outline-none"
              placeholder="Short details for residents"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Expiry (optional)</label>
            <input
              type="date"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-3 py-2 text-sm outline-none"
              value={expiry}
              min={todayISO}
              onChange={(e) => setExpiry(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">File</label>
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-3 py-2 text-sm outline-none file:mr-3 file:rounded file:border-0 file:bg-gray-100 dark:file:bg-gray-700 file:px-3 file:py-1.5"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                if (f && f.type.startsWith('image/')) {
                  const url = URL.createObjectURL(f);
                  setPreviewUrl(url);
                } else {
                  setPreviewUrl("");
                }
              }}
            />
            <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Accepted: PDF, PNG, JPG, WEBP, DOC, DOCX. Max 5 MB.</div>
            {file && (
              <div className="mt-2 flex items-center gap-3">
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" className="w-12 h-12 object-cover rounded border border-gray-200 dark:border-gray-700" />
                ) : (
                  <div className="w-12 h-12 rounded border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-500">{file.type.split('/')[1] || 'file'}</div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate" title={file.name}>{file.name}</div>
                  <div className="text-[11px] text-gray-500">{(file.size/1024/1024).toFixed(2)} MB</div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
          {submitting && (
            <div className="w-full">
              <div className="flex items-center justify-between text-xs mb-1 text-gray-600 dark:text-gray-300">
                <span>Uploading… {etaSeconds != null ? `• ${formatETA(etaSeconds)}` : ''}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div className="h-2 bg-blue-600" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {errorMsg && (
            <div className="text-xs text-red-600 dark:text-red-400">{errorMsg}</div>
          )}
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-2 rounded-md text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={submitting ? () => { try { task?.cancel(); } catch {/* ignore */} } : onClose}
            >
              {submitting ? 'Cancel upload' : 'Cancel'}
            </button>
            <button
              className="px-3 py-2 rounded-md text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? 'Uploading…' : (errorMsg ? 'Retry' : 'Upload')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
