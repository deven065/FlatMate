import { useState } from 'react'
import './App.css'
import SignupPage from './Components/Signup_Page'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <SignupPage />
    </>
  )
}

export default App
