import { useState, Fragment } from 'react'
import './App.css'
import { Routes, Route } from "react-router-dom";
import SignupPage from './Components/Signup_Page'
import LoginPage from './Components/Login_Page'

function App() {
  return (
    <Fragment>
      <Routes>
        <Route path = "/" element = {<LoginPage />} />
        <Route path = "/signup" element = {<SignupPage />} />
        {/* <button onClick = {putData}>Put Data</button> */}
      </Routes>
      </Fragment>
  )
}

export default App