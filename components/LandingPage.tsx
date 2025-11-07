import React from "react";
import {
  LayoutKanbanIcon,
  CalendarRangeIcon,
  BarChart3Icon,
  UsersIcon,
  MountainIcon,
  BookmarkCheckIcon,
  GitBranchIcon,
  ScrumOwlLogo,
} from "./icons";
import { useLocale } from "../context/LocaleContext";

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const { locale, setLocale, t } = useLocale();
  React.useEffect(() => {
    document.title = "ScrumOwl — Home";
  }, []);

  const handleLanguageToggle = () => {
    setLocale(locale === 'en-US' ? 'fa-IR' : 'en-US');
  };

  return (
    <div dir={locale === 'fa-IR' ? 'rtl' : 'ltr'} className={`min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900 ${locale === 'fa-IR' ? 'font-vazir' : 'font-sans'}`}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrumOwlLogo className="text-xl" />
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700">
            <a href="#features" className="hover:text-slate-900">{t('landing_header_features')}</a>
            <a href="#reports" className="hover:text-slate-900">{t('landing_header_reports')}</a>
            <a href="#how" className="hover:text-slate-900">{t('landing_header_how')}</a>
          </nav>

          <div className="flex items-center gap-3">
             <button onClick={handleLanguageToggle} title="Switch language / تغییر زبان" className="text-sm font-semibold text-slate-600 hover:bg-slate-200/80 px-2 py-1 rounded-md">
                {locale === 'en-US' ? 'fa' : 'en'}
             </button>
             <div className="h-5 w-px bg-slate-200" />
             <button onClick={onStart} className="inline-flex items-center gap-2 rounded-xl border-2 border-label-neutral-text bg-white text-label-neutral-text px-4 py-2 hover:bg-slate-50">
              {t('landing_header_login')}
            </button>
            <button onClick={onStart} className="inline-flex items-center gap-2 rounded-xl border-2 border-label-neutral-text bg-primary text-white px-4 py-2 shadow-[4px_4px_0_0_#1F2937] hover:translate-y-0.5 transition-transform">
              {t('landing_header_getStarted')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute start-[-6rem] top-[-6rem] w-72 h-72 bg-primarySoft rounded-3xl rotate-12 border-2 border-label-neutral-text" />
          <div className="absolute end-[-4rem] bottom-[-4rem] w-64 h-64 bg-label-amber-bg rounded-3xl -rotate-6 border-2 border-label-neutral-text" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-start">
              <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
                {t('landing_hero_title')}
              </h1>
              <p className="mt-4 text-slate-600 text-base sm:text-lg">
                {t('landing_hero_subtitle')}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button onClick={onStart} className="inline-flex items-center gap-2 rounded-2xl border-2 border-label-neutral-text bg-primary text-white px-5 py-2.5 text-sm font-semibold shadow-[6px_6px_0_0_#1F2937] hover:-translate-y-0.5 transition-transform">
                  {t('landing_hero_cta_free')}
                </button>
                <button onClick={onStart} className="inline-flex items-center gap-2 rounded-2xl border-2 border-label-neutral-text bg-white text-label-neutral-text px-5 py-2.5 text-sm font-semibold hover:bg-slate-50">
                  {t('landing_hero_cta_demo')}
                </button>
              </div>

              <div className="mt-6 text-xs text-slate-500">
                {t('landing_hero_subtext')}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border-2 border-label-neutral-text bg-white shadow-[8px_8px_0_0_#1F2937] p-4">
                {/* Mini preview of sprint plaque & board */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-300 bg-white">
                      Sprint 24.03
                    </span>
                    <span className="text-slate-600">Oct 27 – Nov 10</span>
                    <span className="text-emerald-700 font-medium">Days left: 11</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <button className="rounded-lg border px-2 py-1">‹</button>
                    <button className="rounded-lg border px-2 py-1">›</button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {["To Do","In Progress","Done"].map((col) => (
                    <div key={col} className="rounded-xl border border-slate-200 bg-white">
                      <div className="px-3 py-2 border-b text-sm font-semibold">{col}</div>
                      <div className="p-3 space-y-2">
                        <CardStub title="Implement Epics Drawer" badge="Story" color="bg-label-neutral-bg" />
                        <CardStub title="Fix Today Banner" badge="Bug" color="bg-label-amber-bg" />
                        <CardStub title="Board Filters v2" badge="Task" color="bg-label-blue-bg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 text-start">
        <h2 className="text-2xl sm:text-3xl font-bold">{t('landing_features_title')}</h2>
        <p className="mt-2 text-slate-600">{t('landing_features_subtitle')}</p>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Feature icon={<LayoutKanbanIcon className="w-5 h-5" />} title={t('landing_feature_board_title')} desc={t('landing_feature_board_desc')} />
          <Feature icon={<MountainIcon className="w-5 h-5" />} title={t('landing_feature_epics_title')} desc={t('landing_feature_epics_desc')} />
          <Feature icon={<BarChart3Icon className="w-5 h-5" />} title={t('landing_feature_reports_title')} desc={t('landing_feature_reports_desc')} />
          <Feature icon={<CalendarRangeIcon className="w-5 h-5" />} title={t('landing_feature_events_title')} desc={t('landing_feature_events_desc')} />
          <Feature icon={<BookmarkCheckIcon className="w-5 h-5" />} title={t('landing_feature_views_title')} desc={t('landing_feature_views_desc')} />
          <Feature icon={<UsersIcon className="w-5 h-5" />} title={t('landing_feature_sso_title')} desc={t('landing_feature_sso_desc')} />
        </div>
      </section>

      {/* Reports strip */}
      <section id="reports" className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="text-start">
              <h3 className="text-xl sm:text-2xl font-bold">{t('landing_reports_title')}</h3>
              <p className="mt-2 text-slate-600 text-sm sm:text-base">{t('landing_reports_subtitle')}</p>
              <ul className="mt-4 space-y-2 text-slate-700 text-sm">
                <li>{t('landing_reports_bullet1')}</li>
                <li>{t('landing_reports_bullet2')}</li>
                <li>{t('landing_reports_bullet3')}</li>
                <li>{t('landing_reports_bullet4')}</li>
              </ul>
              <div className="mt-6">
                <button onClick={onStart} className="inline-flex items-center gap-2 rounded-xl border-2 border-label-neutral-text bg-primary text-white px-4 py-2 shadow-[4px_4px_0_0_#1F2937]">
                  {t('landing_reports_cta')}
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border-2 border-label-neutral-text bg-white shadow-[8px_8px_0_0_#1F2937] p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Badge label="Burndown" />
                  <Badge label="CFD" />
                  <Badge label="Velocity" />
                  <Badge label="Lead/Cycle" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 text-start">
        <h2 className="text-2xl sm:text-3xl font-bold">{t('landing_how_title')}</h2>
        <ol className="mt-6 grid md:grid-cols-3 gap-5 text-sm">
          <Step n={1} title={t('landing_how_step1_title')} desc={t('landing_how_step1_desc')} />
          <Step n={2} title={t('landing_how_step2_title')} desc={t('landing_how_step2_desc')} />
          <Step n={3} title={t('landing_how_step3_title')} desc={t('landing_how_step3_desc')} />
        </ol>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-3xl border-2 border-label-neutral-text bg-primary text-white p-8 sm:p-10 shadow-[8px_8px_0_0_#1F2937] text-center">
          <h3 className="text-2xl font-bold">{t('landing_final_cta_title')}</h3>
          <p className="mt-2 opacity-90">{t('landing_final_cta_subtitle')}</p>
          <div className="mt-6">
            <button onClick={onStart} className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/90 bg-white text-slate-900 px-6 py-2.5 font-semibold">
              {t('landing_header_getStarted')}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <GitBranchIcon className="w-4 h-4" />
            <span>{t('landing_footer_copyright').replace('{year}', new Date().getFullYear().toString())}</span>
          </div>
          <div className="flex items-center gap-4">
            <a className="hover:text-slate-900" href="#">{t('landing_footer_privacy')}</a>
            <a className="hover:text-slate-900" href="#">{t('landing_footer_terms')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border-2 border-label-neutral-text bg-white p-4 shadow-[6px_6px_0_0_#1F2937] text-start">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl border-2 border-label-neutral-text bg-slate-50 flex items-center justify-center">{icon}</div>
        <h3 className="font-bold">{title}</h3>
      </div>
      <p className="mt-2 text-slate-600 text-sm leading-6">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <li className="rounded-2xl border-2 border-label-neutral-text bg-white p-4 shadow-[6px_6px_0_0_#1F2937] text-start">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl border-2 border-label-neutral-text bg-label-amber-bg font-bold">{n}</span>
        <h4 className="font-bold">{title}</h4>
      </div>
      <p className="mt-2 text-slate-600">{desc}</p>
    </li>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="font-semibold text-slate-800">{label}</div>
      <div className="h-2 w-20 rounded-full bg-gradient-to-l from-blue-400 to-emerald-400" />
    </div>
  );
}

function CardStub({ title, badge, color }: { title: string; badge: string; color: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 ${color} px-3 py-2 text-start`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold truncate max-w-[70%]">{title}</div>
        <span className="text-[11px] px-2 py-0.5 rounded-lg border border-slate-300 bg-white">{badge}</span>
      </div>
      <div className="mt-1 text-[11px] text-slate-600">Due: Nov 03 • Assignee: You</div>
    </div>
  );
}