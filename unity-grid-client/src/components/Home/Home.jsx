import { useState } from 'react'
import { Link } from 'react-router-dom'

const impactMetrics = [
  { icon: '✚', label: 'Active Blood Donors', tone: 'text-[#c92730] bg-[#fff0f0]' },
  { icon: '⌁', label: 'Open SOS Requests', tone: 'text-[#315f9d] bg-[#edf4ff]' },
  { icon: '⚑', label: 'Relief Teams', tone: 'text-[#25835e] bg-[#edf8f1]' },
  { icon: '✳', label: 'Campus Events', tone: 'text-[#7958bd] bg-[#f3efff]' },
]

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
    <main className="bg-[#f5f7fb] text-[#17243b]">
      <section className="border-b border-[#e9edf3] bg-white px-6 py-[58px] max-[700px]:px-4 max-[700px]:py-9">
        <div className="mx-auto grid w-full max-w-[1120px] grid-cols-[minmax(0,1fr)_minmax(390px,.94fr)] items-center gap-[54px] max-[900px]:grid-cols-2 max-[900px]:gap-7 max-[700px]:grid-cols-1 max-[700px]:gap-8">
          <div>
            <div className="mb-[18px] flex items-center gap-2 text-[10px] font-extrabold tracking-[1.25px] text-[#9f252c]">
              <span className="size-2 rounded-full bg-[#c92730]" />
              ONE CAMPUS. ONE COMMUNITY.
            </div>
            <h1 className="m-0 max-w-[560px] text-[clamp(38px,4.2vw,58px)] font-extrabold leading-[1.1] tracking-[-2.4px] text-[#182337] max-[900px]:text-[42px] max-[700px]:text-[clamp(38px,10vw,50px)]">
              From campus collaboration to <span className="text-[#bf252e]">crisis response.</span>
            </h1>
            <p className="mb-[25px] mt-5 max-w-[500px] text-[14px] leading-[1.8] text-[#657187]">
              A campus-to-community platform for emergency support, blood donation, and coordinated relief.
            </p>
            <div className="flex flex-wrap gap-[11px] max-[420px]:flex-col">
              <Link className="inline-flex min-h-[45px] items-center justify-center gap-2 rounded-lg bg-[#c92730] px-[17px] text-xs font-bold text-white shadow-[0_7px_18px_#c9273030] transition hover:-translate-y-0.5" to="/blood">
                <span className="text-base leading-none">✚</span> Find a blood donor
              </Link>
              <a className="inline-flex min-h-[45px] items-center justify-center gap-2 rounded-lg border border-[#dce2eb] bg-white px-[17px] text-xs font-bold text-[#34445c] transition hover:-translate-y-0.5" href="#sos-form">
                <span className="text-sm text-[#c92730]">＋</span> Submit emergency SOS
              </a>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#e1e6ed] bg-white p-[22px] shadow-[0_16px_45px_#24395712] max-[700px]:p-[17px]" id="sos-form">
            <div className="flex items-center gap-3">
              <div className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-[#edf2fb] text-lg text-[#294f83]">⌁</div>
              <div>
                <span className="text-[9px] font-extrabold tracking-[1.1px] text-[#66748a]">QUICK SOS MESSAGE ORGANIZER</span>
                <h2 className="mt-1 text-[17px] font-semibold tracking-[-.4px] text-[#1c2a40]">Turn a message into action</h2>
              </div>
            </div>
            <p className="my-4 text-[11px] leading-[1.65] text-[#778398]">Paste an emergency post in Bangla or Banglish to organize its key details.</p>
            <form onSubmit={handleParse}>
              <label className="sr-only" htmlFor="sos-message">Emergency message</label>
              <textarea
                id="sos-message"
                className="min-h-[116px] w-full resize-y rounded-lg border border-[#dfe4ec] bg-[#fbfcfe] p-3 text-xs leading-relaxed text-[#34445c] outline-none transition focus:border-[#6079ab] focus:ring-[3px] focus:ring-[#6079ab1b] placeholder:text-[#9aa4b4]"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Type or paste an emergency message in Bangla or Banglish..."
                rows="4"
              />
              <div className="mt-2.5 flex items-center justify-between gap-3 max-[420px]:items-start max-[420px]:flex-col">
                <span className="text-[9px] text-[#929cac]">Your message stays on this page.</span>
                <button className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-[7px] bg-[#172a49] px-3 text-[10px] font-bold text-white transition hover:bg-[#263f67] max-[420px]:self-end" type="submit">
                  Organize details <span>→</span>
                </button>
              </div>
            </form>
            {parsed && (
              <div className="mt-4 rounded-[9px] border border-[#e4e9f1] bg-[#f9fafc] p-[14px]" aria-live="polite">
                <div className="flex items-center justify-between">
                  <div><span className="text-[8px] font-extrabold tracking-[1.1px] text-[#66748a]">MESSAGE SUMMARY</span><h3 className="mt-[3px] text-sm font-semibold text-[#29364b]">Request details</h3></div>
                  <span className="rounded-xl bg-[#fff0ef] px-2 py-[5px] text-[9px] font-extrabold text-[#b7494d]">{parsed.urgency}</span>
                </div>
                <div className="mt-[13px] grid grid-cols-2 gap-[11px]">
                  <div className="grid gap-[3px]"><span className="text-[8px] font-bold tracking-[.7px] text-[#919bad]">LOCATION</span><strong className="text-[10px] text-[#35435b]">{parsed.location}</strong></div>
                  <div className="grid gap-[3px]"><span className="text-[8px] font-bold tracking-[.7px] text-[#919bad]">NEEDS</span><strong className="text-[10px] text-[#35435b]">{parsed.needs}</strong></div>
                  <div className="grid gap-[3px]"><span className="text-[8px] font-bold tracking-[.7px] text-[#919bad]">BLOOD GROUP</span><strong className="text-[10px] text-[#35435b]">{parsed.bloodGroup}</strong></div>
                  <div className="grid gap-[3px]"><span className="text-[8px] font-bold tracking-[.7px] text-[#919bad]">CONTACT</span><strong className="text-[10px] text-[#35435b]">{parsed.phone}</strong></div>
                </div>
                <p className="mb-0 mt-3 text-[9px] leading-relaxed text-[#8b95a6]">Details are organized locally from your text.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(1120px,calc(100%-48px))] pb-[57px] pt-[35px] max-[700px]:w-[calc(100%-32px)] max-[700px]:pb-10">
        <div className="grid grid-cols-4 overflow-hidden rounded-xl border border-[#e1e6ed] bg-white shadow-sm max-[700px]:grid-cols-2">
          {impactMetrics.map((metric, index) => (
            <article className={`flex min-h-[83px] items-center gap-3 px-4 py-3 max-[500px]:gap-2 max-[500px]:px-3 ${index > 0 ? 'border-l border-[#edf0f4] max-[700px]:border-l-0' : ''} ${index % 2 === 1 ? 'max-[700px]:border-l max-[700px]:border-[#edf0f4]' : ''} ${index > 1 ? 'max-[700px]:border-t max-[700px]:border-[#edf0f4]' : ''}`} key={metric.label}>
              <span className={`grid size-[34px] shrink-0 place-items-center rounded-full text-sm ${metric.tone}`}>{metric.icon}</span>
              <div>
                <strong className="block text-[22px] font-bold leading-none text-[#202d40]">—</strong>
                <span className="mt-1 block text-[9px] font-semibold leading-tight text-[#6c788b]">{metric.label}</span>
              </div>
            </article>
          ))}
        </div>
        <p className="mb-0 mt-2.5 text-center text-[9px] text-[#929cac]">Live totals will appear here when connected.</p>
      </section>

      <section className="mx-auto w-[min(1120px,calc(100%-48px))] pb-[62px] max-[700px]:w-[calc(100%-32px)] max-[700px]:pb-10">
        <div className="mb-4">
          <span className="text-[9px] font-extrabold tracking-[1.15px] text-[#78859a]">COMMUNITY ACTIVITY</span>
          <h2 className="mt-1.5 text-[22px] font-bold tracking-[-.7px] text-[#1d2b42]">Requests that need a response</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
          <article className="rounded-xl border border-[#e1e6ed] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-[#fff0f0] text-sm text-[#c92730]">✚</span>
              <h3 className="m-0 text-xs font-bold text-[#29374d]">Urgent Blood Requests</h3>
            </div>
            <p className="m-0 rounded-lg bg-[#f8f9fb] px-3 py-5 text-center text-[10px] text-[#8792a2]">No active blood requests.</p>
          </article>
          <article className="rounded-xl border border-[#e1e6ed] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-[#edf4ff] text-sm text-[#315f9d]">⌁</span>
              <h3 className="m-0 text-xs font-bold text-[#29374d]">Active Flood &amp; Crisis SOS</h3>
            </div>
            <p className="m-0 rounded-lg bg-[#f8f9fb] px-3 py-5 text-center text-[10px] text-[#8792a2]">No active crisis requests.</p>
          </article>
        </div>
      </section>
    </main>
  )
}

export default Home
