import { useState } from "react";
import { db } from "../../firebase";
import { update } from "firebase/database";

export default function MaintenanceConfigForm() {
    const [formData, setFormData] = useState({
        maintenanceCharge: "",
        waterCharge: "",
        singingFund: "",
        dueDate: "",
        lateFee: "",
    });

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name] : e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const memberRef = ref(db, `members/${memberId}/maintenanceConfig`);
        await update(memberRef, formData);
        alert("Maintenance configuration saved successfully!");
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-[#1f2937] text-white p-4 rounded-lg shadow-md w-full max-w-sm"
        >
            <h3 className="text-lg font-semibold mb-4">Maintenance Configuration</h3>

            {[
                // {name : "maintenanceCharge", label: "Maintenance Charge"}
            ]}
        </form>
    )
}