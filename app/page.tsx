'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

// ============================================================================
// MINIMAL, REFINED LANDING PAGE
// Inspired by Linear, Vercel, Stripe - clean, confident, product-first
// ============================================================================

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      {/* ================================================================== */}
      {/* NAVIGATION */}
      {/* ================================================================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
              </div>
              <span className="text-lg font-semibold tracking-tight">Construction OS</span>
            </Link>

            {/* Nav Links */}
            <div className="hidden items-center gap-8 md:flex">
              <Link href="#features" className="text-sm text-white/60 transition-colors hover:text-white">
                Features
              </Link>
              <Link href="#pricing" className="text-sm text-white/60 transition-colors hover:text-white">
                Pricing
              </Link>
              <Link href="/login" className="text-sm text-white/60 transition-colors hover:text-white">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-all hover:bg-white/90"
              >
                Start free trial
              </Link>
            </div>

            {/* Mobile CTA */}
            <Link
              href="/signup"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black md:hidden"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ================================================================== */}
      {/* HERO */}
      {/* ================================================================== */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32">
        {/* Subtle gradient */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-4xl text-center">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-sm text-orange-400">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                Now with offline-first mobile
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-8 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
            >
              <span className="block">Construction management</span>
              <span className="block bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                that actually works.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mt-6 max-w-2xl text-lg text-white/50 md:text-xl"
            >
              RFIs, submittals, and change orders in one place.
              Works offline. Unlimited users. $299/project/month.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link
                href="/signup"
                className="group flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-6 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                Start your free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#demo"
                className="flex h-12 items-center gap-2 rounded-full border border-white/10 px-6 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:text-white"
              >
                Watch demo
              </Link>
            </motion.div>

            {/* Trust line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 text-sm text-white/30"
            >
              No credit card required · 14-day free trial · Cancel anytime
            </motion.p>
          </div>

          {/* Product Screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative mx-auto mt-20 max-w-6xl"
          >
            {/* Browser frame */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111111] shadow-2xl shadow-black/50">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-white/10" />
                  <div className="h-3 w-3 rounded-full bg-white/10" />
                  <div className="h-3 w-3 rounded-full bg-white/10" />
                </div>
                <div className="mx-auto flex h-7 w-80 items-center justify-center rounded-md bg-white/5 text-xs text-white/30">
                  app.constructionos.com
                </div>
              </div>

              {/* Dashboard content */}
              <div className="relative aspect-[16/10] bg-[#0a0a0a]">
                <Image
                  src="/dashboard-preview.png"
                  alt="Construction OS Dashboard"
                  fill
                  className="object-cover object-top"
                  priority
                  onError={(e) => {
                    // Fallback to constructed UI if image doesn't exist
                    e.currentTarget.style.display = 'none'
                  }}
                />

                {/* Fallback constructed dashboard UI */}
                <div className="absolute inset-0 p-6">
                  {/* Sidebar */}
                  <div className="absolute left-0 top-0 bottom-0 w-56 border-r border-white/5 p-4">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600" />
                      <span className="font-semibold text-sm">Construction OS</span>
                    </div>
                    <div className="space-y-1">
                      {['Dashboard', 'Projects', 'RFIs', 'Submittals', 'Change Orders', 'Daily Reports'].map((item, i) => (
                        <div
                          key={item}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${i === 0 ? 'bg-white/5 text-white' : 'text-white/40'}`}
                        >
                          <div className={`h-4 w-4 rounded ${i === 0 ? 'bg-orange-500/20' : 'bg-white/10'}`} />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="ml-56 pl-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold">Dashboard</h2>
                      <p className="text-sm text-white/40">Welcome back</p>
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      {[
                        { label: 'Active Projects', value: '30', icon: '📁' },
                        { label: 'Team Members', value: '12', icon: '👥' },
                        { label: 'Open RFIs', value: '8', icon: '📋' },
                        { label: 'Budget', value: '0%', icon: '📈', sub: 'under budget' }
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-white/40">{stat.label}</span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-sm">
                              {stat.icon}
                            </div>
                          </div>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          {stat.sub && <p className="text-xs text-white/30 mt-1">{stat.sub}</p>}
                        </div>
                      ))}
                    </div>

                    {/* Bottom cards */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <span className="h-5 w-5 rounded bg-orange-500/20 flex items-center justify-center text-xs">📊</span>
                          Project Status
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-white/40">Active</span><span className="text-orange-400">30</span></div>
                          <div className="flex justify-between"><span className="text-white/40">Completed</span><span>0</span></div>
                          <div className="flex justify-between"><span className="text-white/40">On Hold</span><span className="text-orange-400">33</span></div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <span className="h-5 w-5 rounded bg-green-500/20 flex items-center justify-center text-xs">💰</span>
                          Budget Overview
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-white/40">Total Budget</span><span>$344,214,100</span></div>
                          <div className="flex justify-between"><span className="text-white/40">Total Spent</span><span className="text-green-400">$5,750</span></div>
                          <div className="flex justify-between"><span className="text-white/40">Remaining</span><span className="text-green-400">$344,208,350</span></div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <span className="h-5 w-5 rounded bg-blue-500/20 flex items-center justify-center text-xs">📝</span>
                          Workflow Items
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-white/40">Open RFIs</span><span>0</span></div>
                          <div className="flex justify-between"><span className="text-white/40">Pending Submittals</span><span>0</span></div>
                          <div className="flex justify-between"><span className="text-white/40">Avg Completion</span><span>81%</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glow effect */}
            <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-b from-orange-500/20 via-transparent to-transparent opacity-50" />
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SOCIAL PROOF - Simple, elegant */}
      {/* ================================================================== */}
      <section className="border-y border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <p className="text-sm text-white/30">
              Trusted by contractors managing over $847M in projects
            </p>
            <div className="flex items-center gap-12">
              {[
                { value: '2,847', label: 'RFIs processed' },
                { value: '95%', label: 'Field adoption' },
                { value: '70%', label: 'Cost savings' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/30">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FEATURES - Clean grid */}
      {/* ================================================================== */}
      <section id="features" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          {/* Section header */}
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need,<br />nothing you don't.
            </h2>
            <p className="mt-4 text-lg text-white/50">
              Purpose-built for construction. Not another generic project tool.
            </p>
          </div>

          {/* Feature grid */}
          <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Offline-first mobile',
                description: 'Full functionality in dead zones, tunnels, and basements. Syncs automatically when connected.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                  </svg>
                ),
              },
              {
                title: 'Native RFI workflows',
                description: 'Ball-in-court tracking, automatic escalation, and response time analytics built in.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                ),
              },
              {
                title: 'Unlimited users',
                description: '$299/project includes your entire team. No per-seat pricing surprises.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                ),
              },
              {
                title: 'Change order tracking',
                description: 'From request to approval with full audit trail. Integrates with your accounting.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                ),
              },
              {
                title: 'Daily reports',
                description: 'Photo documentation, weather tracking, and crew logs. Submit from anywhere.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                ),
              },
              {
                title: 'Enterprise security',
                description: 'SOC 2 Type II certified. Role-based access. Daily encrypted backups.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-orange-500/20 hover:bg-white/[0.04]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PRICING - Simple, single tier */}
      {/* ================================================================== */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Simple pricing
              </h2>
              <p className="mt-4 text-lg text-white/50">
                One plan. Everything included. No per-seat fees.
              </p>
            </div>

            {/* Pricing card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent"
            >
              <div className="p-8 md:p-12">
                <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                  <div>
                    <p className="text-sm font-medium text-orange-400">Professional</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-5xl font-bold">$299</span>
                      <span className="text-white/50">/project/month</span>
                    </div>
                    <p className="mt-2 text-sm text-white/40">
                      Unlimited users included
                    </p>
                  </div>
                  <Link
                    href="/signup"
                    className="flex h-12 items-center gap-2 rounded-full bg-white px-8 text-sm font-medium text-black transition-all hover:bg-white/90"
                  >
                    Start 14-day free trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-10 grid gap-4 border-t border-white/5 pt-10 md:grid-cols-2">
                  {[
                    'Unlimited team members',
                    'Full RFI & submittal workflows',
                    'Change order management',
                    'Offline-first mobile app',
                    'Daily reports with photos',
                    'QuickBooks integration',
                    'Priority support (2hr SLA)',
                    'SOC 2 Type II certified',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20">
                        <svg className="h-3 w-3 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Enterprise callout */}
            <p className="mt-8 text-center text-sm text-white/40">
              Managing $50M+ in projects?{' '}
              <Link href="/contact" className="text-orange-400 hover:underline">
                Contact us for enterprise pricing
                <ArrowUpRight className="ml-1 inline h-3 w-3" />
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA */}
      {/* ================================================================== */}
      <section className="border-t border-white/5 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to modernize your<br />construction management?
            </h2>
            <p className="mt-4 text-lg text-white/50">
              Start your 14-day free trial. No credit card required.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-6 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/contact"
                className="flex h-12 items-center gap-2 rounded-full border border-white/10 px-6 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:text-white"
              >
                Talk to sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FOOTER */}
      {/* ================================================================== */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
              </div>
              <span className="font-semibold">Construction OS</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-white/40">
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </div>
            <p className="text-sm text-white/30">
              © {new Date().getFullYear()} Construction OS
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
