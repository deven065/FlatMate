import { useEffect, useState } from "react";
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
} from "react-icons/fa";

function MemberTable() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", flat: "", email: "", dues: 0, paid: 0, status: "Active", password: "" });
  const [generatedCreds, setGeneratedCreds] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const { push: pushToast } = useToast();

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
    setFilteredMembers(members.filter((m) => (m.name||"").toLowerCase().includes(q) || (m.flat||"").toLowerCase().includes(q) || (m.email||"").toLowerCase().includes(q)));
  }, [searchQuery, members]);

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
    const oldPaid = Number(member.paid) || 0;
    const currentDues = Number(member.dues) || 0;
    const newPaid = Number(editData.paid);
    const inputDues = Number(editData.dues);
    const paymentMade = newPaid - oldPaid;
    const updatedDues = paymentMade > 0 ? Math.max(0, currentDues - paymentMade) : (Number.isFinite(inputDues) ? inputDues : currentDues);
    const safeStatus = editData.status ?? member.status ?? "Active";

    const updatesMembers = { name: editData.name, flat: editData.flat, email: editData.email, paid: newPaid, dues: updatedDues, status: safeStatus };
    const updatesUsers = { fullName: editData.name, flatNumber: editData.flat, email: editData.email, paid: newPaid, dues: updatedDues, status: safeStatus };

    update(ref(db, `${member.source}/${member.id}`), member.source === 'users' ? updatesUsers : updatesMembers);

    if (paymentMade > 0) {
      const paymentRecord = { member: editData.name, flat: editData.flat, email: editData.email, amount: paymentMade, date: new Date().toISOString().split("T")[0], receipt: `#${Math.floor(100000 + Math.random() * 900000)}` };
      push(ref(db, "recentPayments"), paymentRecord);
    }

    pushToast({ type: 'success', title: 'Member updated' });
    setEditId(null);
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

      <div className="flex sm:flex-col flex-row justify-between gap-2 mb-4">
        <input type="text" placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-gray-100 dark:bg-[#374151] text-gray-900 dark:text-white px-4 py-2 rounded w-full sm:w-1/2 outline-none" />
        <div className="flex gap-2 justify-end">
          <Motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-gray-100 dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-[#4b5563] text-sm">
            <FaFilter /> Filter
          </Motion.button>
          <Motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-gray-100 dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-[#4b5563] text-sm">
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
              <th className="p-2">Dues</th>
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
                <td className="p-2">{editId === m.id ? <input type="number" value={editData.dues} onChange={(e) => setEditData({ ...editData, dues: e.target.value })} className="bg-transparent border-b border-gray-500 w-16" /> : `₹${m.dues}`}</td>
                <td className="p-2">{editId === m.id ? <input type="number" value={editData.paid} onChange={(e) => setEditData({ ...editData, paid: e.target.value })} className="bg-transparent border-b border-gray-500 w-16" /> : `₹${m.paid}`}</td>
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
                    <FaEdit className="text-blue-500 cursor-pointer hover:text-blue-700" onClick={() => handleEdit(m)} />
                  )}
                  <FaTrash className="text-red-500 cursor-pointer hover:text-red-700" onClick={() => handleDelete(m)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MemberTable;