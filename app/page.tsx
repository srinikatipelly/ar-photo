export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="The Golden Frame" className="h-10 w-auto" />
        </div>
        <a
          href="/upload"
          className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-300"
        >
          Order Now
        </a>
      </nav>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-16 pt-12 text-center sm:px-10 sm:pt-20">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700">
          ✦ Personalised AR Photo Frames
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
          Because some memories deserve more than a photo
        </h1>
        <p className="mt-6 max-w-xl text-lg text-zinc-500">
          Upload your favourite photo and a video. We embed a hidden QR code — scan it and watch your memory come alive in augmented reality.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <a
            href="/upload"
            className="rounded-full bg-amber-400 px-7 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
          >
            Create Your AR Experience →
          </a>
          <a
            href="#how-it-works"
            className="rounded-full border border-zinc-200 px-7 py-3.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            See How It Works
          </a>
        </div>

        {/* Hero card */}
        <div className="mt-14 w-full max-w-2xl rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 p-8 shadow-sm sm:p-12">
          <div className="flex flex-col items-center gap-2">
            <div className="text-5xl">🖼️</div>
            <p className="mt-3 text-lg font-semibold text-zinc-900">A photo frame that plays a video</p>
            <p className="max-w-sm text-sm text-zinc-500">
              Hang it on the wall. Scan the hidden QR with your phone. Watch a birthday message, a wedding dance, or a baby's first steps play in AR.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">How it works</p>
          <h2 className="mt-3 text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Three simple steps
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Upload your photo & video',
                body: 'Choose the photo that will be framed and the video you want to play when the frame is scanned.',
              },
              {
                step: '02',
                title: 'We craft your frame',
                body: 'We prepare your personalised AR frame and embed the magic QR code. Dispatched in 2–3 business days.',
              },
              {
                step: '03',
                title: 'Scan & relive the moment',
                body: 'Point your phone camera at the photo inside the frame. Watch your video appear in augmented reality.',
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="rounded-3xl bg-white p-7 shadow-sm">
                <span className="text-3xl font-bold text-amber-400">{step}</span>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            The perfect personalised gift
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: '🎁', title: 'Unique & personalised', body: 'No two frames are the same. Your memory, your video, your gift.' },
              { icon: '📱', title: 'No app needed', body: 'Scan the QR code with any phone camera. It just works.' },
              { icon: '✉️', title: 'Digital QR delivered instantly', body: 'Get your QR code by email as soon as payment clears.' },
              { icon: '📦', title: 'Dispatched in 2–3 days', body: 'Carefully crafted and delivered to your door.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className="rounded-3xl border border-zinc-100 p-6 text-center">
                <div className="text-3xl">{icon}</div>
                <h3 className="mt-3 text-base font-semibold text-zinc-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="bg-zinc-950 py-20">
        <div className="mx-auto max-w-xl px-6 text-center sm:px-10">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ready to turn a memory into magic?
          </h2>
          <p className="mt-4 text-zinc-400">Upload your photo and video and order your AR frame today.</p>
          <a
            href="/upload"
            className="mt-8 inline-block rounded-full bg-amber-400 px-8 py-4 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
          >
            Create Your AR Experience →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-14 sm:px-10">
          <div className="grid gap-10 sm:grid-cols-3">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="The Golden Frame" className="h-10 w-auto" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                Where memories come alive. Personalised AR photo frames handcrafted in Australia.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Quick links</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><a href="/" className="text-zinc-600 hover:text-amber-600">Home</a></li>
                <li><a href="/upload" className="text-zinc-600 hover:text-amber-600">Order a frame</a></li>
                <li><a href="#how-it-works" className="text-zinc-600 hover:text-amber-600">How it works</a></li>
                <li><a href="/terms" className="text-zinc-600 hover:text-amber-600">Terms &amp; Privacy</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Contact us</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-amber-500">📞</span>
                  <a href="tel:+61468320987" className="text-zinc-600 hover:text-amber-600">+61 468 320 987</a>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-amber-500">✉️</span>
                  <a href="mailto:thegoldenframecreations@gmail.com" className="break-all text-zinc-600 hover:text-amber-600">
                    thegoldenframecreations@gmail.com
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-amber-500">💳</span>
                  <div>
                    <span className="font-medium text-zinc-700">PayID:</span>{' '}
                    <span className="text-zinc-600">0468 320 987</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-zinc-100 pt-6 text-xs text-zinc-400 sm:flex-row">
            <p>© {new Date().getFullYear()} The Golden Frame. All rights reserved.</p>
            <p>Handcrafted in Australia 🇦🇺</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
