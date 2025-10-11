import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { update, ref, get, onValue } from "firebase/database";
import { FaSave } from "react-icons/fa";

export default function MaintenanceConfigForm() {
    const [formData, setFormData] = useState({
        maintenanceCharge: "",
        waterCharge: "",
        sinkingFund: "",
        dueDateISO: "",
        lateFee: "",
        contactEmail: "",
    });

    // load existing config into the form
    useEffect(() => {
        const cfgRef = ref(db, 'config/maintenance');
        const off = onValue(cfgRef, (snap) => {
            const val = snap.val() || {};
            // derive a YYYY-MM-DD value for date input if present
            const dueDateISO = val.dueDateISO || '';
            setFormData({
                maintenanceCharge: String(val.maintenanceCharge ?? ''),
                waterCharge: String(val.waterCharge ?? ''),
                sinkingFund: String(val.sinkingFund ?? ''),
                dueDateISO,
                lateFee: String(val.lateFee ?? ''),
                contactEmail: String(val.contactEmail ?? ''),
            });
        });
        return () => off();
    }, []);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Normalize and save: store full date and day-of-month for compatibility
        const cfg = { ...formData };
        const dueDate = formData.dueDateISO ? new Date(formData.dueDateISO) : null;
        const dueDay = dueDate && !isNaN(dueDate) ? dueDate.getDate() : undefined;

        const configRef = ref(db, "config/maintenance");
        await update(configRef, {
            maintenanceCharge: parseFloat(formData.maintenanceCharge || 0),
            waterCharge: parseFloat(formData.waterCharge || 0),
            sinkingFund: parseFloat(formData.sinkingFund || 0),
            lateFee: parseFloat(formData.lateFee || 0),
            contactEmail: formData.contactEmail || '',
            dueDateISO: formData.dueDateISO || '',
            // keep legacy field for any older consumers (day of month)
            ...(dueDay ? { dueDate: String(dueDay) } : {}),
        });

        // 2. Calculate monthly base charge to add to dues (exclude lateFee; late fee applies only if overdue at payment time)
        const totalAmount = ["maintenanceCharge", "waterCharge", "sinkingFund"]
            .reduce((sum, key) => sum + parseFloat(cfg[key] || 0), 0);

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
        { name: "maintenanceCharge", label: "Maintenance Charge (₹)", type: 'number' },
        { name: "waterCharge", label: "Water Charge (₹)", type: 'number' },
        { name: "sinkingFund", label: "Sinking Fund (₹)", type: 'number' },
        { name: "lateFee", label: "Late Fee (₹)", type: 'number' },
        { name: "contactEmail", label: "Admin Contact Email", type: 'email' },
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
                        type={field.type || "text"}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        className="w-full bg-gray-100 dark:bg-[#374151] text-gray-900 dark:text-white px-3 py-2 rounded outline-none"
                        required={field.name !== "contactEmail"}
                    />
                </div>
            ))}

            {/* Due date with calendar picker */}
            <div className="mb-3">
                <label className="block text-sm mb-1">Due Date</label>
                <input
                    type="date"
                    name="dueDateISO"
                    value={formData.dueDateISO}
                    onChange={handleChange}
                    className="w-full bg-gray-100 dark:bg-[#374151] text-gray-900 dark:text-white px-3 py-2 rounded outline-none"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Pick the monthly due date. Late fee applies if payment is made after this date.</p>
            </div>

            <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded mt-3 flex justify-center items-center gap-2"
            >
                <FaSave /> Save Changes
            </button>
        </form>
    );
}
