import { Routes, Route } from 'react-router-dom'
import './App.css'
import Landing from '@/pages/Landing'
import Watchpage from '@/pages/Watchpage'
import Dashboard from '@/pages/Dashboard'
import Library from '@/pages/Library'
import Explore from '@/pages/Explore'
import PathDetails from '@/pages/PathDetails'
import { AuthProvider } from '@/components/auth-provider'

function App() {

  return (
    <AuthProvider>
      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/explore' element={<Explore />} />
        <Route path='/explore/:id' element={<PathDetails />} />
        <Route path='/library' element={<Library />} />
        <Route path='/watch' element={<Watchpage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
