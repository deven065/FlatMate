import { useState } from 'react';
import { FaEnvelope, FaLock, FaSignInAlt, FaUser, FaUserShield } from 'react-icons/fa';
import { motion } from "framer-motion";
import { Link } from 'react-router-dom';

const LoginPage = () => {
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle("dark");
    };

    const handleChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const users = JSON.parse(localStorage.getItem("users")) || [];

        const userExists = users.find(user =>
            user.email === loginData.email && user.password === loginData.password
        );

        if (userExists) {
            alert("Login successful!");
            // Redirect to dashboard or homepage
        } else {
            alert("Invalid email or password.");
        }
    };

    const [activeTab, setActiveTab] = useState("admin") // default: Member

    return (
        // Page fade-in animation
        <motion.div 
            initial = {{ opacity: 0 }}
            animate = {{ opacity: 1 }}
            transition = {{ duration: 0.3 }}
            className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 transition-colors duration-300">
                
                {/* Dark mode toggle button with hover animation */}
                <motion.button
                    whileTap = {{ scale: 0.95 }}
                    whileHover = {{ scale: 1.05 }}
                    onClick={toggleDarkMode}
                    transition = {{ duration: 0.15 }}
                    className="absolute top-4 right-4 px-4 py-2 bg-transparent dark:bg-gray-700 text-gray-800 dark:text-white rounded"
                >
                    {isDarkMode ? "🔆 Light Mode" : "🌙 Dark Mode"}
                </motion.button>

                {/* Pop-In animation for form */}
                <motion.form 
                intial = {{ scale: 0.9, opacity: 0 }}
                animate = {{ scale: 1, opacity: 1 }}
                transition = {{ duration: 0.35, type: "easeOut" }}
                onSubmit={handleLogin}
                className="bg-[#1e293b] text-white p-8 rounded-xl shadow-xl w-full max-w-md">
                    <h1 className="text-2xl font-bold text-center mb-2">FlatMate</h1>
                    <p className="text-center mb-6 text-sm text-gray-300">
                        Admin Login to Society Maintenance
                    </p>

                    {/* Toggle Tabs */}
                    <div className = "flex justify-between mb-6">
                        <motion.button
                            type = "button"
                            whileHover = {{ scale: 1.05 }}
                            whileTap = {{ scale: 0.95 }}
                            className = {`flex items-center justify-center gap-2 flex-1 mr-2 py-2 rounded-md transition-colors ${
                                activeTab === "member" ? "bg-blue-600" : "bg-gray-700"
                            }`}
                            onClick = {()=> setActiveTab("member")}
                        >
                            <FaUser /> Member Login
                        </motion.button>

                        <motion.button
                            type = "button"
                            whileHover = {{ scale: 1.05 }}
                            whileTap = {{ scale: 0.95 }}
                            className = {`flex items-center justify-center gap-2 flex-1 mr-2 py-2 rounded-md transition-colors ${
                                activeTab === "admin" ? "bg-blue-600" : "bg-gray-700"
                            }`}
                            onClick = {() => setActiveTab("admin")}
                        >
                            <FaUserShield className = "w-5"/>Admin Loin
                        </motion.button>
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
                    <div className="flex items-center bg-gray-700 mb-6 rounded-md px-2">
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

                    <motion.button
                        type="submit"
                        whileHover = {{ scale: 1.05 }}
                        whileTap = {{ scale: 0.95 }}
                        className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 w-full py-2 rounded-md font-semibold transition-colors"
                    >
                        <FaSignInAlt /> Sign In
                    </motion.button>

                    <p className="text-center text-sm text-gray-300 mt-4">
                        Don't have an account?{" "}
                        <Link to = "/signup" className = "text-blue-400 hover:underline inline">
                            Sign up
                        </Link>
                    </p>
                </motion.form>
        </motion.div>
    );
};

export default LoginPage;