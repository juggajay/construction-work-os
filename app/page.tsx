'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Play } from 'lucide-react'

// ============================================================================
// LANDING PAGE - INDUSTRIAL LUXURY AESTHETIC
// Editorial magazine meets raw construction
// Typography: Clash Display vibes with dramatic scale
// Color: Deep charcoal + warm amber accents
// ============================================================================

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-white antialiased selection:bg-amber-500/30 selection:text-white">
      {/* Custom cursor glow effect */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <div className="absolute -top-[40vh] left-1/2 h-[80vh] w-[80vh] -translate-x-1/2 rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      {/* Noise texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-40 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Grid overlay - blueprint aesthetic */}
      <div
        className="pointer-events-none fixed inset-0 z-30 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      />

      {/* ================================================================== */}
      {/* NAVIGATION - Minimal, refined */}
      {/* ================================================================== */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-[1800px] px-6 md:px-12">
          <div className="flex h-20 items-center justify-between border-b border-white/5">
            {/* Logo */}
            <Link href="/" className="group flex items-center gap-4">
              <div className="relative">
                <div className="h-10 w-10 rounded-sm bg-gradient-to-br from-amber-400 to-amber-600 transition-transform duration-500 group-hover:rotate-[360deg]" />
                <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-amber-400 to-amber-600 blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
              </div>
              <span className="text-lg font-medium tracking-tight">
                Construction<span className="text-amber-400">OS</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden items-center gap-12 md:flex">
              <div className="flex items-center gap-8">
                {['Product', 'Pricing', 'Company'].map((item) => (
                  <Link
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="relative text-sm text-white/40 transition-colors hover:text-white group"
                  >
                    {item}
                    <span className="absolute -bottom-1 left-0 h-px w-0 bg-amber-400 transition-all duration-300 group-hover:w-full" />
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-sm text-white/60 transition-colors hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="group relative overflow-hidden rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-all hover:shadow-lg hover:shadow-amber-500/20"
                >
                  <span className="relative z-10 group-hover:text-white transition-colors">Start free</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
            >
              <span className={`h-px w-6 bg-white transition-all ${mobileMenuOpen ? 'translate-y-[4px] rotate-45' : ''}`} />
              <span className={`h-px w-6 bg-white transition-all ${mobileMenuOpen ? '-translate-y-[4px] -rotate-45' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 bg-[#0C0C0C]/95 backdrop-blur-xl border-b border-white/5 md:hidden"
          >
            <div className="px-6 py-8 space-y-6">
              {['Product', 'Pricing', 'Company', 'Sign in'].map((item) => (
                <Link
                  key={item}
                  href={item === 'Sign in' ? '/login' : `#${item.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-2xl font-light text-white/70 hover:text-white transition-colors"
                >
                  {item}
                </Link>
              ))}
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-2 mt-4 text-amber-400 text-lg"
              >
                Start free trial
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ================================================================== */}
      {/* HERO - Dramatic editorial layout */}
      {/* ================================================================== */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      >
        {/* Diagonal line accent */}
        <div className="absolute top-0 right-0 w-px h-[60vh] bg-gradient-to-b from-transparent via-amber-500/50 to-transparent origin-top rotate-[30deg] translate-x-[40vw]" />

        <div className="relative mx-auto max-w-[1800px] px-6 md:px-12 py-24 md:py-32">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left column - Typography */}
            <div className="space-y-8">
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="flex items-center gap-4"
              >
                <div className="h-px w-12 bg-amber-500" />
                <span className="text-xs uppercase tracking-[0.3em] text-amber-400 font-medium">
                  Construction Management
                </span>
              </motion.div>

              {/* Headline - Massive, editorial scale */}
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-[clamp(3rem,8vw,7rem)] font-bold leading-[0.9] tracking-tight"
              >
                <span className="block">Build</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">
                  smarter.
                </span>
              </motion.h1>

              {/* Subhead */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="max-w-md text-lg md:text-xl text-white/50 leading-relaxed font-light"
              >
                RFIs, submittals, change orders—unified. Works offline.
                Unlimited users. One price.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-wrap items-center gap-6 pt-4"
              >
                <Link
                  href="/signup"
                  className="group relative inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-medium text-sm overflow-hidden transition-all hover:shadow-2xl hover:shadow-amber-500/20"
                >
                  <span className="relative z-10">Start 14-day trial</span>
                  <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 translate-y-full transition-transform group-hover:translate-y-0" />
                  <span className="absolute inset-0 flex items-center justify-center gap-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    Start 14-day trial
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
                <button className="group inline-flex items-center gap-3 text-white/60 hover:text-white transition-colors">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 group-hover:border-amber-500/50 group-hover:bg-amber-500/10 transition-all">
                    <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                  </div>
                  <span className="text-sm">Watch demo</span>
                </button>
              </motion.div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex items-center gap-12 pt-8 border-t border-white/5"
              >
                {[
                  { value: '$847M+', label: 'Projects managed' },
                  { value: '2,847', label: 'RFIs processed' },
                  { value: '95%', label: 'Field adoption' },
                ].map((stat, i) => (
                  <div key={stat.label}>
                    <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/30 mt-1 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right column - Product visual */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative"
            >
              {/* Floating UI mockup */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#111] shadow-2xl shadow-black/50">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0a0a0a]">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-white/10" />
                    <div className="h-3 w-3 rounded-full bg-white/10" />
                    <div className="h-3 w-3 rounded-full bg-white/10" />
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/40">Good morning</p>
                      <h2 className="text-xl font-semibold mt-1">Dashboard</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">JR</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Active Projects', value: '12', color: 'amber' },
                      { label: 'Open RFIs', value: '8', color: 'blue' },
                      { label: 'Pending', value: '5', color: 'emerald' },
                    ].map((stat) => (
                      <div key={stat.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-xs text-white/40">{stat.label}</p>
                        <p className="text-2xl font-bold mt-2">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Task list */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Priority Tasks</p>
                      <p className="text-xs text-amber-400">View all</p>
                    </div>
                    {[
                      { title: 'Review RFI #234', project: 'Downtown Tower', urgent: true },
                      { title: 'Approve submittal', project: 'Harbor Bridge', urgent: false },
                      { title: 'Daily report sign-off', project: 'Tech Campus', urgent: false },
                    ].map((task, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                        <div className={`h-2 w-2 rounded-full ${task.urgent ? 'bg-red-500' : 'bg-white/20'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <p className="text-xs text-white/30">{task.project}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Glow effect */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-amber-500/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
              </div>

              {/* Floating accent elements */}
              <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl" />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest text-white/20">Scroll</span>
          <div className="h-12 w-px bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>
      </motion.section>

      {/* ================================================================== */}
      {/* FEATURES - Asymmetric bento grid */}
      {/* ================================================================== */}
      <section id="product" className="relative py-32 md:py-48">
        <div className="mx-auto max-w-[1800px] px-6 md:px-12">
          {/* Section header */}
          <div className="max-w-3xl mb-24">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs uppercase tracking-[0.3em] text-amber-400 font-medium mb-4"
            >
              Features
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold tracking-tight"
            >
              Everything you need.
              <br />
              <span className="text-white/30">Nothing you don't.</span>
            </motion.h2>
          </div>

          {/* Bento grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Large feature card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 lg:row-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 p-8 md:p-12"
            >
              <div className="relative z-10 max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  Core Feature
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Offline-first mobile</h3>
                <p className="text-lg text-white/50 leading-relaxed mb-8">
                  Full functionality in dead zones, tunnels, and basements.
                  Your data syncs automatically when you're back online.
                </p>
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium group-hover:gap-4 transition-all">
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* Decorative phone mockup */}
              <div className="absolute right-8 bottom-8 w-48 h-80 rounded-3xl bg-[#1a1a1a] border border-white/10 transform rotate-6 translate-x-1/4 translate-y-1/4 opacity-50 group-hover:opacity-80 group-hover:rotate-3 transition-all duration-500">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-white/10" />
              </div>
            </motion.div>

            {/* Regular feature cards */}
            {[
              {
                title: 'Native RFI workflows',
                description: 'Ball-in-court tracking with automatic escalation and response analytics.',
                icon: '📋',
              },
              {
                title: 'Unlimited users',
                description: '$299/project includes your entire team. No per-seat surprises.',
                icon: '👥',
              },
              {
                title: 'Change orders',
                description: 'From request to approval with full audit trail.',
                icon: '💰',
              },
              {
                title: 'Daily reports',
                description: 'Photo documentation, weather tracking, crew logs.',
                icon: '📷',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-3xl bg-white/[0.02] border border-white/5 p-8 hover:border-white/10 hover:bg-white/[0.04] transition-all"
              >
                <span className="text-3xl mb-6 block">{feature.icon}</span>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>

                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PRICING - Minimal, confident */}
      {/* ================================================================== */}
      <section id="pricing" className="relative py-32 md:py-48 border-t border-white/5">
        <div className="mx-auto max-w-[1800px] px-6 md:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs uppercase tracking-[0.3em] text-amber-400 font-medium mb-4"
            >
              Pricing
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
            >
              One plan. All features.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/40 mb-16"
            >
              No per-seat fees. No feature gating. No surprises.
            </motion.p>

            {/* Pricing card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-12 md:p-16"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="text-left">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-7xl md:text-8xl font-bold">$299</span>
                    <span className="text-xl text-white/40">/project/mo</span>
                  </div>
                  <p className="text-white/40">Unlimited users included</p>
                </div>
                <Link
                  href="/signup"
                  className="group relative inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full font-medium text-lg overflow-hidden"
                >
                  <span className="relative z-10">Start free trial</span>
                  <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Features list */}
              <div className="mt-16 pt-16 border-t border-white/5 grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
                {[
                  'Unlimited team members',
                  'Full RFI workflows',
                  'Change order management',
                  'Offline mobile app',
                  'Daily reports',
                  'Photo documentation',
                  'QuickBooks integration',
                  'Priority support',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="h-3 w-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-white/60">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Decorative gradient */}
              <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
            </motion.div>

            <p className="mt-8 text-sm text-white/30">
              Enterprise? <Link href="/contact" className="text-amber-400 hover:underline">Let's talk</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA - Bold, minimal */}
      {/* ================================================================== */}
      <section className="relative py-32 md:py-48 overflow-hidden">
        {/* Large background text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[20vw] font-bold text-white/[0.02] tracking-tighter">BUILD</span>
        </div>

        <div className="relative mx-auto max-w-[1800px] px-6 md:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8"
          >
            Ready to build
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">smarter?</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link
              href="/signup"
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-amber-400 to-amber-600 text-black px-8 py-4 rounded-full font-medium text-sm overflow-hidden transition-all hover:shadow-2xl hover:shadow-amber-500/30"
            >
              Start your free trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 text-white/50 hover:text-white transition-colors text-sm"
            >
              Talk to sales
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-sm text-white/30"
          >
            No credit card required · 14-day free trial · Cancel anytime
          </motion.p>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FOOTER - Clean, minimal */}
      {/* ================================================================== */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto max-w-[1800px] px-6 md:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm bg-gradient-to-br from-amber-400 to-amber-600" />
              <span className="font-medium">ConstructionOS</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-white/30">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-white/20">
              © {new Date().getFullYear()} Construction OS
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
