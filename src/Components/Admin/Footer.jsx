import { FaQuestionCircle, FaEnvelope, FaShieldAlt } from "react-icons/fa";

const Footer = () => {
    return (
    <footer className="w-full bg-[#1C2333] text-gray-400 px-6 py-3 flex justify-between items-center text-sm">
        <p>© 2025 FlatMate. All rights reserved.</p>
        <div className="flex gap-4 text-lg">
        <FaQuestionCircle className="hover:text-white cursor-pointer" />
        <FaEnvelope className="hover:text-white cursor-pointer" />
        <FaShieldAlt className="hover:text-white cursor-pointer" />
        </div>
    </footer>
    );
};

export default Footer;