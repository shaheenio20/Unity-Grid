import { useState } from 'react'
import { Link } from 'react-router-dom'

const links = ['Departments', 'Events', 'Blood Network', 'Crisis & Relief', 'Messages']

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 border-b border-[#e8ebf0] bg-white/95 backdrop-blur">
      <div className="bg-[#a81720] px-4 py-[9px] text-center text-[10px] font-semibold tracking-[.25px] text-white max-[600px]:text-[9px]">
        UNITYGRID · CAMPUS & COMMUNITY SUPPORT NETWORK
      </div>
      <nav className="mx-auto flex min-h-[68px] w-[min(1180px,calc(100%-48px))] items-center gap-8 max-[1000px]:w-[calc(100%-32px)] max-[760px]:min-h-[62px] max-[760px]:flex-wrap max-[760px]:gap-3" aria-label="Main navigation">
        <div className="flex shrink-0 items-center gap-[9px]" aria-label="UnityGrid">
          <span className="grid size-[36px] place-items-center rounded-[10px] bg-[#173b69] text-[16px] font-extrabold text-white">U<span className="-ml-[4px] text-[#ff7474]">+</span></span>
          <span className="text-[17px] font-extrabold tracking-[-.7px] text-[#1c2b40]">UnityGrid</span>
        </div>

        <button
          className="ml-auto hidden size-9 flex-col justify-center gap-[5px] rounded-lg border border-[#e7ebf2] bg-white p-2 max-[760px]:flex"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="block h-0.5 rounded-sm bg-[#596980]" />
          <span className="block h-0.5 rounded-sm bg-[#596980]" />
          <span className="block h-0.5 rounded-sm bg-[#596980]" />
        </button>

        <div className={`flex flex-1 items-center justify-between gap-5 max-[1000px]:gap-3 max-[760px]:flex-[0_0_100%] max-[760px]:flex-col max-[760px]:items-stretch max-[760px]:gap-0 max-[760px]:pb-4 ${menuOpen ? 'max-[760px]:flex' : 'max-[760px]:hidden'}`}>
          <div className="ml-auto flex items-center gap-[clamp(13px,1.8vw,25px)] max-[1000px]:gap-3 max-[760px]:ml-0 max-[760px]:flex-col max-[760px]:items-stretch max-[760px]:gap-0">
            {links.map((label) => (
              <span className="whitespace-nowrap py-2 text-[11px] font-semibold text-[#56647a] max-[760px]:border-b max-[760px]:border-[#eef1f5] max-[760px]:py-3 max-[760px]:text-xs" key={label}>
                {label}
              </span>
            ))}
          </div>
          <Link to="/login" className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#dce2eb] px-4 text-[11px] font-bold text-[#42536c] max-[760px]:mx-auto max-[760px]:mt-3 max-[760px]:w-[calc(100%-32px)]">
            Sign In
          </Link>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
