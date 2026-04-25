import { Routes, Route } from 'react-router-dom'
import './App.css'
import Landing from '@/pages/Landing'
import Watchpage from '@/pages/Watchpage'
import { ModeToggle } from '@/components/mode-toggle'
import { AuthProvider } from '@/components/auth-provider'

function App() {

  return (
    <AuthProvider>
      <div className="fixed bottom-4 left-4 z-50">
        <ModeToggle />
      </div>
      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/watch' element={<Watchpage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
