import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions and Privacy Policy — The Golden Frame',
  description: 'Terms and conditions, privacy policy, and consent information for The Golden Frame personalised AR photo frames.',
}

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <a href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
        ← Back to home
      </a>

      <div className="mb-10">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-500">Legal</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
          Terms &amp; Conditions and Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-zinc-400">Last updated: 15 June 2026</p>
      </div>

      <div className="space-y-10 text-sm leading-7 text-zinc-600">

        {/* 1 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">1. About The Golden Frame</h2>
          <p>
            The Golden Frame (ABN: 24 695 374 835) (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is an
            Australian business that provides personalised augmented reality (AR) photo frames. By using our
            website or services, or by uploading content to our platform, you agree to these Terms and
            Conditions and Privacy Policy in full.
          </p>
          <p className="mt-2">
            If you do not agree with any part of these terms, you must not use our services.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">2. Collection of Personal Information</h2>
          <p>
            We collect personal information in accordance with the <em>Privacy Act 1988</em> (Cth) and the
            Australian Privacy Principles (APPs). When you place an order we collect:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your first and last name</li>
            <li>Your email address</li>
            <li>The photo and video you upload</li>
            <li>Technical data generated during upload (file size, format, upload timestamp)</li>
          </ul>
          <p className="mt-2">
            We collect this information to process and fulfil your order, communicate with you about order
            status, and improve our services. Collection is authorised by your explicit consent given at the
            time of upload.
          </p>
          <p className="mt-2">
            Photos you upload may constitute <strong>sensitive information</strong> under the Privacy Act
            where they reveal or could reveal biometric data about identifiable individuals. We handle such
            information with additional care and will not use or disclose it beyond what is necessary to
            fulfil your order.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">3. How We Use Your Information</h2>
          <p>Your personal information is used solely to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Process your order and create your personalised AR frame</li>
            <li>Send you order confirmation, status updates, and dispatch notifications</li>
            <li>Respond to enquiries or support requests you initiate</li>
            <li>Meet our legal and regulatory obligations</li>
          </ul>
          <p className="mt-2">
            We will <strong>not</strong> use your information for direct marketing, profiling, or any purpose
            beyond fulfilling your order without your separate and explicit consent.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">4. Disclosure to Third Parties</h2>
          <p>
            We may share your personal information with trusted third-party service providers who assist us in
            operating our business, including:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Cloud storage and computing providers (to host and process your uploaded files)</li>
            <li>Payment processors (to handle transactions securely)</li>
            <li>Shipping and fulfilment providers (to deliver your order)</li>
          </ul>
          <p className="mt-2">
            These providers are contractually obliged to handle your data securely and only for the purpose
            of providing services to us. We do <strong>not</strong> sell, rent, or trade your personal
            information to any third party. We may disclose information if required to do so by law or by a
            court, tribunal, or regulatory authority.
          </p>
          <p className="mt-2">
            Some of our service providers may be located outside Australia. Where we transfer personal
            information overseas, we take reasonable steps to ensure the recipient handles it in a manner
            consistent with the Australian Privacy Principles.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">5. Storage and Security</h2>
          <p>
            Your uploaded files and personal information are stored on encrypted cloud servers. We take
            reasonable technical and organisational steps to protect your personal information from misuse,
            interference, and loss, and from unauthorised access, modification, or disclosure.
          </p>
          <p className="mt-2">
            No method of transmission over the internet or electronic storage is 100% secure. While we
            strive to use commercially acceptable means to protect your personal information, we cannot
            guarantee absolute security.
          </p>
          <p className="mt-2">
            In the event of an eligible data breach as defined under the <em>Privacy Act 1988</em>, we will
            notify affected individuals and the Office of the Australian Information Commissioner (OAIC) in
            accordance with the Notifiable Data Breaches scheme.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">6. Your Consent — Upload and Storage</h2>
          <p>
            Before submitting your order, you are asked to provide two separate consents:
          </p>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            <li>
              <strong>Consent to upload:</strong> You consent to The Golden Frame collecting, receiving, and
              processing your uploaded photo and video for the sole purpose of creating your personalised
              AR photo frame.
            </li>
            <li>
              <strong>Consent to store:</strong> You give permission for The Golden Frame to retain your
              uploaded photo and video on secure cloud storage until you request their deletion. Your files
              will be retained as long as required to support your order, handle any warranty or support
              claims, and comply with our legal obligations.
            </li>
          </ol>
          <p className="mt-2">
            You may withdraw either consent at any time by contacting us (see Section 11). Withdrawing
            consent after your order has been fulfilled will not affect the lawfulness of processing carried
            out prior to withdrawal.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">7. Data Retention and Deletion</h2>
          <p>
            We retain your personal information and uploaded files for as long as is necessary to fulfil
            your order, resolve any disputes, and comply with our legal obligations. After this period,
            data is securely deleted or de-identified.
          </p>
          <p className="mt-2">
            You may request deletion of your uploaded files and personal information at any time by emailing
            us (see Section 11). We will action deletion requests within <strong>30 days</strong>, except
            where retention is required by law (for example, financial records under taxation law).
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">8. Your Privacy Rights</h2>
          <p>
            Under the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles, you have the
            right to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Access</strong> the personal information we hold about you (APP 12)
            </li>
            <li>
              <strong>Correct</strong> any personal information that is inaccurate, out of date, incomplete,
              irrelevant, or misleading (APP 13)
            </li>
            <li>
              <strong>Make a complaint</strong> about how we handle your personal information
            </li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, please contact us (see Section 11). We will respond within
            30 days. If you are not satisfied with our response to a privacy complaint, you may escalate
            the complaint to the OAIC at{' '}
            <a
              href="https://www.oaic.gov.au"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 underline hover:text-amber-700"
            >
              oaic.gov.au
            </a>{' '}
            or by calling 1300 363 992.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">9. Content Ownership and Intellectual Property</h2>
          <p>By uploading content to our platform, you warrant and represent that:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              You own or hold all necessary rights, licences, and permissions to use, upload, and authorise
              us to process the photo and video
            </li>
            <li>
              The content does not infringe any third-party intellectual property rights, privacy rights, or
              any other rights
            </li>
            <li>
              You have obtained the express consent of any identifiable individuals whose likeness appears
              in the photo or video before uploading it
            </li>
            <li>
              The content does not contain material that is defamatory, obscene, unlawful, or otherwise
              objectionable
            </li>
          </ul>
          <p className="mt-2">
            You retain full ownership of your uploaded content. You grant us a limited, non-exclusive,
            royalty-free licence to use your content solely for the purpose of creating and delivering your
            order. This licence ends once your data deletion request is actioned.
          </p>
          <p className="mt-2">
            The Golden Frame name, logo, website design, and all associated intellectual property remain
            our exclusive property. Nothing in these terms transfers any intellectual property rights in
            our brand or platform to you.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">10. Australian Consumer Law</h2>
          <p>
            Our services come with guarantees under the <em>Australian Consumer Law</em> (Schedule 2 to
            the <em>Competition and Consumer Act 2010</em> (Cth)) that cannot be excluded. These include
            guarantees that our services will be provided with due care and skill, be fit for the purpose
            we indicate, and be delivered within a reasonable time.
          </p>
          <p className="mt-2">
            Nothing in these terms excludes, restricts, or modifies any right or remedy you have under
            Australian consumer law. If our service fails to comply with a consumer guarantee, you may be
            entitled to a repair, replacement, or refund, and in some cases compensation for other
            foreseeable loss or damage.
          </p>
          <p className="mt-2">
            To the extent permitted by law, and subject to any non-excludable statutory rights, our
            liability for any claim arising under these terms is limited to the amount paid for the
            relevant service or, at our option, re-supply of the service.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">11. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, The Golden Frame excludes all liability for any
            indirect, incidental, special, or consequential loss or damage arising from your use of our
            services, including but not limited to loss of data, loss of profits, or loss of business
            opportunity, even if we have been advised of the possibility of such loss.
          </p>
          <p className="mt-2">
            We are not responsible for any loss arising from your failure to comply with these terms,
            including uploading content you do not have the rights to use.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">12. Governing Law</h2>
          <p>
            These terms are governed by and construed in accordance with the laws of Australia and the
            state or territory in which The Golden Frame operates. Any dispute arising in connection with
            these terms will be subject to the non-exclusive jurisdiction of the courts of Australia.
          </p>
        </section>

        {/* 13 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">13. Changes to These Terms</h2>
          <p>
            We may update these Terms and Conditions and Privacy Policy from time to time to reflect
            changes in law, our services, or our business practices. We will notify you of material
            changes by email (to the address you provided at the time of purchase) or by posting a
            notice on our website. The date of the most recent update is shown at the top of this page.
          </p>
          <p className="mt-2">
            Continued use of our services after changes take effect constitutes your acceptance of the
            updated terms. If you do not agree with the updated terms, you must stop using our services.
          </p>
        </section>

        {/* 14 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">14. Cookies and Website Data</h2>
          <p>
            Our website may use cookies and similar technologies to improve your browsing experience and
            understand how visitors use our site. Cookies do not identify you personally. You can
            configure your browser to refuse cookies, but some parts of our website may not function
            correctly without them.
          </p>
        </section>

        {/* 15 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900">15. Contact Us and Privacy Complaints</h2>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <p className="font-semibold text-zinc-900">The Golden Frame</p>
            <p className="mt-1">ABN: 24 695 374 835</p>
            <p className="mt-1">
              Email:{' '}
              <a href="mailto:thegoldenframecreations@gmail.com" className="text-amber-600 underline hover:text-amber-700">
                thegoldenframecreations@gmail.com
              </a>
            </p>
            <p className="mt-1">
              Phone:{' '}
              <a href="tel:+61468320987" className="text-amber-600 underline hover:text-amber-700">
                +61 468 320 987
              </a>
            </p>
            <p className="mt-3 text-xs text-zinc-500">
              We aim to respond to all enquiries and privacy complaints within 30 days. If you are
              unsatisfied with our response, you may contact the OAIC at{' '}
              <a
                href="https://www.oaic.gov.au"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 underline"
              >
                oaic.gov.au
              </a>{' '}
              or call 1300 363 992.
            </p>
          </div>
        </section>

      </div>

      <div className="mt-12 flex justify-center">
        <a
          href="/upload"
          className="rounded-full bg-amber-400 px-7 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
        >
          Back to Order Form
        </a>
      </div>
    </main>
  )
}
