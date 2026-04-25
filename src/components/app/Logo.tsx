import { Link } from "react-router-dom"

const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-2 group cursor-pointer no-underline">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform duration-300 shadow-lg shadow-primary/20">
        <span className="text-primary-foreground font-black text-xl italic leading-none">b</span>
      </div>
      <span className="text-2xl font-bold tracking-tight text-foreground">
        bloc
      </span>
    </Link>
  )
}

export default Logo