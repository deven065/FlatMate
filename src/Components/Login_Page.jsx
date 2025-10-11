import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { useState, useEffect } from 'react';
import { FaEnvelope, FaLock, FaSignInAlt, FaUser, FaUserShield } from 'react-icons/fa';
import { motion as Motion } from "framer-motion";
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';

const LoginPage = () => {
    const navigate = useNavigate();

    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [activeTab, setActiveTab] = useState("admin");
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        const savedEmail = localStorage.getItem("rememberedEmail");
        if (savedEmail) {
            setLoginData((prev) => ({ ...prev, email: savedEmail }));
            setRememberMe(true);
        }
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle("dark");
    };

    const handleChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
            const uid = userCredential.user.uid;

            const roleSnap = await get(ref(db, `users/${uid}/role`));
            const role = roleSnap.val();

            if (!role) throw new Error("No role set in database");

            if (rememberMe) {
                localStorage.setItem("rememberedEmail", loginData.email);
            } else {
                localStorage.removeItem("rememberedEmail");
            }

            localStorage.setItem("role", role);
            setActiveTab("AdminDashboard");

            navigate(role === "admin" ? "/admin" : "/member");
        } catch (error) {
            alert("Login failed: " + error.message);
        }
    };

    const handleForgotPassword = async () => {
        if (!loginData.email) {
            alert("Please enter your email to reset password.");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, loginData.email);
            alert("Password reset email sent successfully.");
        } catch (error) {
            alert("Failed to send reset email: " + error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 transition-colors duration-300">
            <Motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={toggleDarkMode}
                transition={{ duration: 0.15 }}
                className="absolute top-4 right-4 px-4 py-2 bg-transparent dark:bg-gray-700 text-gray-800 dark:text-white rounded"
            >
                {isDarkMode ? "🔆 Light Mode" : "🌙 Dark Mode"}
            </Motion.button>

            <Motion.form
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, type: "easeOut" }}
                onSubmit={handleLogin}
                className="bg-[#1e293b] text-white p-8 rounded-xl shadow-xl w-full max-w-md"
            >
                <h1 className="text-2xl font-bold text-center mb-2">Society Maintenance</h1>
                <p className="text-center mb-6 text-sm text-gray-300">
                    Manage your society maintenance with ease
                </p>

                <div className="flex justify-between mb-6">
                    <Motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center justify-center gap-2 flex-1 mr-2 py-2 rounded-md transition-colors ${activeTab === "member" ? "bg-blue-600" : "bg-gray-700"}`}
                        onClick={() => setActiveTab("member")}
                    >
                        <FaUser /> Member Login
                    </Motion.button>

                    <Motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-md transition-colors ${activeTab === "admin" ? "bg-blue-600" : "bg-gray-700"}`}
                        onClick={() => setActiveTab("admin")}
                    >
                        <FaUserShield className="w-5" /> Admin Login
                    </Motion.button>
                </div>

                <label className="block text-sm mb-1">Email Address</label>
                <div className="flex items-center bg-gray-700 mb-4 rounded-md px-2">
                    <FaEnvelope className="text-gray-400" />
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={loginData.email}
                        onChange={handleChange}
                        className="w-full p-2 bg-transparent outline-none text-white placeholder-gray-400"
                    />
                </div>

                <label className="block text-sm mb-1">Password</label>
                <div className="flex items-center bg-gray-700 mb-2 rounded-md px-2">
                    <FaLock className="text-gray-400" />
                    <input
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={handleChange}
                        className="w-full p-2 bg-transparent outline-none text-white placeholder-gray-400"
                    />
                </div>

                <div className="flex items-center justify-between text-sm text-gray-300 mb-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={() => setRememberMe(!rememberMe)}
                        />
                        Remember me
                    </label>
                    <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-blue-400 hover:underline"
                    >
                        Forgot password?
                    </button>
                </div>

                <Motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 w-full py-2 rounded-md font-semibold transition-colors"
                >
                    <FaSignInAlt /> Sign In
                </Motion.button>

                <p className="text-center text-sm text-gray-300 mt-4">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-blue-400 hover:underline inline">
                        Sign up now
                    </Link>
                </p>
            </Motion.form>
        </div>
    );
};

export default LoginPage;
