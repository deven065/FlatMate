import './App.css'
import { Routes, Route } from "react-router-dom";
import SignupPage from './Components/Signup_Page'
import LoginPage from './Components/Login_Page'
import ProtectedRoute from './Components/Admin/ProtectedRoute'
import AdminDashboard from './Components/Admin/AdminDashboard';
import MemberDashboard from './Components/Member/MemberDashboard'
import { Fragment } from 'react';

function App() {
  return (
    <Fragment>
      <Routes>
        <Route path = "/" element = {<LoginPage />} />
        <Route path = "/signup" element = {<SignupPage />} />

        {/* Role based routes */}
        <Route
            path = "/admin"
            element = {
              <ProtectedRoute requiredRole = "admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
        />
        <Route 
          path = "/member"
          element = {
            <ProtectedRoute>
              <MemberDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      </Fragment>
  )
}

export default App