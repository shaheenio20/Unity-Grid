const footerSections = [
  { title: 'Get involved', links: ['Blood Network', 'Campus Events', 'Crisis & Relief'] },
  { title: 'Explore', links: ['About UnityGrid', 'Community Guidelines', 'Contact'] },
]

function Footer() {
  return (
    <footer className="bg-[#14243a] text-white">
      <div className="mx-auto grid w-[min(1120px,calc(100%-48px))] grid-cols-[1.4fr_1fr_1fr] gap-10 py-11 max-[700px]:w-[calc(100%-32px)] max-[700px]:grid-cols-2 max-[700px]:gap-x-6 max-[700px]:gap-y-8 max-[420px]:grid-cols-1">
        <div className="max-[700px]:col-span-full">
          <div className="flex items-center gap-[10px]">
            <span className="grid size-[36px] place-items-center rounded-[10px] bg-white/10 text-[15px] font-extrabold text-white ring-1 ring-white/15">
              U<span className="-ml-[4px] text-[#ff8585]">+</span>
            </span>
            <span className="text-[17px] font-extrabold tracking-[-.6px]">UnityGrid</span>
          </div>
          <p className="mb-0 mt-4 max-w-[310px] text-[11px] leading-[1.8] text-[#b8c4d4]">
            Bringing campus communities together to support one another and respond when it matters.
          </p>
        </div>

        {footerSections.map((section) => (
          <div key={section.title}>
            <h2 className="m-0 text-[11px] font-bold text-white">{section.title}</h2>
            <ul className="mt-4 grid list-none gap-3 p-0">
              {section.links.map((label) => (
                <li className="text-[10px] text-[#b8c4d4]" key={label}>{label}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-[min(1120px,calc(100%-48px))] items-center justify-between gap-3 py-4 text-[9px] text-[#9eacbf] max-[700px]:w-[calc(100%-32px)] max-[500px]:items-start max-[500px]:flex-col">
          <span>© {new Date().getFullYear()} UnityGrid · A community-first initiative</span>
          <span>Built on campus. Ready for the community.</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
