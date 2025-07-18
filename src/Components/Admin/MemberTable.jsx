import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import { useEffect, useState } from "react"
import { FaEdit, FaFileExport, FaFilter, FaPlus, FaTrash } from "react-icons/fa";

function MemberTable() {
    const [members, setMembers] = useState([]);

    useEffect(() => {
    const memberRef = ref(db, "members");
    onValue(memberRef, (snapshot) => {
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
    }, []);
    return (
        <div className="bg-[#1f2937] rounded-lg shadow-lg p-4 text-white">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Member Management</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
                    <FaPlus /> Add Member
                </button>
            </div>

            {/* Search + Filter */}
            <div className="flex sm:flex-col flex-row justify-between gap-2 mb-4">
                <input 
                    text="text"
                    placeholder="Search members..."
                    className="bg-[#374151] text-white px-4 py-2 rounded w-full sm:w-1/2 outline-none"
                />
                <div className="flex gap-2 justify-end">
                    <button className="bg-[#374151] px-3 py-2 rounded text-sm flex items-center gap-2">
                        <FaFilter /> Filter
                    </button>
                    <button className="bg-[#374151] px-3 py-2 rounded text-sm flex items-center gap-2">
                        <FaFileExport /> Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-[#374151] text-left text-gray-300">
                            <th className="p-2">Name</th>
                            <th className="p-2">Flat No.</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Dues</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-100">
                        {members.map((m, i) => (
                            <tr key={m.id} className="border-t border-gray-700 hover:bg-[#2d3748]">
                                <td className="p-2 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
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
                                <td className="p-2">{m.dues}</td>
                                <td className="p-2 flex gap-3">
                                    <FaEdit className="text-blue-400 cursor-pointer hover:text-blue-600" />
                                    <FaTrash className="text-blue-400 cursor-pointer hover:text-blue-600" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default MemberTable;