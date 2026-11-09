import { PublicShell } from "@/components/PublicShell";

export default function ContactPage() {
  return (
    <PublicShell>
      <section className="max-w-3xl py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-700">Contact</p>
        <h1 className="mt-3 font-serif text-3xl text-forest-950 sm:text-4xl">Contact ISEYC</h1>
        <p className="mt-4 text-sm leading-6 text-ink-700">For institutional enquiries, public information questions and communication with the Initiative for Sustainable Evolution for Youth and Community:</p>
        <div className="mt-7 rounded-card border border-line bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Email</p>
          <a href="mailto:iseycglobal@gmail.com" className="mt-2 inline-flex min-h-[44px] items-center text-base font-semibold text-forest-900 hover:underline">iseycglobal@gmail.com</a>
          <p className="mt-5 border-t border-line pt-4 text-xs font-bold uppercase tracking-[0.12em] text-gold-700">Social</p>
          <p className="mt-2 text-sm text-ink-700">@iseyc_global</p>
        </div>
      </section>
    </PublicShell>
  );
}
