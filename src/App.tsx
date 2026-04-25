import { Routes, Route } from 'react-router-dom'
import './App.css'
import Landing from '@/pages/Landing'
import Watchpage from '@/pages/Watchpage'
import { ModeToggle } from '@/components/mode-toggle'

function App() {

  return (
    <>
      <div className="fixed bottom-4 left-4 z-50">
        <ModeToggle />
      </div>
      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/watch' element={<Watchpage />} />
      </Routes>
    </>
  )
}

export default App
