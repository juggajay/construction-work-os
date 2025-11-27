'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Check,
  CheckCircle,
  Play,
  Star,
  Sparkles,
  Wifi,
  Building2,
  FileText,
  DollarSign,
  Shield,
  Mail,
  Users,
  TrendingUp,
  AlertTriangle,
  Timer,
  Calculator,
  Quote,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Lazy load heavy components
const FAQSection = dynamic(() => import('@/components/landing/faq-section'), {
  loading: () => <div className="h-96 animate-pulse bg-muted rounded-lg" />,
})

// ============================================================================
// ANIMATED BACKGROUND COMPONENT
// ============================================================================
function AnimatedGradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />

      {/* Animated orbs */}
      <motion.div
        className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-96 h-96 bg-construction-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.03)_1px,transparent_1px)] bg-[size:64px_64px]"
        aria-hidden="true"
      />
    </div>
  )
}

// ============================================================================
// FLOATING CTA BAR (appears on scroll)
// ============================================================================
function FloatingCTA({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b shadow-lg"
        >
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold hidden sm:inline">Construction Work OS</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden md:inline">
                Join 47+ contractors saving $50K/project
              </span>
              <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// LOGO CAROUSEL
// ============================================================================
const logos = [
  { name: 'Thompson Brothers', initial: 'TB' },
  { name: 'Martinez Construction', initial: 'MC' },
  { name: 'Chen Electric', initial: 'CE' },
  { name: 'Alpine Builders', initial: 'AB' },
  { name: 'Park HVAC', initial: 'PH' },
  { name: 'Summit Contractors', initial: 'SC' },
]

function LogoCarousel() {
  return (
    <div className="flex items-center gap-8 overflow-hidden">
      <motion.div
        className="flex items-center gap-8"
        animate={{ x: [0, -1000] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {[...logos, ...logos].map((logo, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-muted-foreground/60 whitespace-nowrap"
          >
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-sm">
              {logo.initial}
            </div>
            <span className="font-medium">{logo.name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ============================================================================
// METRIC COUNTER ANIMATION
// ============================================================================
function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number, suffix?: string, prefix?: string }) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const duration = 2000
          const steps = 60
          const increment = value / steps
          let current = 0

          const timer = setInterval(() => {
            current += increment
            if (current >= value) {
              setCount(value)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [value, hasAnimated])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

// ============================================================================
// BEFORE/AFTER COMPARISON
// ============================================================================
function BeforeAfterComparison() {
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
      {/* Before */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Card className="border-destructive/30 bg-destructive/5 h-full">
          <CardHeader>
            <Badge variant="destructive" className="w-fit mb-2">Before</Badge>
            <CardTitle className="text-xl">The Chaos of Email & Spreadsheets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: Mail, text: 'RFIs buried in email threads', stat: '12+ day response time' },
              { icon: AlertTriangle, text: 'Version control nightmares', stat: 'Which Excel is correct?' },
              { icon: Users, text: 'Field team can\'t access info', stat: '0% field adoption' },
              { icon: DollarSign, text: 'Per-seat pricing bleeds budget', stat: '$1,200/user/year' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium">{item.text}</p>
                  <p className="text-sm text-destructive">{item.stat}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* After */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="border-primary/30 bg-primary/5 h-full">
          <CardHeader>
            <Badge className="w-fit mb-2 bg-primary">After</Badge>
            <CardTitle className="text-xl">One Platform. Total Control.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: FileText, text: 'Native RFI workflows with tracking', stat: '2 day avg response' },
              { icon: CheckCircle, text: 'Single source of truth', stat: 'Real-time sync' },
              { icon: Wifi, text: 'Offline-first mobile app', stat: '95% field adoption' },
              { icon: Users, text: 'Unlimited users per project', stat: '$299/project flat' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{item.text}</p>
                  <p className="text-sm text-primary">{item.stat}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ============================================================================
// ROI CALCULATOR
// ============================================================================
function ROICalculator() {
  const [projects, setProjects] = useState(3)
  const [teamSize, setTeamSize] = useState(15)

  const procoreCost = projects * 1000 + teamSize * 100 // Rough Procore pricing
  const ourCost = projects * 299
  const savings = procoreCost - ourCost
  const timeSaved = teamSize * 4 // 4 hours per person per month
  const rfiSavings = projects * 18000 // $18K per project from faster RFIs

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <Badge className="w-fit mx-auto mb-2">
          <Calculator className="h-3 w-3 mr-1" />
          ROI Calculator
        </Badge>
        <CardTitle>See Your Potential Savings</CardTitle>
        <CardDescription>Adjust the sliders to match your business</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Slider */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium">Active Projects</label>
            <span className="text-sm font-bold text-primary">{projects}</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={projects}
            onChange={(e) => setProjects(parseInt(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Team Size Slider */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium">Team Members</label>
            <span className="text-sm font-bold text-primary">{teamSize}</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            value={teamSize}
            onChange={(e) => setTeamSize(parseInt(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Results */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">${savings.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Software Savings/yr</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{timeSaved}h</p>
            <p className="text-xs text-muted-foreground">Time Saved/mo</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">${rfiSavings.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">RFI Efficiency Gains</p>
          </div>
        </div>

        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <p className="text-lg font-bold">
            Total Annual Impact: <span className="text-primary">${(savings + rfiSavings).toLocaleString()}</span>
          </p>
        </div>

        <Button className="w-full min-h-[56px]" size="lg" asChild>
          <Link href="/signup">
            Claim Your Savings
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// TESTIMONIAL WITH PHOTO
// ============================================================================
interface TestimonialData {
  quote: string
  name: string
  title: string
  company: string
  metric: string
  avatar: string
}

const testimonials: TestimonialData[] = [
  {
    quote: "We cut RFI response time from 12 days to 2 days. The ball-in-court tracking eliminated all the 'whose turn is it?' confusion. Our architects actually thanked us.",
    name: "Sarah Martinez",
    title: "Project Manager",
    company: "Martinez Construction LLC",
    metric: "83% faster RFI responses",
    avatar: "SM",
  },
  {
    quote: "Switched from Procore and cut our software costs by 70%. The unlimited user model means our whole field team can actually use it. Game changer for collaboration.",
    name: "Mike Thompson",
    title: "General Contractor",
    company: "Thompson Brothers Construction",
    metric: "$8,400 annual savings",
    avatar: "MT",
  },
  {
    quote: "The offline mode saved us on a remote hospital project with spotty service. Finally, a tool that understands we're not always connected.",
    name: "James Chen",
    title: "Electrical Contractor",
    company: "Chen Electric & Controls",
    metric: "95% field adoption",
    avatar: "JC",
  },
]

function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-8 md:p-12">
              {/* Stars */}
              <div className="flex gap-1 mb-6 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                ))}
              </div>

              {/* Quote */}
              <div className="relative mb-8">
                <Quote className="absolute -top-4 -left-4 h-8 w-8 text-primary/20" />
                <blockquote className="text-lg md:text-xl text-center leading-relaxed italic">
                  {testimonials[activeIndex]?.quote}
                </blockquote>
              </div>

              {/* Metric */}
              <div className="flex justify-center mb-6">
                <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm font-semibold">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {testimonials[activeIndex]?.metric}
                </Badge>
              </div>

              {/* Author */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  {testimonials[activeIndex]?.avatar}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">{testimonials[activeIndex]?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonials[activeIndex]?.title}, {testimonials[activeIndex]?.company}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// PRICING SECTION (FOCUSED)
// ============================================================================
function PricingSection() {
  return (
    <section className="py-24 bg-background" id="pricing">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4">Simple Pricing</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            One Price. Unlimited Users.
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No per-seat gotchas. No hidden fees. Just flat, predictable pricing.
          </p>
        </motion.div>

        {/* Single Featured Plan */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-lg mx-auto"
        >
          <Card className="border-primary shadow-2xl relative overflow-hidden">
            {/* Popular badge */}
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold rounded-bl-lg">
              Most Popular
            </div>

            <CardHeader className="text-center pt-8 pb-4">
              <CardTitle className="text-2xl mb-2">Professional</CardTitle>
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-6xl font-bold">$299</span>
                <span className="text-muted-foreground">/project/month</span>
              </div>
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                70% cheaper than Procore
              </Badge>
            </CardHeader>

            <CardContent className="pb-8">
              <ul className="space-y-4 mb-8">
                {[
                  'Unlimited team members',
                  'Full RFI, Submittal & Change Order workflows',
                  'Offline-first mobile app',
                  'QuickBooks Integration',
                  'Priority support (2-hour SLA)',
                  'SOC 2 Type II security',
                  '14-day free trial',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full min-h-[56px] text-lg" size="lg" asChild>
                <Link href="/signup">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                No credit card required • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Money-back guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-md mx-auto mt-8"
        >
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold">30-Day Money-Back Guarantee</p>
              <p className="text-sm text-muted-foreground">
                Not seeing results? Full refund, no questions asked.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enterprise callout */}
        <p className="text-center text-muted-foreground mt-8">
          Managing $50M+ in projects?{' '}
          <Link href="/contact" className="text-primary font-medium hover:underline">
            Contact us for Enterprise pricing →
          </Link>
        </p>
      </div>
    </section>
  )
}

// ============================================================================
// MAIN LANDING PAGE
// ============================================================================
export default function LandingPage() {
  const [showFloatingCTA, setShowFloatingCTA] = useState(false)
  const heroRef = useRef<HTMLElement>(null)

  // Track scroll for floating CTA
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.offsetTop + heroRef.current.offsetHeight
        setShowFloatingCTA(window.scrollY > heroBottom - 100)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <FloatingCTA visible={showFloatingCTA} />

      {/* ================================================================== */}
      {/* HERO SECTION */}
      {/* ================================================================== */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center overflow-hidden">
        <AnimatedGradientBackground />

        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-10">
          <div className="container flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">Construction Work OS</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="container relative z-10 pt-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Social Proof Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-primary/30 bg-primary/5">
                <Star className="mr-2 h-4 w-4 fill-yellow-500 text-yellow-500" />
                Trusted by 47 contractors managing $847M in projects
              </Badge>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              Stop Losing{' '}
              <span className="bg-gradient-to-r from-primary via-construction-500 to-primary bg-clip-text text-transparent">
                $50K Per Project
              </span>{' '}
              to Email Chaos
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              The construction management platform that actually works offline,
              has native RFI workflows, and costs{' '}
              <span className="font-semibold text-foreground">70% less than Procore.</span>
            </motion.p>

            {/* Single Primary CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg min-h-[64px] px-10 shadow-lg shadow-primary/25"
                asChild
              >
                <Link href="/signup">
                  Start Your Free 14-Day Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg min-h-[64px] px-8"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch 2-Min Demo
              </Button>
            </motion.div>

            {/* Trust Signals */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Setup in 15 minutes
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Cancel anytime
              </span>
            </motion.div>
          </div>

          {/* Product Screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 mx-auto max-w-6xl"
          >
            <div className="relative rounded-xl shadow-2xl overflow-hidden border bg-card aspect-video group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Building2 className="h-24 w-24 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground">Dashboard Preview</p>
                </div>
              </div>

              {/* Feature badges on screenshot */}
              <Badge className="absolute top-4 left-4 bg-green-500 text-white border-0 shadow-lg">
                <Wifi className="mr-1 h-3 w-3" />
                Works Offline
              </Badge>
              <Badge className="absolute top-4 right-4 bg-blue-500 text-white border-0 shadow-lg">
                <Sparkles className="mr-1 h-3 w-3" />
                AI-Powered
              </Badge>
              <Badge className="absolute bottom-4 left-4 bg-purple-500 text-white border-0 shadow-lg">
                <Users className="mr-1 h-3 w-3" />
                Unlimited Users
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SOCIAL PROOF BAR */}
      {/* ================================================================== */}
      <section className="py-8 border-y bg-muted/30 overflow-hidden">
        <div className="container">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Live Metrics */}
            <div className="flex items-center gap-8 text-center lg:text-left">
              <div>
                <p className="text-3xl font-bold text-primary">
                  <AnimatedCounter value={2847} />
                </p>
                <p className="text-sm text-muted-foreground">RFIs This Week</p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  <AnimatedCounter value={847} prefix="$" suffix="M" />
                </p>
                <p className="text-sm text-muted-foreground">Projects Managed</p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  <AnimatedCounter value={95} suffix="%" />
                </p>
                <p className="text-sm text-muted-foreground">Field Adoption</p>
              </div>
            </div>

            {/* Logo scroll */}
            <div className="flex-1 min-w-0 hidden lg:block">
              <LogoCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* BEFORE/AFTER SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4" variant="destructive">The Problem</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Email Is Costing You $50K Per Project
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The average contractor loses money to slow RFIs, version confusion, and tools that don&apos;t work in the field.
            </p>
          </motion.div>

          <BeforeAfterComparison />
        </div>
      </section>

      {/* ================================================================== */}
      {/* FEATURES SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">Why Contractors Switch</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Built Different. Built for Construction.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Not another generic project tool. Purpose-built for how construction actually works.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: FileText,
                title: 'Native RFI Workflows',
                description: 'Ball-in-court tracking, automatic escalation, and response time analytics. Not generic boards.',
                metric: '70% faster responses',
              },
              {
                icon: Wifi,
                title: 'Offline-First Mobile',
                description: 'Works in dead zones, tunnels, and basements. Syncs automatically when connected.',
                metric: '95% field adoption',
              },
              {
                icon: Sparkles,
                title: 'AI Copilot',
                description: 'Smart routing, spec compliance checks, and predictive schedule impact analysis.',
                metric: 'Save 3 hours/day',
              },
              {
                icon: Users,
                title: 'Unlimited Users',
                description: '$299/project includes everyone. No per-seat pricing. Your whole team can use it.',
                metric: '70% cost savings',
              },
              {
                icon: Timer,
                title: '15-Min Setup',
                description: 'Import your project, invite your team, start tracking. No consultants needed.',
                metric: 'Same-day deployment',
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'SOC 2 Type II certified. Daily backups. Role-based access control.',
                metric: 'Bank-level protection',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{feature.description}</p>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {feature.metric}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* ROI CALCULATOR SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4">Calculate Your Savings</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              What&apos;s Inefficiency Costing You?
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ROICalculator />
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* TESTIMONIALS SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4">Success Stories</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Contractors Like You Are Winning
            </h2>
          </motion.div>

          <TestimonialsSection />
        </div>
      </section>

      {/* ================================================================== */}
      {/* PRICING SECTION */}
      {/* ================================================================== */}
      <PricingSection />

      {/* ================================================================== */}
      {/* FAQ SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-muted/30" id="faq">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Questions? We&apos;ve Got Answers.
            </h2>
          </motion.div>
          <FAQSection />
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA SECTION */}
      {/* ================================================================== */}
      <section className="py-24 bg-gradient-to-b from-background to-primary/5 relative overflow-hidden">
        <AnimatedGradientBackground />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Stop Losing Money to Inefficiency?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join 47 contractors who&apos;ve already made the switch.
              Setup takes 15 minutes. Your team will thank you.
            </p>

            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-lg min-h-[64px] px-10 shadow-lg shadow-primary/25"
              asChild
            >
              <Link href="/signup">
                Start Your Free 14-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • Full features • Cancel anytime
            </p>

            {/* Final social proof */}
            <div className="flex flex-wrap justify-center gap-8 mt-12 pt-12 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold">47+</p>
                <p className="text-sm text-muted-foreground">Active Contractors</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">$847M</p>
                <p className="text-sm text-muted-foreground">Projects Managed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">4.9/5</p>
                <p className="text-sm text-muted-foreground">Customer Rating</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FOOTER */}
      {/* ================================================================== */}
      <footer className="py-12 border-t bg-background">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold">Construction Work OS</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Construction Work OS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
