import { useState } from 'react'
import './App.css'
import SignupPage from './Components/Signup_Page'
import LoginPage from './Components/Login_Page'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    {/* <SignupPage /> */}
    <LoginPage />
    </>
  )
}

export default App
