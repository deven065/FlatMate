import { useState, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { db, auth }  from "./firebase";

import LoginPage from './Components/Login_Page';
import SignupPage from './Components/Signup_Page'
import AdminDashboard from './Components/Admin/AdminDashboard';
import MemberDashboard from './Components/Member/MemberDashboard'

function App() {
  const [user, setUser] = useState(null); // firebase user
  const [role, setRole] = useState(null); // 'admin' or 'member'
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscibe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const roleSnap = await get(ref(db, `users/${currentUser.uid}/role`));
        const fetchedRole = roleSnap.val();
        setUser(currentUser);
        setRole(fetchedRole);
        localStorage.setItem("role", fetchedRole);

        if (location.pathname === "/" || location.pathname === "/login") {
          navigate(fetchedRole === "admin" ? "/admin" : "/member");
        }
      } else {
        setUser(null);
        setRole(null);
        localStorage.removeItem("role");
      }
      setLoading(false);
    });

    return () => unsubscibe();
  }, [navigate, location.pathname]);

  const handleLogin = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const roleSnap = await get(ref(db, `users/${uid}/role`));
      const userRole = roleSnap.val();

      setUser(userCredential.user);
      setRole(userRole);
      localStorage.setItem("role", userRole);
      navigate(userRole === "admin" ? "/admin" : "/member");
    } catch (error) {
      alert("Login fialed: " + error.message);
    }
  };

  if (loading) return <div>Loading...</div> // Optional loader

  return (
    <Routes>
      <Route path="/" element= {<LoginPage onLogin={handleLogin}/>} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path='/admin'
        element= {
          user && role === "admin" ? <AdminDashboard /> : <Navigate to="/" />
        }
      />

      <Route
        path='/member'
        element={
          user && role === "member" ? <MemberDashboard /> : <Navigate to="/" />
        }
      />
    </Routes>
  )
}

export default App;