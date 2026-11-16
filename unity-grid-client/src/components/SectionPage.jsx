import { Link } from 'react-router-dom'

const toneClasses = {
  rose: 'bg-[#fff0f1] text-[#d34e5b]',
  blue: 'bg-[#edf3ff] text-[#4a6fc7]',
  green: 'bg-[#edf8f1] text-[#36825d]',
  amber: 'bg-[#fff6e8] text-[#b57d2d]',
}

const badgeClasses = {
  rose: 'bg-[#fff0f1] text-[#cb5059]',
  blue: 'bg-[#eff3ff] text-[#5370bd]',
  green: 'bg-[#edf8f1] text-[#37815b]',
  amber: 'bg-[#fff5e4] text-[#ad772e]',
}

function SectionPage({ section }) {
  return (
    <main className="min-h-[calc(100vh-150px)] pb-[72px]">
      <header className="border-b border-[#e8edf4] bg-gradient-to-r from-[#f3f7ff] to-[#f8f7ff] py-[38px] max-[600px]:py-7">
        <div className="mx-auto w-[min(940px,calc(100%-48px))] max-[600px]:w-[calc(100%-32px)]">
          <Link className="text-[11px] font-bold text-slate-500 hover:text-[#496bd1]" to="/">← Back to UnityGrid</Link>
          <div className="mt-7 flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-[13px] border border-[#e4e9f4] bg-white text-[22px] text-[#526dc2]">{section.icon}</span>
            <div>
              <span className="text-[9px] font-extrabold tracking-[1.1px] text-[#71809a]">{section.category}</span>
              <h1 className="mt-1.5 text-[clamp(26px,4vw,36px)] font-bold leading-tight tracking-[-1.2px] text-[#1c2a40]">{section.title}</h1>
              <p className="mt-2 text-xs leading-relaxed text-[#738197]">{section.description}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto w-[min(940px,calc(100%-48px))] pt-[34px] max-[600px]:w-[calc(100%-32px)]">
        <div className="mb-[14px] flex items-center justify-between">
          <div><h2 className="m-0 text-base font-semibold text-[#29374d]">{section.shortTitle}</h2><p className="mt-[5px] text-[10px] text-[#909bad]">Sample content for the UnityGrid demo.</p></div>
          <span className="rounded border border-[#e4eaf5] bg-white px-2 py-1.5 text-[8px] font-extrabold tracking-[.6px] text-[#7d8ca5]">DEMO DATA</span>
        </div>
        <div className="grid gap-[10px]">
          {section.items.map((item) => (
            <article className="flex items-center gap-[14px] rounded-[10px] border border-[#e7ebf2] bg-white p-4 max-[600px]:flex-wrap max-[600px]:items-start max-[600px]:gap-[11px] max-[600px]:p-[13px]" key={item.title}>
              <span className={`grid size-[42px] shrink-0 place-items-center rounded-[10px] text-[13px] font-extrabold max-[600px]:size-9 ${toneClasses[item.tone] ?? toneClasses.blue}`}>{item.symbol}</span>
              <div className="min-w-0 flex-1 max-[600px]:basis-[calc(100%-50px)]">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="m-0 text-xs font-semibold text-[#2f3d53]">{item.title}</h3>
                  <span className={`rounded px-1.5 py-1 text-[7px] font-extrabold tracking-[.4px] ${badgeClasses[item.tone] ?? badgeClasses.blue}`}>{item.badge}</span>
                </div>
                <p className="my-[5px] text-[10px] text-[#758297]">{item.subtitle}</p>
                <span className="mt-[5px] block text-[9px] text-[#99a3b2]">{item.meta}</span>
                {item.note && <span className="mt-[5px] block text-[9px] text-[#428260]">✓ {item.note}</span>}
              </div>
              {section.action && <Link className="shrink-0 rounded-md border border-[#e2e8f4] px-2.5 py-[9px] text-[9px] font-bold text-[#526dc2] hover:bg-[#f4f6fd] max-[600px]:ml-[47px]" to="/#join">{section.action} <span className="ml-1">→</span></Link>}
            </article>
          ))}
        </div>
        <p className="mt-[13px] text-[9px] leading-relaxed text-[#9da7b5]">Demo only — these requests and figures are illustrative and are not connected to a live database.</p>
      </section>
    </main>
  )
}

export default SectionPage
