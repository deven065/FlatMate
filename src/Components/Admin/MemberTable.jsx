import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, push, update, remove } from "firebase/database";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
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
  const [newMember, setNewMember] = useState({
    name: "",
    flat: "",
    email: "",
    dues: 0,
    paid: 0,
    status: "Active",
    password: "",
  });
  const [generatedCreds, setGeneratedCreds] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const membersRef = ref(db, "members");
    const usersRef = ref(db, "users");

    const unsubscribeMembers = onValue(membersRef, (snapshot) => {
      const memberData = snapshot.val() || {};
      const formattedMembers = Object.entries(memberData).map(([id, value]) => ({
        id,
        name: value.name || "N/A",
        flat: value.flat || "N/A",
        email: value.email || "N/A",
        dues: value.dues || 0,
        paid: value.paid || 0,
        status: value.status || "Active",
        source: "members",
      }));

      setMembers((prev) => {
        const fromUsers = prev.filter((m) => m.source === "users");
        return [...fromUsers, ...formattedMembers];
      });
    });

    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const userData = snapshot.val() || {};
      const filteredMembers = Object.entries(userData)
        .filter(([_, user]) => user.role === "member")
        .map(([id, user]) => ({
          id,
          name: user.fullName || "N/A",
          flat: user.flatNumber || "N/A",
          email: user.email || "N/A",
          dues: user.dues || 0,
          paid: user.paid || 0,
          status: user.status || "Active",
          source: "users",
        }));

      setMembers((prev) => {
        const fromMembers = prev.filter((m) => m.source === "members");
        return [...fromMembers, ...filteredMembers];
      });
    });

    return () => {
      unsubscribeMembers();
      unsubscribeUsers();
    };
  }, []);

  useEffect(() => {
    const filtered = members.filter((m) =>
      (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.flat || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  const handleAddMember = async () => {
    const { name, flat, email, dues, password } = newMember;
    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const memberData = {
        name,
        flat,
        email,
        dues: parseFloat(dues),
        paid: 0,
        status: "Active",
        uid: userCredential.user.uid,
        role: "member",
      };
      push(ref(db, "members"), memberData);
      setGeneratedCreds({ email, password });
    } catch (error) {
      console.error("Error creating user:", error);
    }

    setShowForm(false);
    setNewMember({
      name: "",
      flat: "",
      email: "",
      dues: 0,
      paid: 0,
      status: "Active",
      password: "",
    });
  };

  const handleEdit = (member) => {
    setEditId(member.id);
    setEditData({ ...member });
  };

  const handleSave = (member) => {
  const oldPaid = parseFloat(member.paid);
  const currentDues = parseFloat(member.dues);
  const newPaid = parseFloat(editData.paid);

  const paymentMade = newPaid - oldPaid;

  // If no actual new payment is made, skip
  if (paymentMade <= 0) {
    setEditId(null);
    return;
  }

  const updatedDues = Math.max(0, currentDues - paymentMade);

  const updates = {
    name: editData.name,
    flat: editData.flat,
    email: editData.email,
    paid: newPaid,
    dues: updatedDues,
    status: editData.status,
  };

  update(ref(db, `${member.source}/${member.id}`), updates);

  // Record the new payment in recentPayments
  const paymentRecord = {
    member: editData.name,
    flat: editData.flat,
    email: editData.email,
    amount: paymentMade,
    date: new Date().toISOString().split("T")[0],
    receipt: `#${Math.floor(100000 + Math.random() * 900000)}`,
  };

  push(ref(db, "recentPayments"), paymentRecord);

  setEditId(null);
};



  const handleDelete = (member) => {
    remove(ref(db, `${member.source}/${member.id}`));
  };

  return (
    <div className="bg-white dark:bg-[#1f2937] rounded-lg shadow-lg p-4 text-gray-900 dark:text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Member Management</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
          onClick={() => setShowForm(true)}
        >
          <FaPlus /> Add Member
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-100 dark:bg-[#374151] p-4 rounded mb-4">
          <div className="grid sm:grid-cols-2 gap-4 mb-2">
            <input type="text" placeholder="Name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="p-2 rounded bg-white dark:bg-[#1f2937] dark:text-white" />
            <input type="text" placeholder="Flat No." value={newMember.flat} onChange={(e) => setNewMember({ ...newMember, flat: e.target.value })} className="p-2 rounded bg-white dark:bg-[#1f2937] dark:text-white" />
            <input type="email" placeholder="Email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} className="p-2 rounded bg-white dark:bg-[#1f2937] dark:text-white" />
            <input type="password" placeholder="Password" value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} className="p-2 rounded bg-white dark:bg-[#1f2937] dark:text-white" />
            <input type="number" placeholder="Dues" value={newMember.dues} onChange={(e) => setNewMember({ ...newMember, dues: e.target.value })} className="p-2 rounded bg-white dark:bg-[#1f2937] dark:text-white" />
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleAddMember}>Submit</button>
        </div>
      )}

      {generatedCreds && (
        <div className="mb-4 p-4 rounded bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100">
          <p><strong>Member added successfully!</strong></p>
          <p>Email: <code>{generatedCreds.email}</code></p>
          <p>Password: <code>{generatedCreds.password}</code></p>
        </div>
      )}

      <div className="flex sm:flex-col flex-row justify-between gap-2 mb-4">
        <input
          type="text"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-100 dark:bg-[#374151] text-gray-900 dark:text-white px-4 py-2 rounded w-full sm:w-1/2 outline-none"
        />
        <div className="flex gap-2 justify-end">
          <button className="bg-gray-100 dark:bg-[#374151] px-3 py-2 rounded text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-[#4b5563]">
            <FaFilter /> Filter
          </button>
          <button className="bg-gray-100 dark:bg-[#374151] px-3 py-2 rounded text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-[#4b5563]">
            <FaFileExport /> Export
          </button>
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
                  <span className={`px-2 py-1 text-xs rounded-full font-semibold ${m.status === "Active" ? "bg-green-600" : "bg-red-600"}`}>{m.status}</span>
                </td>
                <td className="p-2">{editId === m.id ? <input type="number" value={editData.dues} onChange={(e) => setEditData({ ...editData, dues: e.target.value })} className="bg-transparent border-b border-gray-500 w-16" /> : `₹${m.dues}`}</td>
                <td className="p-2">{editId === m.id ? <input type="number" value={editData.paid} onChange={(e) => setEditData({ ...editData, paid: e.target.value })} className="bg-transparent border-b border-gray-500 w-16" /> : `₹${m.paid}`}</td>
                <td className="p-2 flex gap-3">
                  {editId === m.id ? (
                    <FaSave className="text-green-500 cursor-pointer hover:text-green-700" onClick={() => handleSave(m)} />
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
