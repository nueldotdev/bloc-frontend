import { Button } from '../ui/button'
import { ArrowUp } from 'lucide-react'

const scrollToTop = () => {
  return (
    <Button variant="outline" className="rounded-md cursor-pointer fixed bottom-4 right-4 z-50" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      <ArrowUp />
    </Button>
  )
}

export default scrollToTop