import { useState } from 'react'
import { Link } from 'react-router-dom'
import { portalSections, stats } from '../../data/portalData'

const statIconTones = {
  rose: 'bg-[#f8edf0]',
  blue: 'bg-[#ebf2ff]',
  violet: 'bg-[#f2edfc]',
  green: 'bg-[#eaf6ef] text-[#20855c] text-[13px] font-bold',
}

const previewTones = {
  rose: 'bg-[#fff0f1] text-[#d34e5b]',
  blue: 'bg-[#edf3ff] text-[#4a6fc7]',
  green: 'bg-[#edf8f1] text-[#36825d]',
  amber: 'bg-[#fff6e8] text-[#b57d2d]',
}

function Home() {
  const [message, setMessage] = useState('')
  const [parsed, setParsed] = useState(null)

  function handleParse(event) {
    event.preventDefault()
    if (!message.trim()) return

    const text = message.trim()
    const bloodGroup = text.match(/\b(AB[+-]|[ABO][+-])\b/i)?.[0]?.toUpperCase() ?? 'Not specified'
    const location = ['নবীগঞ্জ', 'সুনামগঞ্জ', 'সিলেট', 'হবিগঞ্জ']
      .find((place) => text.includes(place)) ?? 'Location in message'
    const needs = [
      ['শুকনো খাবার', 'Dry food'],
      ['খাবার', 'Food'],
      ['নৌকা', 'Boat'],
      ['রক্ত', 'Blood'],
      ['ওষুধ', 'Medicine'],
      ['পানি', 'Drinking water'],
      ['saline', 'Saline'],
    ].filter(([keyword]) => text.toLowerCase().includes(keyword.toLowerCase()))
      .map(([, label]) => label)
    const phone = text.match(/01[3-9]\d{8}/)?.[0] ?? 'Not provided'

    setParsed({
      location,
      needs: [...new Set(needs)].join(', ') || 'Needs detected in message',
      bloodGroup,
      phone,
      urgency: /জরুরি|এখনই|urgent|emergency/i.test(text) ? 'Critical' : 'Urgent',
    })
  }

  return (
    <main className="bg-[#f8fafc] text-[#17243b]">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#f8fbff] via-[#f1f6ff] to-[#f4f3ff] px-6 py-[74px] max-[700px]:px-4 max-[700px]:py-[48px]">
        <div className="relative z-10 mx-auto grid w-full max-w-[1120px] grid-cols-[minmax(0,1fr)_minmax(410px,0.87fr)] items-center gap-[62px] max-[900px]:grid-cols-2 max-[900px]:gap-7 max-[700px]:grid-cols-1 max-[700px]:gap-[31px]">
          <div>
            <div className="mb-[22px] flex items-center gap-[9px] text-[10px] font-extrabold tracking-[1.35px] text-[#52647e]">
              <span className="size-2 rounded-full bg-[#21a674] shadow-[0_0_0_4px_#21a6741c]" />
              ONE CAMPUS. ONE COMMUNITY. READY TO HELP.
            </div>
            <h1 className="m-0 text-[clamp(38px,4.1vw,55px)] font-extrabold leading-[1.14] tracking-[-2.3px] text-[#17243b] max-[900px]:text-[42px] max-[700px]:max-w-[500px] max-[700px]:text-[clamp(38px,10vw,48px)]">
              From campus collaboration to <span className="text-[#416ce2]">crisis response.</span>
            </h1>
            <p className="mb-[25px] mt-5 max-w-[515px] text-[15px] leading-[1.8] text-[#617087] max-[700px]:text-[13px]">
              A connected platform for campus clubs, emergency blood donations, and fast, coordinated disaster relief—powered by people, made smarter with AI.
            </p>
            <div className="flex flex-wrap gap-[11px] max-[420px]:flex-col max-[420px]:items-stretch">
              <Link className="inline-flex min-h-[46px] items-center gap-[9px] rounded-lg bg-[#e34f5c] px-[17px] text-xs font-bold text-white shadow-[0_7px_18px_#e34f5c30] transition-transform hover:-translate-y-0.5 max-[420px]:justify-center" to="/blood"><span className="text-[19px] leading-none">＋</span> Find a blood donor</Link>
              <a className="inline-flex min-h-[46px] items-center gap-[9px] rounded-lg border border-[#e0e6f0] bg-white px-[17px] text-xs font-bold text-[#34445c] transition-transform hover:-translate-y-0.5 max-[420px]:justify-center" href="#sos"><span className="text-[17px] text-[#e18b28]">↗</span> Request emergency help</a>
            </div>
            <div className="mt-[30px] flex items-center gap-3">
              <div className="flex pl-1">
                <span className="z-30 grid size-[27px] place-items-center rounded-full border-2 border-[#f5f8ff] bg-[#dce6f6] text-[9px] font-extrabold text-[#465e83]">R</span>
                <span className="-ml-[5px] z-20 grid size-[27px] place-items-center rounded-full border-2 border-[#f5f8ff] bg-[#f3ded8] text-[9px] font-extrabold text-[#9c5247]">N</span>
                <span className="-ml-[5px] z-10 grid size-[27px] place-items-center rounded-full border-2 border-[#f5f8ff] bg-[#e4dff4] text-[9px] font-extrabold text-[#695694]">S</span>
                <span className="-ml-[5px] grid size-[27px] place-items-center rounded-full border-2 border-[#f5f8ff] bg-[#e5ecff] text-[9px] font-extrabold text-[#4667be]">+</span>
              </div>
              <p className="m-0 text-[11px] text-[#758298]"><strong className="text-[#33425a]">340+ donors</strong> ready to show up for their community</p>
            </div>
          </div>

          <div className="rounded-[15px] border border-[#e6eaf2] bg-white p-[23px] shadow-[0_18px_55px_#30456812] max-[700px]:p-[18px]" id="sos">
            <div className="flex items-center gap-3">
              <div className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-[#f0ebff] text-xl text-[#7354ce]">✳</div>
              <div><span className="text-[10px] font-extrabold tracking-[1.35px] text-[#52647e]">AI-ASSISTED SOS</span><h2 className="mt-[3px] text-[17px] font-semibold tracking-[-.5px] text-[#1c2a40]">Turn a message into action</h2></div>
              <span className="ml-auto self-start rounded bg-[#f2effa] px-[7px] py-[5px] text-[8px] font-extrabold tracking-[.8px] text-[#7257c3]">BETA</span>
            </div>
            <p className="my-4 text-[11px] leading-[1.65] text-[#778398]">Paste an emergency post in Bangla or Banglish. UnityGrid will organize the key details for responders.</p>
            <form onSubmit={handleParse}>
              <label className="sr-only" htmlFor="sos-message">Emergency message</label>
              <textarea
                id="sos-message"
                className="min-h-28 w-full resize-y rounded-lg border border-[#e0e5ed] bg-[#fbfcfe] p-3 text-xs leading-relaxed text-[#34445c] outline-none transition focus:border-[#8871df] focus:ring-[3px] focus:ring-[#8871df1b] placeholder:text-[#a0a9b8]"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="যেকোনো জরুরি মেসেজ বা পোস্ট এখানে পেস্ট করুন (বাংলা বা বাংলিশে)..."
                rows="4"
              />
              <div className="mt-2.5 flex items-center justify-between gap-[9px] max-[420px]:items-start max-[420px]:flex-col">
                <span className="text-[9px] text-[#9aa4b4]"><span className="mr-1">▣</span> Your message stays on this page</span>
                <button className="inline-flex min-h-[37px] items-center gap-2 rounded-[7px] bg-[#6552c9] px-3 text-[10px] font-bold text-white transition hover:-translate-y-px hover:bg-[#5342b1] max-[420px]:self-end" type="submit"><span className="text-[#e2d7ff]">✦</span> Parse with Gemini AI <span>→</span></button>
              </div>
            </form>
            <div className="mt-[14px] flex gap-[7px] border-t border-[#eff1f5] pt-3 text-[9px] leading-relaxed text-[#8b95a6]"><span className="text-[#8d77dc]">✦</span><span>Try: “নবীগঞ্জে পানিবন্দি ৪টি পরিবার, শুকনো খাবার ও O+ রক্ত লাগবে...”</span></div>
            {parsed && (
              <div className="mt-4 rounded-[9px] border border-[#e7e2fc] bg-[#fcfbff] p-[14px]" aria-live="polite">
                <div className="flex items-center justify-between">
                  <div><span className="text-[8px] font-extrabold tracking-[1.35px] text-[#8470cc]">SOS PREVIEW · DEMO PARSE</span><h3 className="mt-[3px] text-sm font-semibold text-[#29364b]">Request details</h3></div>
                  <span className="rounded-xl bg-[#fff0ef] px-2 py-[5px] text-[9px] font-extrabold text-[#b7494d]">{parsed.urgency}</span>
                </div>
                <div className="mt-[13px] grid grid-cols-2 gap-[11px]">
                  <div className="grid gap-[3px]"><span className="text-[8px] font-bold tracking-[.7px] text-[#919bad]">LOCATION</span><strong className="text-[10px] text-[#35435b]">{parsed.location}</strong></div>
                  <div className="grid gap-[3px]"><span className="text-[8px] font-bold tracking-[.7px] text-[#919bad]">NEEDS</span><strong className="text-[10px] text-[#35435b]">{parsed.needs}</strong></div>
                  <div className="grid gap-[3px]"><span className="text-[8px] font-bold tracking-[.7px] text-[#919bad]">BLOOD GROUP</span><strong className="text-[10px] text-[#35435b]">{parsed.bloodGroup}</strong></div>
                  <div className="grid gap-[3px]"><span className="text-[8px] font-bold tracking-[.7px] text-[#919bad]">CONTACT</span><strong className="text-[10px] text-[#35435b]">{parsed.phone}</strong></div>
                </div>
                <p className="mb-0 mt-3 text-[9px] leading-relaxed text-[#9a8b59]">Demo only — Gemini AI is not connected yet. Details are extracted locally from your text.</p>
              </div>
            )}
          </div>
        </div>
        <div className="pointer-events-none absolute -right-[180px] -top-[190px] -z-10 size-[400px] rounded-full bg-[#dce8ff70]" />
        <div className="pointer-events-none absolute -bottom-[240px] left-[44%] -z-10 size-[300px] rounded-full bg-[#e6e2ff70]" />
      </section>

      <section className="border-b border-[#edf0f5] bg-white py-[29px] pb-[19px]" aria-label="UnityGrid impact">
        <div className="mx-auto grid w-[min(1120px,calc(100%-48px))] grid-cols-4 gap-[14px] max-[700px]:w-[min(100%-32px,520px)] max-[700px]:grid-cols-2 max-[700px]:gap-[9px]">
          {stats.map((stat) => <article className="min-h-[139px] rounded-[10px] border border-[#e9edf3] bg-white p-[15px] max-[700px]:min-h-[127px] max-[700px]:p-3" key={stat.label}>
            <div className="flex items-center justify-between">
              <span className={`grid size-[29px] place-items-center rounded-lg text-sm ${statIconTones[stat.tone] ?? 'bg-[#ebf2ff]'}`}>{stat.icon}</span>
              <span className="text-[8px] font-extrabold tracking-[.7px] text-[#a4adba]">↗ LIVE</span>
            </div>
            <strong className="mt-[11px] block text-2xl tracking-[-.7px] text-[#22314a] max-[700px]:text-[21px]">{stat.value}</strong>
            <span className="mt-0.5 block text-[10px] font-bold text-[#53627a]">{stat.label}</span>
            <span className="mt-[5px] block text-[9px] text-[#a0a9b7]">{stat.note}</span>
          </article>)}
        </div>
        <p className="mx-6 mb-0 mt-[10px] text-center text-[9px] text-[#a9b0bc]">Illustrative demo figures · Live database connection not configured</p>
      </section>

      <section className="mx-auto w-[min(1120px,calc(100%-48px))] pb-[62px] pt-[66px] max-[700px]:w-[min(100%-32px,520px)] max-[700px]:pb-[45px] max-[700px]:pt-[49px]">
        <div className="mb-5">
          <span className="text-[10px] font-extrabold tracking-[1.35px] text-[#52647e]">EXPLORE UNITYGRID</span>
          <h2 className="mt-[7px] text-[27px] font-bold tracking-[-1px] text-[#1d2b42] max-[700px]:text-[23px]">One platform, <span className="text-[#416ce2]">many ways to help.</span></h2>
          <p className="mt-[7px] text-[11px] text-[#7d899a]">Here’s a quick look. Open a section to see more.</p>
        </div>
        <div className="grid grid-cols-4 gap-[13px] max-[900px]:grid-cols-2 max-[700px]:gap-[9px] max-[420px]:grid-cols-1">
          {Object.entries(portalSections).map(([route, section]) => {
            const item = section.items[0]
            return (
              <article className="min-w-0 rounded-[10px] border border-[#e7ebf2] bg-white p-[15px] max-[700px]:p-3" key={route}>
                <div className="flex items-center gap-2">
                  <span className={`grid size-[29px] place-items-center rounded-lg text-sm ${previewTones[item.tone] ?? previewTones.blue}`}>{section.icon}</span>
                  <span className="text-[7px] font-extrabold tracking-[.55px] text-[#96a0b0]">{section.category}</span>
                </div>
                <h3 className="mb-1.5 mt-[14px] text-[13px] font-semibold text-[#2e3c52]">{section.shortTitle}</h3>
                <p className="m-0 min-h-[34px] text-[9px] leading-relaxed text-[#8995a6]">{section.description}</p>
                <div className="mt-[13px] grid min-h-[55px] gap-1 rounded-md bg-[#f7f9fc] p-[9px]">
                  <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[9px] text-[#4a586e]">{item.title}</strong>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[8px] text-[#96a0ae]">{item.subtitle}</span>
                </div>
                <Link className="mt-[13px] inline-block text-[9px] font-bold text-[#526dc2] hover:text-[#334fa7]" to={`/${route}`}>Explore {section.shortTitle} <span className="ml-1">→</span></Link>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mx-auto mb-[58px] flex w-[min(1120px,calc(100%-48px))] items-center justify-between gap-5 rounded-xl border border-[#e6eaf4] bg-gradient-to-r from-[#f0f4ff] to-[#f7f5ff] px-[27px] py-6 max-[700px]:mb-[38px] max-[700px]:w-[calc(100%-32px)] max-[700px]:items-start max-[700px]:flex-col max-[700px]:p-5" id="join">
        <div className="flex items-center gap-[13px]">
          <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-[#e8eaff] text-[21px] text-[#5d62cc]">✳</span>
          <div><h2 className="m-0 text-sm font-semibold text-[#2e3a52]">Small actions. Stronger communities.</h2><p className="mb-0 mt-[5px] text-[9px] text-[#7e899b]">Join students and volunteers making campus life safer, kinder, and more connected.</p></div>
        </div>
        <a href="mailto:hello@unitygrid.example" className="shrink-0 rounded-[7px] bg-[#5369c5] px-[14px] py-[11px] text-[9px] font-bold text-white transition-transform hover:-translate-y-0.5">Join the community <span>→</span></a>
      </section>
    </main>
  )
}

export default Home
