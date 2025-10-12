import { useState, useMemo } from "react";
import { ref as dbRef, push, onValue } from "firebase/database";
import { ref as stRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../../firebase";
import { useToast } from "../Toast/useToast";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function NoticeUploadModal({ open, onClose }) {
  const { push: toast } = useToast();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [noticeDate, setNoticeDate] = useState("");
  const [audience, setAudience] = useState("all"); // all | owners | tenants
  const [allFlats, setAllFlats] = useState([]);
  const [flatQuery, setFlatQuery] = useState("");
  const [selectedFlats, setSelectedFlats] = useState([]); // array of flat numbers
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [task, setTask] = useState(null);
  const [etaSeconds, setEtaSeconds] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [autoResumed, setAutoResumed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const stallRef = { timerId: null };

  const formatETA = (s) => {
    if (!Number.isFinite(s) || s <= 0) return "--";
    const m = Math.floor(s / 60);
    const sec = Math.max(0, Math.round(s - m * 60));
    if (m <= 0) return `${sec}s left`;
    return `${m}m ${sec}s left`;
  };

  const todayISO = useMemo(() => new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10), []);
  // initialize default date once
  if (!noticeDate) setNoticeDate(todayISO);

  // Load list of flats for selection when modal is open
  if (open && allFlats.length === 0) {
    try {
      const usersRef = dbRef(db, 'users');
      onValue(usersRef, (snap) => {
        const val = snap.val() || {};
        const flats = Object.values(val)
          .filter((u) => (u?.role || 'member') === 'member')
          .map((u) => String(u.flatNumber || '').trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
        const unique = Array.from(new Set(flats));
        setAllFlats(unique);
      }, { onlyOnce: true });
    } catch {/* ignore */}
  }

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
    // Ensure notice date is valid
    if (noticeDate) {
      const nd = new Date(noticeDate);
      if (isNaN(nd)) {
        toast({ type: 'error', title: 'Invalid notice date' });
        return;
      }
    }
    if (audience === 'flats' && selectedFlats.length === 0) {
      toast({ type: 'error', title: 'Select at least one flat' });
      return;
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

      const rec = {
        title,
        url,
        path,
        createdAt: Date.now(),
        uploadedBy: "admin",
        description: description || undefined,
        noticeDate: noticeDate ? new Date(noticeDate).getTime() : undefined,
        audience,
        targetFlats: audience === 'flats' ? selectedFlats : undefined,
        urgent: urgent || undefined,
        important: important || undefined,
      };
      await push(dbRef(db, "notices"), rec);
      toast({ type: "success", title: "Notice uploaded" });
      onClose?.();
      setTitle("");
      setFile(null);
      setDescription("");
      setNoticeDate(todayISO);
      setAudience("all");
  setSelectedFlats([]);
      setUrgent(false);
      setImportant(false);
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
            <label className="block text-xs font-semibold text-gray-400 mb-1">Notice Title</label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-3 py-2 text-sm outline-none"
              placeholder="Enter notice title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Description</label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-3 py-2 text-sm min-h-[72px] outline-none"
              placeholder="Enter notice description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Notice Date</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-3 py-2 text-sm outline-none"
                value={noticeDate}
                onChange={(e) => setNoticeDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Target Audience</label>
              <select
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f172a] px-3 py-2 text-sm outline-none"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              >
                <option value="all">All Members</option>
                <option value="flats">Specific Flats…</option>
              </select>
            </div>
          </div>
          {audience === 'flats' && (
            <div className="rounded-md border border-gray-300 dark:border-gray-600 p-3 bg-white dark:bg-[#0f172a]">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={flatQuery}
                  onChange={(e) => setFlatQuery(e.target.value)}
                  placeholder="Search flat (e.g., A-101)"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800"
                  onClick={() => setSelectedFlats(allFlats)}
                >Select All</button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800"
                  onClick={() => setSelectedFlats([])}
                >Clear</button>
              </div>
              <div className="max-h-40 overflow-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allFlats
                  .filter((f) => !flatQuery || f.toLowerCase().includes(flatQuery.toLowerCase()))
                  .map((f) => {
                    const checked = selectedFlats.includes(f);
                    return (
                      <label key={f} className={`flex items-center gap-2 text-sm px-2 py-1 rounded cursor-pointer ${checked ? 'bg-blue-600/10' : 'bg-transparent'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedFlats((prev) => Array.from(new Set([...prev, f])));
                            else setSelectedFlats((prev) => prev.filter((x) => x !== f));
                          }}
                        />
                        <span>{f}</span>
                      </label>
                    );
                  })}
              </div>
              {selectedFlats.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedFlats.map((f) => (
                    <span key={f} className="text-xs px-2 py-1 rounded-full border border-gray-300 dark:border-gray-600">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Upload Document</label>
            <div
              className={`rounded-md border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${isDragOver ? 'border-blue-500 bg-blue-500/5' : 'border-gray-300 dark:border-gray-600'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) {
                  setFile(f);
                  // no preview for docs
                }
              }}
              onClick={() => document.getElementById('notice-file-input')?.click()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mx-auto mb-2 h-7 w-7 text-gray-400">
                <path d="M7 16a4 4 0 1 1 4-4h2a6 6 0 1 0-6 6h10a5 5 0 1 0-1-9.8v2.07A3 3 0 1 1 17 16H7z"/>
              </svg>
              <div className="text-sm">
                <span className="text-blue-400">Upload a file</span> or drag and drop
              </div>
              <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">PDF, DOC, DOCX up to 10MB</div>
              <input
                id="notice-file-input"
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  // no preview for docs
                }}
              />
            </div>
            {file && (
              <div className="mt-2 flex items-center gap-3">
                <div className="w-12 h-12 rounded border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-500">
                  {(file.type?.split('/')[1] || 'file').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate" title={file.name}>{file.name}</div>
                  <div className="text-[11px] text-gray-500">{(file.size/1024/1024).toFixed(2)} MB</div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
              <span>Mark as Urgent</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" checked={important} onChange={(e) => setImportant(e.target.checked)} />
              <span>Mark as Important</span>
            </label>
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
              className="px-3 py-2 rounded-md text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 inline-flex items-center gap-2"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? 'Uploading…' : (errorMsg ? 'Retry' : 'Upload Notice')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
