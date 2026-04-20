import { Routes, Route } from 'react-router-dom'
import './App.css'
import Homepage from '@/pages/Homepage'
import Watchpage from '@/pages/Watchpage'
import { ModeToggle } from '@/components/mode-toggle'

function App() {

  return (
    <>
      <div className="absolute bottom-4 right-4 z-50">
        <ModeToggle />
      </div>
      <Routes>
        <Route path='/' element={<Homepage />} />
        <Route path='/watch' element={<Watchpage />} />
      </Routes>
    </>
  )
}

export default App
