import { useState, Fragment } from 'react'
import './App.css'
import { Routes, Route } from "react-router-dom";
import SignupPage from './Components/Signup_Page'
import LoginPage from './Components/Login_Page'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Fragment>
      {/* <Navbar /> */}
      <Routes>
        <Route path = "/" element = {<LoginPage />} />
        <Route path = "/signup" element = {<SignupPage />} />
      </Routes>
      </Fragment>
  )
}

export default App
