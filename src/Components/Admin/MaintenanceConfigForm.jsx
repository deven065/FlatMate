import { useState } from "react";
import { db } from "../../firebase";
import { update, ref } from "firebase/database";
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
        const memberId = "admin"; // ← Change as needed
        const memberRef = ref(db, `members/${memberId}/maintenanceConfig`);
        await update(memberRef, formData);
        alert("Maintenance configuration saved successfully!");
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
                        required
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
