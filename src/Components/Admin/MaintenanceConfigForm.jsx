import { useState } from "react";
import { db } from "../../firebase";
import { update, ref, get } from "firebase/database";
import { FaSave } from "react-icons/fa";

export default function MaintenanceConfigForm() {
    const [formData, setFormData] = useState({
        maintenanceCharge: "",
        waterCharge: "",
        sinkingFund: "",
        dueDate: "",
        lateFee: "",
    });

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Save maintenance config under "config/maintenance"
        const configRef = ref(db, "config/maintenance");
        await update(configRef, formData);

        // 2. Calculate total charge to add to dues
        const totalAmount = ["maintenanceCharge", "waterCharge", "sinkingFund", "lateFee"]
            .reduce((sum, key) => sum + parseFloat(formData[key] || 0), 0);

        // 3. Update dues in members node
        const membersSnap = await get(ref(db, "members"));
        if (membersSnap.exists()) {
            const updates = {};
            const members = membersSnap.val();
            Object.entries(members).forEach(([id, member]) => {
                const currentDues = parseFloat(member.dues || 0);
                updates[`members/${id}/dues`] = currentDues + totalAmount;
            });
            await update(ref(db), updates);
        }

        // 4. Update dues in users node (if needed)
        const usersSnap = await get(ref(db, "users"));
        if (usersSnap.exists()) {
            const updates = {};
            const users = usersSnap.val();
            Object.entries(users).forEach(([id, user]) => {
                if (user.role === "member") {
                    const currentDues = parseFloat(user.dues || 0);
                    updates[`users/${id}/dues`] = currentDues + totalAmount;
                }
            });
            await update(ref(db), updates);
        }

        alert("Maintenance configuration saved and dues updated for all members.");
    };

    const fields = [
        { name: "maintenanceCharge", label: "Maintenance Charge (₹)" },
        { name: "waterCharge", label: "Water Charge (₹)" },
        { name: "sinkingFund", label: "Sinking Fund (₹)" },
        { name: "dueDate", label: "Due Date (Day of Month)" },
        { name: "lateFee", label: "Late Fee (₹)" },
    ];

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-[#1f2937] text-gray-800 dark:text-white p-4 rounded-lg shadow-md w-full max-w-sm"
        >
            <h3 className="text-lg font-semibold mb-4">Maintenance Configuration</h3>

            {fields.map((field) => (
                <div key={field.name} className="mb-3">
                    <label className="block text-sm mb-1">{field.label}</label>
                    <input
                        type="text"
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        className="w-full bg-gray-100 dark:bg-[#374151] text-gray-900 dark:text-white px-3 py-2 rounded outline-none"
                        required={field.name !== "dueDate"}
                    />
                </div>
            ))}

            <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded mt-3 flex justify-center items-center gap-2"
            >
                <FaSave /> Save Changes
            </button>
        </form>
    );
}
