import { db } from "../../firebase";
import { ref, onValue, push } from "firebase/database";
import { useEffect, useState } from "react";
import { FaEdit, FaFileExport, FaFilter, FaPlus, FaTrash } from "react-icons/fa";

function MemberTable() {
    const [members, setMembers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newMember, setNewMember] = useState({ name: "", flat: "", email: "", dues: "", status: "Active" });
    const [credentials, setCredentials] = useState(null);

    // Fetch members from Firebase
    useEffect(() => {
        const memberRef = ref(db, "members");
        const unsubscribe = onValue(memberRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loaded = Object.entries(data).map(([id, value]) => ({
                    id,
                    ...value,
                }));
                setMembers(loaded);
            } else {
                setMembers([]);
            }
        });

        return () => unsubscribe(); // cleanup
    }, []);

    const handleAddMember = async () => {
        if (!newMember.name || !newMember.flat || !newMember.email) {
            alert("Please fill all fields.");
            return;
        }

        // Generate random username & password
        const username = newMember.name.toLowerCase().replace(/\s+/g, "") + "_" + Math.floor(Math.random() * 1000);
        const password = Math.random().toString(36).slice(-8);

        const memberData = {
            ...newMember,
            username,
            password,
        };

        try {
            await push(ref(db, "members"), memberData);
            setCredentials({ username, password });
            setNewMember({ name: "", flat: "", email: "", dues: "", status: "Active" });
            setShowForm(false);
        } catch (err) {
            console.error("Error adding member:", err);
            alert("Failed to add member. Try again.");
        }
    };

    return (
        <div className="bg-white dark:bg-[#1f2937] rounded-lg shadow-lg p-4 text-gray-900 dark:text-white">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Member Management</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
                >
                    <FaPlus /> Add Member
                </button>
            </div>

            {/* Add Member Form */}
            {showForm && (
                <div className="mb-4 bg-gray-100 dark:bg-gray-800 p-4 rounded space-y-2">
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        className="w-full p-2 rounded bg-white dark:bg-[#374151] dark:text-white"
                    />
                    <input
                        type="text"
                        placeholder="Flat Number"
                        value={newMember.flat}
                        onChange={(e) => setNewMember({ ...newMember, flat: e.target.value })}
                        className="w-full p-2 rounded bg-white dark:bg-[#374151] dark:text-white"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                        className="w-full p-2 rounded bg-white dark:bg-[#374151] dark:text-white"
                    />
                    <input
                        type="number"
                        placeholder="Pending Dues (Optional)"
                        value={newMember.dues}
                        onChange={(e) => setNewMember({ ...newMember, dues: e.target.value })}
                        className="w-full p-2 rounded bg-white dark:bg-[#374151] dark:text-white"
                    />
                    <button
                        onClick={handleAddMember}
                        className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700"
                    >
                        Submit Member
                    </button>
                </div>
            )}

            {/* Credentials */}
            {credentials && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 rounded text-sm text-gray-900 dark:text-white">
                    <p><strong>Member Added!</strong></p>
                    <p>Username: <span className="font-mono">{credentials.username}</span></p>
                    <p>Password: <span className="font-mono">{credentials.password}</span></p>
                    <p className="text-xs italic">Share this login with the member.</p>
                </div>
            )}

            {/* Search + Filter */}
            <div className="flex sm:flex-col flex-row justify-between gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Search members..."
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

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-200 dark:bg-[#374151] text-left text-gray-700 dark:text-gray-300">
                            <th className="p-2">Name</th>
                            <th className="p-2">Flat No.</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Dues</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-900 dark:text-gray-100">
                        {members.map((m) => (
                            <tr key={m.id} className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-[#2d3748]">
                                <td className="p-2 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                        <span className="text-xs">👤</span>
                                    </div>
                                    {m.name}
                                </td>
                                <td className="p-2">{m.flat}</td>
                                <td className="p-2">{m.email}</td>
                                <td className="p-2">
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                            m.status === "Active" ? "bg-green-600" : "bg-red-600"
                                        }`}
                                    >
                                        {m.status}
                                    </span>
                                </td>
                                <td className="p-2">{m.dues || "0"}</td>
                                <td className="p-2 flex gap-3">
                                    <FaEdit className="text-blue-500 cursor-pointer hover:text-blue-700" />
                                    <FaTrash className="text-red-500 cursor-pointer hover:text-red-700" />
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
