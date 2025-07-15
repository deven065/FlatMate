import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase ,ref, set } from "firebase/database";
import { db } from '../firebase';
import { useState, useEffect } from 'react';
import { FaUser, FaUserShield, FaHome, FaEnvelope, FaLock, FaUserPlus, FaSignInAlt } from 'react-icons/fa';
import { motion } from "framer-motion"
import { Link } from 'react-router-dom';

const SignupPage = () => {
    // keeps track of whether the user is signing up as member or admin
    const [activeTab, setActiveTab] = useState("admin"); //default: admin

    // state for dark mode // default: Light Mode
    const [isDarkMode, setIsDarkMode] = useState(false);

    // store all input values from the form
    const [formData, setFormData] = useState({
        fullName: "",
        flatNumber: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "admin" // role will be either "admin" or "member"
    });

    // Dark mode logic

    // update role whenever role changes
    useEffect(() => {
        setFormData(prev => ({ ...prev, role: activeTab }));
    }, [activeTab]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name] : e.target.value });
    };

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle("dark"); // toggle class on html (if not understand then refer tailwindcss.com and go for Toggling dark mode manually)
    }

    // Submit handler with basic validation
    const handleSubmit = async(e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert("Password do not match!");
            return;
        }

        // FIREBASE AUTHENTICATION
        const auth = getAuth();
        try {
            // Create user in firebase auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            const user = userCredential.user;
            // FIREBASE Database testing
            const userId = user.uid;

            await update(ref(db, `users/${userId}`), {
                fullName: formData.fullName,
                flatNumber: formData.flatNumber,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });

            alert(`Signed up successfully as ${formData.role.toUpperCase()}`);
        } catch (error) {
            // Handle duplicate email error
            if (error.code === "auth/email-already-in-use") {
                alert("User already exists with this email.");
            } else {
                alert(error.message); // fallback for other errors
            }
        }
    };

    return (
        <div className = "min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 transition-colors duration-300">
        {/* Optional Dark Mode toggle button */}
            <motion.button
                onClick = {toggleDarkMode}
                whileTap = {{ scale: 0.95 }}
                whileHover = {{ scale: 1.05 }}
                className = "absolute top-4 right-4 px-4 py-2 bg-transparent  dark:bg-gray-700 text-gray-800 dark:text-white rounded"
            >{isDarkMode ? "🔆 Light Mode" : "🌙 Dark Mode"}
            </motion.button>
            <form className = "bg-[#1e293b] text-white p-8 rounded-xl shadow-xl w-full max-w-md"
                onSubmit = {handleSubmit}>
                    <h1 className= "text-2xl font-bold text-center mb-2">FlatMate</h1>
                    <p className = "text-center mb-6 text-sm text-gray-300">
                        Manage your society maintenance with ease
                    </p>

                    {/* Toggle Tabs */}
                    <div className = "flex justify-between mb-6">
                        <motion.button
                            type = "button"
                            whileHover = {{ scale: 1.05 }}
                            whileTap = {{ scale: 0.95 }}
                            className = {`flex items-center justify-center gap-2 flex-1 mr-2 py-2 rounded-md transition-colors ${
                                activeTab === 'member' ? "bg-blue-600" : "bg-gray-700"
                            }`}
                            onClick = {()=> setActiveTab("member")}
                        >
                            <FaUser /> Member Login
                        </motion.button>
                        <motion.button
                            type = "button"
                            whileHover = {{ scale: 1.05 }}
                            whileTap = {{ scale: 0.95 }}
                            className = {`flex items-center justify-center gap-2 flex-1 py-2 rounded-md transition-colors ${
                                activeTab === 'admin' ? "bg-blue-600" : "bg-gray-700"
                            }`}
                            onClick = {()=> setActiveTab("admin")}
                        >
                            <FaUserShield className = "w-5"/> Admin Login
                        </motion.button>
                    </div>

                    {/* Form Inputs */}
                    <label className = "block text-sm mb-1">Full Name</label>
                    <div className = "flex items-center bg-gray-700 mb-4 rounded-md px-2">
                        <FaUser className = "text-gray-400" />
                        <input
                            type = "text"
                            name = "fullName"
                            value = {formData.fullName}
                            onChange = {handleChange}
                            placeholder = "Enter your full name"
                            className = "w-full p-2 bg-transparent outline-none text-white placeholder-gray-400"
                    />
                    </div>
                    <label className = "block text-sm mb-1">Flat/House Number</label>
                    <div className = "flex items-center bg-gray-700 mb-4 rounded-md px-2">
                        <FaHome  className = "text-gray-400"/>
                        <input
                            type = "text"
                            name = "flatNumber"
                            placeholder = "Enter your flat /house number"
                            value = {formData.flatNumber}
                            onChange = {handleChange}
                            className= "w-full p-2 bg-transparent outline-none text-white placeholder-gray-400"
                        />
                    </div>
                    <label className = "block text-sm mb-1">Email Address</label>
                    <div className = "flex items-center bg-gray-700 mb-4 rounded-md px-2">
                        <FaEnvelope  className = "text-gray-400"/>
                        <input
                        type = "email"
                        name = "email"
                        placeholder = "Type your email"
                        value = {formData.email}
                        onChange = {handleChange}
                        className = "w-full p-2 bg-transparent outline-none text-white placeholder-gray-400"
                    />
                    </div>
                    <label className = "block text-sm mb-1">Password</label>
                    <div className = "flex items-center bg-gray-700 mb-4 rounded-md px-2">
                        <FaLock className = "text-gray-400"/>
                        <input
                            type = "password"
                            name = "password"
                            placeholder = "Create your password"
                            onChange = {handleChange}
                            value = {formData.password}
                            className = "w-full p-2 bg-transparent outline-none text-white placeholder-gray-400"
                        />
                    </div>
                    <label className = "block text-sm mb-1">Confirm Password</label>
                    <div className = "flex items-center bg-gray-700 mb-6 rounded-md px-2">
                        <FaLock className = "text-gray-400"/>
                        <input
                            type = "password"
                            name = "confirmPassword"
                            placeholder = "Confirm your password"
                            onChange = {handleChange}
                            value = {formData.confirmPassword}
                            className = "w-full p-2 bg-transparent outline-none text-white placeholder-gray-400"
                        />
                    </div>

                    <motion.button
                        type = "submit"
                        whileHover = {{ scale: 1.05 }}
                        className = "flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 w-full py-2 rounded-md font-semibold transition-colors"
                    >
                        <FaSignInAlt /> Sign Up as {formData.role === "admin" ? "Admin" : "Member"}
                    </motion.button>

                    <p className = "text-center text-sm text-gray-300 mt-4">
                        Already have an account?{" "}
                        <Link
                            className = "text-blue-400 cursor-pointer hover:underline inline"
                            to = "/">Sign in</Link>
                    </p>
        </form>
        </div>
    )
}

export default SignupPage;