import { useEffect, useState } from "react";
import { ref as dbRef, onValue, remove } from "firebase/database";
import { ref as stRef, deleteObject } from "firebase/storage";
import { db, storage } from "../../firebase";
import { useToast } from "../Toast/useToast";
import { FaTrashAlt, FaCloudDownloadAlt, FaBullhorn } from "react-icons/fa";

export default function NoticesManager() {
  const { push } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    const r = dbRef(db, "notices");
    const off = onValue(r, (snap) => {
      const v = snap.val() || {};
      const list = Object.entries(v).map(([id, n]) => ({ id, ...n }))
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      setItems(list);
      setLoading(false);
    });
    return () => off();
  }, []);

  const onDelete = async (it) => {
    try {
      // remove DB first
      await remove(dbRef(db, `notices/${it.id}`));
      // then try Storage (if path exists)
      if (it.path) {
        try { await deleteObject(stRef(storage, it.path)); } catch { /* ignore */ }
      }
      push({ type: 'success', title: 'Notice deleted' });
    } catch (err) {
      push({ type: 'error', title: 'Delete failed', description: err.message });
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-[#101828] p-4 rounded-lg shadow-md w-full max-w-xs">
      <h2 className="text-gray-800 dark:text-white font-semibold text-lg mb-3 flex items-center gap-2"><FaBullhorn /> Notices</h2>
      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-300">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-300">No notices uploaded yet.</div>
      ) : (
        <ul className="space-y-2 max-h-80 overflow-auto pr-1">
          {items.map((it) => (
            <li key={it.id} className="rounded-md border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between gap-3">
              <a href={it.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="font-medium text-sm truncate" title={it.title}>{it.title || 'Notice'}</div>
                  {it.expiryAt && Number(it.expiryAt) <= Date.now() && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-600 text-white shrink-0">Expired</span>
                  )}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{new Date(Number(it.createdAt || Date.now())).toLocaleString()}</div>
                {it.description && (<div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{it.description}</div>)}
                {it.expiryAt && (<div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">Expiry: {new Date(Number(it.expiryAt)).toLocaleDateString()}</div>)}
              </a>
              {confirmId === it.id ? (
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700" onClick={() => setConfirmId(null)}>Cancel</button>
                  <button className="px-2 py-1 text-xs rounded bg-red-600 text-white" onClick={() => onDelete(it)}>Delete</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <a href={it.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-500 hover:underline text-xs"><FaCloudDownloadAlt /> Open</a>
                  <button className="inline-flex items-center gap-1 text-red-500 hover:underline text-xs" onClick={() => setConfirmId(it.id)}><FaTrashAlt /> Delete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
