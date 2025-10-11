import { Fragment, useEffect, useMemo, useState } from "react";
import { FaWallet, FaReceipt, FaUserCog, FaInfoCircle, FaDownload, FaCreditCard } from "react-icons/fa";
import { useToast } from "../Toast/useToast";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref, query, orderByChild, equalTo, limitToLast } from "firebase/database";
import PayModal from "./PayModal";
import { openReceiptPrintWindow } from "../../utils/receipt";

const MemberDashboard = () => {
    const { push: pushToast } = useToast();

    const [uid, setUid] = useState(null);
    const [profile, setProfile] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payOpen, setPayOpen] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) setUid(u.uid);
            else setUid(null);
        });
        return () => unsub();
    }, []);

    // Load user profile
    useEffect(() => {
        if (!uid) {
            setProfile(null);
            setPayments([]);
            setLoading(false);
            return;
        }
        const profileRef = ref(db, `users/${uid}`);
        const off = onValue(
            profileRef,
            (snap) => {
                const val = snap.val();
                setProfile(val || null);
                setLoading(false);
            },
            (err) => {
                pushToast({ type: "error", title: "Failed to load profile", description: err.message });
                setLoading(false);
            }
        );
        return () => off();
    }, [uid, pushToast]);

    // Load recent payments for this user's email
    useEffect(() => {
        if (!profile?.email) {
            setPayments([]);
            return;
        }
        const qp = query(
            ref(db, "recentPayments"),
            orderByChild("email"),
            equalTo(profile.email),
            limitToLast(10)
        );
        const off = onValue(
            qp,
            (snap) => {
                const val = snap.val() || {};
                const list = Object.entries(val)
                    .map(([id, p]) => ({ id, ...p }))
                    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
                setPayments(list);
            },
            (err) => pushToast({ type: "error", title: "Failed to load payments", description: err.message })
        );
        return () => off();
    }, [profile?.email, pushToast]);

    const lastPayment = useMemo(() => (payments.length ? payments[payments.length - 1] : null), [payments]);
    const dues = Number(profile?.dues || 0);
    const isClear = dues <= 0;

    const handlePayNow = () => setPayOpen(true);

        const handleDownloadReceipt = () => {
        if (!lastPayment) {
            pushToast({ type: "info", title: "No receipt", description: "No payments yet" });
            return;
        }
            openReceiptPrintWindow(lastPayment, profile);
            pushToast({ type: "success", title: "Receipt opened", description: `${lastPayment.receipt}` });
    };

    const handleUpdateProfile = () => {
        pushToast({ type: "info", title: "Profile", description: "Update profile coming soon" });
    };

    return (
        <Fragment>
            <div className="container-pro" style={{ paddingTop: "1rem", paddingBottom: "2rem" }}>
                <header style={{ marginBottom: "1rem" }}>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Member Dashboard</h1>
                    <p style={{ color: "#64748b", marginTop: ".25rem" }}>
                        {loading ? "Loading your info…" : `Welcome${profile?.fullName ? ", " + profile.fullName : ""}. Here’s a quick overview of your maintenance status.`}
                    </p>
                </header>

                {/* Summary cards */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: "1rem",
                        marginBottom: "1rem",
                    }}
                >
                    <div className="card">
                        <div className="card-header" style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                            <FaWallet /> Current Due
                        </div>
                        <div className="card-body">
                            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>₹{dues.toFixed(2)}</div>
                            <div className={isClear ? "badge-success" : "badge-danger"} style={{ display: "inline-block", marginTop: ".5rem" }}>
                                {isClear ? "Up to date" : "Unpaid"}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header" style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                            <FaReceipt /> Last Payment
                        </div>
                        <div className="card-body">
                            <div style={{ fontWeight: 600 }}>{lastPayment ? `₹${Number(lastPayment.amount).toFixed(2)}` : "—"}</div>
                            <div style={{ color: "#64748b", marginTop: ".25rem" }}>
                                {lastPayment ? `${lastPayment.date} • Receipt ${lastPayment.receipt}` : "No payments yet"}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header" style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                            <FaInfoCircle /> Plan / Notes
                        </div>
                        <div className="card-body">
                            <div style={{ color: "#64748b" }}>
                                {profile?.flatNumber ? `Flat ${profile.flatNumber}` : "Your building’s maintenance details will appear here."}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="card" style={{ marginBottom: "1rem" }}>
                    <div className="card-header" style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                        Quick Actions
                    </div>
                    <div className="card-body" style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                        <button className="btn btn-primary" onClick={handlePayNow}>
                            <FaCreditCard /> Pay maintenance
                        </button>
                        <button className="btn btn-secondary" onClick={handleDownloadReceipt}>
                            <FaDownload /> Download last receipt
                        </button>
                        <button className="btn" onClick={handleUpdateProfile}>
                            <FaUserCog /> Update profile
                        </button>
                    </div>
                </div>

                {/* Recent payments */}
                <div className="card">
                    <div className="card-header">Recent Payments</div>
                    <div className="card-body">
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Receipt</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: "center", color: "#64748b" }}>
                                                No payments yet
                                            </td>
                                        </tr>
                                    ) : (
                                        payments.map((p) => (
                                            <tr key={p.id}>
                                                <td>{p.date}</td>
                                                <td>₹{Number(p.amount || 0).toFixed(2)}</td>
                                                <td>{p.receipt}</td>
                                                <td>
                                                    <span className="badge-success">Paid</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <PayModal
                open={payOpen}
                onClose={() => setPayOpen(false)}
                uid={uid}
                profile={profile}
                dues={dues}
                onSuccess={(rec) => {
                    pushToast({ type: 'success', title: 'Payment recorded', description: `Receipt ${rec.receipt}` });
                }}
            />
        </Fragment>
    )
}

export default MemberDashboard;