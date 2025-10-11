import { useEffect, useState } from "react";
import { ref, update, push, onValue } from "firebase/database";
import { db } from "../../firebase";
import { useToast } from "../Toast/useToast";

const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
};

const modalStyle = {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    overflow: "hidden",
};

const headerStyle = {
    padding: "12px 16px",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: 700,
};

const bodyStyle = {
    padding: 16,
};

const rowStyle = { display: "flex", gap: 8, marginBottom: 12 };

const inputStyle = {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
};

const footerStyle = {
    padding: 16,
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    borderTop: "1px solid #e5e7eb",
};

const btnBase = {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid transparent",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
};

const btnPrimary = {
    ...btnBase,
    background: "#2563eb",
    color: "#fff",
};

const btnSecondary = {
    ...btnBase,
    background: "#f1f5f9",
    color: "#0f172a",
};

function genReceiptId() {
  return `#${Math.floor(100000 + Math.random() * 900000)}`;
}

export default function PayModal({ open, onClose, uid, profile, dues = 0, onSuccess }) {
    const { push: pushToast } = useToast();
    const [amount, setAmount] = useState(dues ? String(dues) : "");
    const [method, setMethod] = useState("UPI");
    const [submitting, setSubmitting] = useState(false);
    const [config, setConfig] = useState(null);

    // read maintenance config
    useEffect(() => {
        const off = onValue(ref(db, 'config/maintenance'), (snap) => setConfig(snap.val() || null));
        return () => off();
    }, []);

    // derive allowance if late fee applies this period
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const period = `${yyyy}-${mm}`;
    // prefer ISO date if present
    let dueDay = Number(config?.dueDate);
    if (config?.dueDateISO) {
        const d = new Date(config.dueDateISO);
        if (!isNaN(d)) dueDay = d.getDate();
    }
    const isLateNow = Number.isFinite(dueDay) && dueDay >= 1 && dueDay <= 31 ? today.getDate() > dueDay : false;
    const cfgLateFee = Number(config?.lateFee || 0);
    const shouldAddLateNow = isLateNow && cfgLateFee > 0 && Number(dues) > 0 && profile?.lateFeeAssessedOn !== period;
    const allowedMax = Number(dues) + (shouldAddLateNow ? cfgLateFee : 0);

    if (!open) return null;

    const handleSubmit = async () => {
        const amt = parseFloat(amount);
        if (!Number.isFinite(amt) || amt <= 0) {
        pushToast({ type: "error", title: "Enter a valid amount" });
        return;
    }

    if (amt > allowedMax) {
        pushToast({ type: "error", title: "Amount exceeds due", description: `Max payable is ₹${Number(allowedMax).toFixed(2)}` });
        return;
    }

    if (!uid || !profile?.email) {
        pushToast({ type: "error", title: "Missing user info" });
        return;
    }

    setSubmitting(true);
    try {
        // compute if late fee applies (only once per month period)
    const isLate = isLateNow;
    const shouldAddLate = shouldAddLateNow;

    // allocate payment to dues first, then to late fee (if assessed this transaction)
    let remaining = amt;
    const currentDues = Number(dues);
    const afterDues = Math.max(0, currentDues - remaining);
    remaining = Math.max(0, remaining - currentDues);
    const feeAssessed = shouldAddLate ? cfgLateFee : 0;
    const feeRemaining = Math.max(0, feeAssessed - remaining);

    const newPaid = Number(profile?.paid || 0) + amt;
    const newDues = afterDues + feeRemaining;

    const updates = { dues: newDues, paid: newPaid };
    if (shouldAddLate) updates.lateFeeAssessedOn = period;
        // update user dues/paid (+ mark late fee assessed for this period)
        await update(ref(db, `users/${uid}`), updates);

        const record = {
            member: profile?.fullName || profile?.name || "Member",
            flat: profile?.flatNumber || profile?.flat || "",
            email: profile.email,
            amount: amt,
            lateFeeAddedToDues: shouldAddLate ? cfgLateFee : 0,
            wasLatePayment: isLate,
            date: new Date().toISOString().split("T")[0],
            receipt: genReceiptId(),
            method,
            createdAt: Date.now(),
        };
        await push(ref(db, "recentPayments"), record);

    pushToast({ type: "success", title: "Payment successful", description: `Paid ₹${amt.toFixed(2)}${shouldAddLate ? ` • Late fee of ₹${cfgLateFee.toFixed(2)} added to dues` : ''}` });
        onSuccess?.(record);
        onClose?.();
        } catch (err) {
        pushToast({ type: "error", title: "Payment failed", description: err.message });
        } finally {
        setSubmitting(false);
        }
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={headerStyle}>Pay maintenance</div>
            <div style={bodyStyle}>
            <div style={{ marginBottom: 8, color: "#475569" }}>
                Due: <strong>₹{Number(dues).toFixed(2)}</strong>
            </div>
                        {shouldAddLateNow && (
                            <div style={{ marginBottom: 8, fontSize: 12, color: '#b45309', background:'#fffbeb', border:'1px solid #f59e0b', padding:'8px 10px', borderRadius:8 }}>
                                A late fee of ₹{cfgLateFee.toFixed(2)} will be added this period. Max payable: ₹{Number(allowedMax).toFixed(2)}
                            </div>
                        )}
            <div style={rowStyle}>
                <input
                style={inputStyle}
                type="number"
                min={0}
                max={allowedMax || undefined}
                step="0.01"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                />
            </div>
            <div style={rowStyle}>
                <select style={inputStyle} value={method} onChange={(e) => setMethod(e.target.value)}>
                <option>UPI</option>
                <option>Card</option>
                <option>Cash</option>
                </select>
            </div>
            </div>
            <div style={footerStyle}>
            <button style={btnSecondary} onClick={onClose} disabled={submitting}>Cancel</button>
            <button style={btnPrimary} onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Processing…" : "Pay now"}
            </button>
            </div>
        </div>
        </div>
    );
}
