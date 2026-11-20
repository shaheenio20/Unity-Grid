import { Link } from 'react-router-dom'
import heroImage from '../../assets/hero.png'

function Home() {
  return (
    <main className="bg-[#f5f7fb] text-[#17243b]">
      <section className="border-b border-[#e9edf3] bg-white px-6 py-14 max-[700px]:px-4 max-[700px]:py-9">
        <div className="mx-auto grid w-full max-w-[1120px] grid-cols-2 items-center gap-12 max-[700px]:grid-cols-1 max-[700px]:gap-7">
          <div>
            <p className="mb-4 text-[10px] font-extrabold tracking-[1.25px] text-[#9f252c]">
              UNITYGRID · CAMPUS & COMMUNITY
            </p>
            <h1 className="m-0 text-[clamp(38px,5vw,58px)] font-extrabold leading-[1.1] tracking-[-2.4px] text-[#182337]">
              Stronger communities start here.
            </h1>
            <p className="mb-6 mt-5 max-w-[500px] text-sm leading-[1.8] text-[#657187]">
              UnityGrid brings students and communities together to connect,
              support one another, and make it easier to help when it matters.
            </p>
            <Link
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#c92730] px-5 text-xs font-bold text-white transition hover:bg-[#a91f27]"
              to="/blood"
            >
              Explore community support
            </Link>
          </div>

          <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#f3f5ff] to-[#f8f2ff] p-8 max-[700px]:min-h-[220px]">
            <img
              src={heroImage}
              alt="UnityGrid layered community mark"
              className="max-h-[320px] w-full object-contain"
            />
          </div>
        </div>
      </section>
    </main>
  )
}

export default Home
