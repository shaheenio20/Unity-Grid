import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="border-t border-[#e8ecf2] bg-white">
      <div className="mx-auto grid w-[min(1120px,calc(100%-48px))] grid-cols-[auto_1fr_auto] items-center gap-x-7 gap-y-[14px] py-[23px] max-[700px]:w-[calc(100%-32px)] max-[700px]:grid-cols-[1fr_auto]">
        <Link className="flex shrink-0 items-center gap-[9px]" to="/">
          <span className="grid size-[31px] place-items-center rounded-[10px] bg-gradient-to-br from-[#446fe0] to-[#7157cf] text-[13px] font-extrabold tracking-[-1px] text-white shadow-[0_4px_11px_#526acf38]">U<span className="-ml-[3px] text-[11px] text-[#b7c8ff]">+</span></span>
          <span className="flex flex-col text-[13px] font-extrabold leading-[1.05] tracking-[-.5px] text-[#24334b]">Unity<span className="contents text-[#5772d0]">Grid</span><small className="mt-1 text-[6px] font-bold tracking-[1.05px] text-[#9aa4b4]">COMMUNITY RESPONSE NETWORK</small></span>
        </Link>
        <p className="m-0 text-[9px] text-[#8994a4] max-[700px]:col-span-full max-[700px]:row-start-2">Built on campus. Ready for the community.</p>
        <div className="flex gap-[18px] max-[700px]:col-span-full max-[700px]:row-start-3 max-[700px]:flex-wrap max-[700px]:gap-3">
          <Link className="text-[9px] text-[#8792a2] hover:text-[#496bd1]" to="/blood">Blood Network</Link>
          <Link className="text-[9px] text-[#8792a2] hover:text-[#496bd1]" to="/events">Campus Events</Link>
          <Link className="text-[9px] text-[#8792a2] hover:text-[#496bd1]" to="/ledger">Public Ledger</Link>
        </div>
        <span className="col-span-full border-t border-[#f0f2f5] pt-3 text-[8px] text-[#a4adba] max-[700px]:row-start-4">© {new Date().getFullYear()} UnityGrid · A community-first initiative</span>
      </div>
    </footer>
  )
}

export default Footer
