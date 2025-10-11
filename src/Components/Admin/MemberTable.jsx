import { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, push, update, remove, set } from "firebase/database";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { motion as Motion } from "framer-motion";
import { useToast } from "../Toast/useToast";
import {
  FaEdit,
  FaFileExport,
  FaFilter,
  FaPlus,
  FaTrash,
  FaSave,
  FaMoneyBill,
  FaTimes,
  FaPrint,
} from "react-icons/fa";
import { openReceiptPrintWindow } from "../../utils/receipt";

function MemberTable() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", flat: "", email: "", dues: 0, paid: 0, status: "Active", password: "" });
  const [generatedCreds, setGeneratedCreds] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [payFor, setPayFor] = useState(null); // member being paid for
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("UPI");
  const [paying, setPaying] = useState(false);
  const { push: pushToast } = useToast();

  const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  useEffect(() => {
    const membersRef = ref(db, "members");
    const usersRef = ref(db, "users");

    const unsubscribeMembers = onValue(membersRef, (snapshot) => {
      const memberData = snapshot.val() || {};
      const formattedMembers = Object.entries(memberData).map(([id, value]) => ({ id, name: value.name || "N/A", flat: value.flat || "N/A", email: value.email || "N/A", dues: value.dues || 0, paid: value.paid || 0, status: value.status || "Active", source: "members" }));
      setMembers((prev) => { const fromUsers = prev.filter((m) => m.source === "users"); return [...fromUsers, ...formattedMembers]; });
    });

    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const userData = snapshot.val() || {};
      const formatted = Object.entries(userData)
        .filter(([, user]) => user.role === "member")
        .map(([id, user]) => ({ id, name: user.fullName || "N/A", flat: user.flatNumber || "N/A", email: user.email || "N/A", dues: user.dues || 0, paid: user.paid || 0, status: user.status || "Active", source: "users" }));
      setMembers((prev) => { const fromMembers = prev.filter((m) => m.source === "members"); return [...fromMembers, ...formatted]; });
    });

    return () => { unsubscribeMembers(); unsubscribeUsers(); };
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    let list = members.filter(
      (m) => (m.name || "").toLowerCase().includes(q) || (m.flat || "").toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q)
    );
    if (showOnlyPending) {
      list = list.filter((m) => (Number(m.dues) || 0) > 0);
    }
    setFilteredMembers(list);
  }, [searchQuery, members, showOnlyPending]);

  const pendingSummary = useMemo(() => {
    const totalMembers = members.length;
    const pendingList = members.filter((m) => (Number(m.dues) || 0) > 0);
    const pendingCount = pendingList.length;
    const totalPending = pendingList.reduce((sum, m) => sum + (Number(m.dues) || 0), 0);
    return { totalMembers, pendingCount, totalPending };
  }, [members]);

  const handleExport = () => {
    const rows = filteredMembers.map((m) => ({
      Name: m.name,
      Flat: m.flat,
      Email: m.email,
      Status: m.status,
      Pending: Number(m.dues) || 0,
      Paid: Number(m.paid) || 0,
    }));

    const headers = Object.keys(rows[0] || { Name: '', Flat: '', Email: '', Status: '', Pending: 0, Paid: 0 });
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => `${String(r[h]).replaceAll('"', '""')}`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-${showOnlyPending ? 'pending' : 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    pushToast({ type: 'success', title: 'Exported CSV', description: `${rows.length} rows exported.` });
  };

  const handleAddMember = async () => {
    const { name, flat, email, dues, password } = newMember;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name.trim() || !flat.trim() || !email.trim() || !password.trim()) { pushToast({ type: "error", title: "Missing fields", description: "Name, Flat, Email and Password are required." }); return; }
    if (!emailRegex.test(email)) { pushToast({ type: "error", title: "Invalid email" }); return; }
    if (password.length < 6) { pushToast({ type: "error", title: "Weak password", description: "Min 6 characters" }); return; }
    const duesNumber = Number(dues);
    if (!Number.isFinite(duesNumber) || duesNumber < 0) { pushToast({ type: "error", title: "Invalid dues" }); return; }

    const auth = getAuth();
    setCreating(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const userProfile = { fullName: name, flatNumber: flat, email, role: "member", dues: duesNumber, paid: 0, status: "Active", createdAt: Date.now() };
      await set(ref(db, `users/${uid}`), userProfile);
      setGeneratedCreds({ email, password });
      pushToast({ type: "success", title: "Member added", description: `${name} has been added.` });
      setShowForm(false);
      setNewMember({ name: "", flat: "", email: "", dues: 0, paid: 0, status: "Active", password: "" });
    } catch (err) {
      console.error(err);
      pushToast({ type: "error", title: "Add member failed", description: err.message });
    } finally { setCreating(false); }
  };

  const handleEdit = (member) => { setEditId(member.id); setEditData({ ...member }); };

  const handleSave = (member) => {
    // Persist non-financial fields and allow manual Pending (dues) adjustment.
    const safeStatus = editData.status ?? member.status ?? "Active";
    let newDues = Number(editData.dues);
    if (!Number.isFinite(newDues) || newDues < 0) {
      pushToast({ type: 'error', title: 'Invalid Pending amount' });
      return;
    }
    // If Pending decreased, treat the difference as a manual payment adjustment.
    const originalDues = Number(member.dues) || 0;
    const paymentDelta = originalDues - newDues; // >0 means payment made
    let updatesMembers = { name: editData.name, flat: editData.flat, email: editData.email, status: safeStatus, dues: newDues };
    let updatesUsers = { fullName: editData.name, flatNumber: editData.flat, email: editData.email, status: safeStatus, dues: newDues };
    if (paymentDelta > 0) {
      const newPaid = (Number(member.paid) || 0) + paymentDelta;
      updatesMembers.paid = newPaid;
      updatesUsers.paid = newPaid;
    }
    update(ref(db, `${member.source}/${member.id}`), member.source === 'users' ? updatesUsers : updatesMembers);

    if (paymentDelta > 0) {
      const paymentRecord = {
        member: editData.name,
        flat: editData.flat,
        email: editData.email,
        amount: paymentDelta,
        method: 'Manual Edit',
        date: new Date().toISOString().split('T')[0],
        receipt: `#${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: Date.now(),
      };
      push(ref(db, 'recentPayments'), paymentRecord);
    }
    pushToast({ type: 'success', title: 'Member updated', description: 'Pending updated.' });
    setEditId(null);
  };

  const openPay = (member) => {
    setPayFor(member);
    const pending = Number(member.dues) || 0;
    setPayAmount(pending);
    setPayMethod("UPI");
  };

  const confirmPay = async () => {
    if (!payFor) return;
    const pending = Math.max(0, Number(payFor.dues) || 0);
    let amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      pushToast({ type: 'error', title: 'Enter a valid amount' });
      return;
    }
    // Cap at pending to avoid negative
    if (amount > pending) amount = pending;
    setPaying(true);
    try {
      const newPaid = (Number(payFor.paid) || 0) + amount;
      const newDues = Math.max(0, pending - amount);
      const updatesMembers = { paid: newPaid, dues: newDues };
      const updatesUsers = { paid: newPaid, dues: newDues };
      await update(ref(db, `${payFor.source}/${payFor.id}`), payFor.source === 'users' ? updatesUsers : updatesMembers);

      const paymentRecord = {
        member: payFor.name,
        flat: payFor.flat,
        email: payFor.email,
        amount,
        method: payMethod,
        date: new Date().toISOString().split('T')[0],
        receipt: `#${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: Date.now(),
      };
      await push(ref(db, 'recentPayments'), paymentRecord);

      // Print receipt
      openReceiptPrintWindow(paymentRecord, {
        fullName: payFor.name,
        flatNumber: payFor.flat,
      });

      pushToast({ type: 'success', title: 'Payment received', description: `${payFor.name} paid ${formatCurrency(amount)}` });
      setPayFor(null);
      setPayAmount(0);
    } catch (e) {
      console.error(e);
      pushToast({ type: 'error', title: 'Payment failed', description: e.message });
    } finally {
      setPaying(false);
    }
  };

  const handleDelete = (member) => { remove(ref(db, `${member.source}/${member.id}`)); pushToast({ type: 'success', title: 'Member deleted' }); };

  return (
    <div className="bg-white dark:bg-[#1f2937] rounded-lg shadow-lg p-4 text-gray-900 dark:text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Member Management</h2>
        <Motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition" onClick={() => setShowForm((prev) => !prev)} aria-label={showForm ? "Close add member form" : "Open add member form"}>
          <FaPlus /> {showForm ? "Close" : "Add Member"}
        </Motion.button>
      </div>

      {showForm && (
        <Motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="bg-gray-100 dark:bg-[#374151] p-4 rounded mb-4">
          <div className="grid sm:grid-cols-2 gap-4 mb-2">
            <input type="text" placeholder="Name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="px-3 py-2 rounded-md border border-gray-200 bg-white dark:bg-[#1f2937] dark:border-gray-700" />
            <input type="text" placeholder="Flat No." value={newMember.flat} onChange={(e) => setNewMember({ ...newMember, flat: e.target.value })} className="px-3 py-2 rounded-md border border-gray-200 bg-white dark:bg-[#1f2937] dark:border-gray-700" />
            <input type="email" placeholder="Email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} className="px-3 py-2 rounded-md border border-gray-200 bg-white dark:bg-[#1f2937] dark:border-gray-700" />
            <input type="password" placeholder="Password" value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} className="px-3 py-2 rounded-md border border-gray-200 bg-white dark:bg-[#1f2937] dark:border-gray-700" />
            <input type="number" placeholder="Dues" value={newMember.dues} onChange={(e) => setNewMember({ ...newMember, dues: e.target.value })} className="px-3 py-2 rounded-md border border-gray-200 bg-white dark:bg-[#1f2937] dark:border-gray-700" />
          </div>
          <Motion.button whileHover={{ scale: creating ? 1 : 1.02 }} whileTap={{ scale: creating ? 1 : 0.98 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition" onClick={handleAddMember} disabled={creating}>
            {creating ? 'Creating…' : 'Submit'}
          </Motion.button>
        </Motion.div>
      )}

      {generatedCreds && (
        <div className="mb-4 p-4 rounded bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100">
          <p><strong>Member added successfully!</strong></p>
          <p>Email: <code>{generatedCreds.email}</code></p>
          <p>Password: <code>{generatedCreds.password}</code></p>
        </div>
      )}

      {/* Summary & controls */}
      <div className="grid sm:grid-cols-3 grid-cols-1 gap-3 mb-4">
        <div className="rounded-md bg-gray-100 dark:bg-[#374151] p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Members</div>
          <div className="text-lg font-semibold">{pendingSummary.totalMembers}</div>
        </div>
        <div className="rounded-md bg-gray-100 dark:bg-[#374151] p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Members with Pending</div>
          <div className="text-lg font-semibold">{pendingSummary.pendingCount}</div>
        </div>
        <div className="rounded-md bg-gray-100 dark:bg-[#374151] p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Pending</div>
          <div className="text-lg font-semibold text-red-600">{formatCurrency(pendingSummary.totalPending)}</div>
        </div>
      </div>

      <div className="flex sm:flex-col flex-row justify-between gap-2 mb-4">
        <input type="text" placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-gray-100 dark:bg-[#374151] text-gray-900 dark:text-white px-4 py-2 rounded w-full sm:w-1/2 outline-none" />
        <div className="flex gap-2 justify-end">
          <Motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowOnlyPending((p) => !p)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-gray-100 dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-[#4b5563] text-sm"
            aria-pressed={showOnlyPending}
            aria-label={showOnlyPending ? 'Showing only pending members' : 'Showing all members'}
          >
            <FaFilter /> {showOnlyPending ? 'Show All' : 'Only Pending'}
          </Motion.button>
          <Motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-gray-100 dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-[#4b5563] text-sm"
          >
            <FaFileExport /> Export
          </Motion.button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-200 dark:bg-[#374151] text-left text-gray-700 dark:text-gray-300">
              <th className="p-2">Name</th>
              <th className="p-2">Flat No.</th>
              <th className="p-2">Email</th>
              <th className="p-2">Status</th>
              <th className="p-2">Pending</th>
              <th className="p-2">Paid</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-900 dark:text-gray-100">
            {filteredMembers.map((m) => (
              <tr key={m.id} className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-[#2d3748]">
                <td className="p-2">{editId === m.id ? <input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="bg-transparent border-b border-gray-500" /> : m.name}</td>
                <td className="p-2">{editId === m.id ? <input value={editData.flat} onChange={(e) => setEditData({ ...editData, flat: e.target.value })} className="bg-transparent border-b border-gray-500" /> : m.flat}</td>
                <td className="p-2">{editId === m.id ? <input value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="bg-transparent border-b border-gray-500" /> : m.email}</td>
                <td className="p-2">
                  {editId === m.id ? (
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                      className="bg-transparent border-b border-gray-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${m.status === "Active" ? "bg-green-600" : "bg-red-600"}`}>{m.status}</span>
                  )}
                </td>
                <td className="p-2">
                  {editId === m.id ? (
                    <input
                      type="number"
                      value={editData.dues}
                      onChange={(e) => setEditData({ ...editData, dues: e.target.value })}
                      className="bg-transparent border-b border-gray-500 w-20"
                    />
                  ) : (
                    (() => {
                      const pending = Number(m.dues) || 0;
                      return pending > 0 ? (
                        <span className="text-red-600 font-semibold">{formatCurrency(pending)}</span>
                      ) : (
                        <span className="text-green-600 font-semibold">Clear</span>
                      );
                    })()
                  )}
                </td>
                <td className="p-2"><span>{formatCurrency(m.paid)}</span></td>
                <td className="p-2 flex gap-3 items-center">
                  {editId === m.id ? (
                    <>
                      <FaSave title="Save" className="text-green-500 cursor-pointer hover:text-green-700" onClick={() => handleSave(m)} />
                      <button
                        type="button"
                        className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white underline"
                        onClick={() => { setEditId(null); setEditData({}); }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <FaMoneyBill title="Receive Payment" className="text-green-600 cursor-pointer hover:text-green-700" onClick={() => openPay(m)} />
                      <FaEdit className="text-blue-500 cursor-pointer hover:text-blue-700" onClick={() => handleEdit(m)} />
                    </>
                  )}
                  <FaTrash className="text-red-500 cursor-pointer hover:text-red-700" onClick={() => handleDelete(m)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Receive Payment Modal */}
      {payFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1f2937] text-gray-900 dark:text-white rounded-lg shadow-xl w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Receive Payment</h3>
              <button className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" onClick={() => setPayFor(null)} aria-label="Close">
                <FaTimes />
              </button>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">{payFor.name} • Flat {payFor.flat}</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-md bg-gray-100 dark:bg-[#374151] p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
                <div className="text-base font-semibold text-red-600">{formatCurrency(payFor.dues)}</div>
              </div>
              <div className="rounded-md bg-gray-100 dark:bg-[#374151] p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">Paid Till Now</div>
                <div className="text-base font-semibold">{formatCurrency(payFor.paid)}</div>
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">Amount</label>
              <input type="number" className="w-full bg-gray-100 dark:bg-[#374151] px-3 py-2 rounded outline-none" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              <div className="flex gap-2 mt-2">
                <button type="button" className="px-2.5 py-1.5 text-sm rounded bg-gray-100 dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-[#4b5563]" onClick={() => setPayAmount(Math.max(0, Number(payFor.dues) || 0))}>Full</button>
                <button type="button" className="px-2.5 py-1.5 text-sm rounded bg-gray-100 dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-[#4b5563]" onClick={() => setPayAmount(500)}>₹500</button>
                <button type="button" className="px-2.5 py-1.5 text-sm rounded bg-gray-100 dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-[#4b5563]" onClick={() => setPayAmount(1000)}>₹1000</button>
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">Method</label>
              <select className="w-full bg-gray-100 dark:bg-[#374151] px-3 py-2 rounded outline-none" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                <option>UPI</option>
                <option>Cash</option>
                <option>Card</option>
                <option>Bank Transfer</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="px-3.5 py-2 rounded-md bg-gray-100 dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-[#4b5563]" onClick={() => setPayFor(null)}>Cancel</button>
              <button type="button" disabled={paying} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60" onClick={confirmPay}>
                <FaPrint /> {paying ? 'Processing…' : 'Receive & Print'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberTable;