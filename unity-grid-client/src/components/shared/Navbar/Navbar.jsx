import { useState } from 'react'
import { Link } from 'react-router-dom'

const links = [
  { label: 'Blood Network', to: '/blood' },
  { label: 'Crisis & Flood Hub', to: '/crisis' },
  { label: 'Club Events', to: '/events' },
  { label: 'Transparency Ledger', to: '/ledger' },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 border-b border-[#e9edf3] bg-white/95 backdrop-blur">
      <nav className="mx-auto flex min-h-[70px] w-[min(1180px,calc(100%-48px))] items-center justify-between gap-6 max-[1000px]:w-[calc(100%-32px)] max-[760px]:min-h-[62px] max-[760px]:flex-wrap" aria-label="Main navigation">
        <Link className="flex shrink-0 items-center gap-[9px]" to="/" aria-label="UnityGrid home">
          <span className="grid size-[35px] place-items-center rounded-[10px] bg-gradient-to-br from-[#446fe0] to-[#7157cf] text-[15px] font-extrabold tracking-[-1px] text-white shadow-[0_4px_11px_#526acf38]">U<span className="-ml-[3px] text-[11px] text-[#b7c8ff]">+</span></span>
          <span className="flex flex-col text-[15px] font-extrabold leading-[1.05] tracking-[-.5px] text-[#24334b]">Unity<span className="contents text-[#5772d0]">Grid</span><small className="mt-1 text-[6px] font-bold tracking-[1.05px] text-[#9aa4b4]">COMMUNITY RESPONSE NETWORK</small></span>
        </Link>
        <button className="hidden size-9 flex-col justify-center gap-[5px] rounded-lg border border-[#e7ebf2] bg-white p-2 max-[760px]:flex" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          <span className="block h-0.5 rounded-sm bg-[#596980]" /><span className="block h-0.5 rounded-sm bg-[#596980]" /><span className="block h-0.5 rounded-sm bg-[#596980]" />
        </button>
        <div className={`flex flex-1 items-center justify-between gap-5 max-[1000px]:gap-3 max-[760px]:flex-[0_0_100%] max-[760px]:items-stretch max-[760px]:flex-col max-[760px]:gap-[14px] max-[760px]:pb-[15px] ${menuOpen ? 'max-[760px]:flex' : 'max-[760px]:hidden'}`}>
          <div className="ml-auto flex items-center gap-[clamp(13px,2vw,26px)] max-[1000px]:gap-3 max-[760px]:ml-0 max-[760px]:items-stretch max-[760px]:flex-col max-[760px]:gap-0">
            {links.map((link) => <Link className="whitespace-nowrap text-[10px] font-semibold text-[#68768b] transition-colors hover:text-[#496bd1] max-[1000px]:text-[9px] max-[760px]:border-b max-[760px]:border-[#f0f2f6] max-[760px]:px-0.5 max-[760px]:py-[11px] max-[760px]:text-xs" key={link.to} to={link.to} onClick={() => setMenuOpen(false)}>{link.label}</Link>)}
          </div>
          <div className="flex items-center gap-[13px] max-[760px]:flex-col max-[760px]:items-stretch">
            <div className="inline-flex items-center gap-[7px] whitespace-nowrap rounded-full border border-[#dcefe4] bg-[#f3fbf6] px-2.5 py-2 text-[8px] font-bold text-[#438061] max-[1000px]:px-2 max-[1000px]:py-[7px] max-[1000px]:text-[7px] max-[760px]:self-start max-[760px]:text-[9px]"><i className="size-1.5 rounded-full bg-[#22a36a] shadow-[0_0_0_3px_#22a36a1c]" /><span>System: Normal Campus Mode</span></div>
            <Link className="btn rounded-xl border-0 bg-gradient-to-r from-[#2d6793] to-[#040d15] text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90 max-[760px]:w-full max-[760px]:justify-center" to="/login">Sign In</Link>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
