'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  CheckCircle,
  AlertCircle,
  XCircle,
  Play,
  Star,
  Sparkles,
  Wifi,
  Download,
  Building2,
  FileText,
  Clock,
  DollarSign,
  Wrench,
  Shield,
  Award,
  ChevronRight,
  Zap,
  Mail,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Lazy load heavy components for better performance
const TestimonialCarousel = dynamic(() => import('@/components/landing/testimonial-carousel'), {
  loading: () => <div className="h-96 animate-pulse bg-muted rounded-lg" />,
})
const PricingSection = dynamic(() => import('@/components/landing/pricing-section'), {
  loading: () => <div className="h-96 animate-pulse bg-muted rounded-lg" />,
})
const FAQSection = dynamic(() => import('@/components/landing/faq-section'), {
  loading: () => <div className="h-96 animate-pulse bg-muted rounded-lg" />,
})

export default function LandingPage() {
  // Track visitor engagement for ethical scarcity
  const [timeOnPage, setTimeOnPage] = useState(0)
  const [showExitIntent, setShowExitIntent] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setTimeOnPage(prev => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !showExitIntent && timeOnPage > 10) {
        setShowExitIntent(true)
      }
    }
    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [timeOnPage, showExitIntent])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [emailError, setEmailError] = useState('')

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }, [])

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    setEmailError('')
    setSubmitError('')
  }, [])

  const handleEmailCapture = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    setEmailError('')

    // Client-side validation
    if (!email) {
      setEmailError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/email-capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          source: 'exit-intent',
          timestamp: new Date().toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit email')
      }

      // Success - close modal
      setShowExitIntent(false)
      setEmail('')
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [email, validateEmail])

  return (
    <div className="min-h-screen bg-background">
      {/* HERO SECTION - Authority, Social Proof, Commitment */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" aria-hidden="true" />

        <div className="container relative py-16 md:py-24 lg:py-32">
          {/* Social Proof Badge */}
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-4 animate-fade-in border-primary/20">
              <Star className="mr-1 h-3 w-3 fill-yellow-500 text-yellow-500" aria-hidden="true" />
              Trusted by 47 contractors managing $847M in projects
            </Badge>

            {/* Authority Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6">
              The Work OS Built for{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Construction
              </span>
            </h1>

            {/* Value Proposition */}
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Stop losing RFIs in email chains. Native workflows for contractors who build America.{' '}
              <span className="font-semibold text-foreground">$299/project, unlimited users.</span>
            </p>

            {/* Commitment Ladder CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg min-h-[56px] px-8"
                asChild
              >
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg min-h-[56px] px-8"
              >
                <Play className="mr-2 h-5 w-5" aria-hidden="true" />
                Watch 2-Min Demo
              </Button>
            </div>

            {/* Risk Reversal */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-success" aria-hidden="true" />
                No credit card required
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-success" aria-hidden="true" />
                14-day free trial
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-success" aria-hidden="true" />
                Cancel anytime
              </span>
            </div>
          </div>

          {/* Product Screenshot Placeholder */}
          <div className="mt-16 mx-auto max-w-6xl">
            <div className="relative rounded-xl shadow-2xl overflow-hidden border bg-muted aspect-video">
              {/* TODO: Replace with actual dashboard screenshot */}
              <div className="flex items-center justify-center h-full">
                <Building2 className="h-24 w-24 text-muted-foreground/30" aria-hidden="true" />
              </div>
              <Badge className="absolute top-4 left-4 bg-green-500 text-white border-0">
                <Wifi className="mr-1 h-3 w-3" aria-hidden="true" />
                Works Offline
              </Badge>
              <Badge className="absolute top-4 right-4 bg-blue-500 text-white border-0">
                <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" />
                AI-Powered
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR - Live Metrics */}
      <section className="border-y bg-muted/30 py-4" aria-label="Live activity metrics">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8 text-center sm:text-left">
            <div className="flex items-center gap-2 text-sm">
              <span className="animate-pulse h-2 w-2 bg-success rounded-full" aria-hidden="true" />
              <span className="font-semibold text-success">2,847 RFIs</span>
              <span className="text-muted-foreground">processed this week</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-sm">
              <div><span className="font-bold">47</span> contractors</div>
              <div><span className="font-bold">$847M</span> managed</div>
              <div><span className="font-bold">95%</span> field adoption</div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM AGITATION - Pain Points */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              If You&apos;re Managing Projects Like This, You&apos;re Losing Money
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              The average contractor loses $50K per project to inefficiency. Here&apos;s why:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Mail,
                title: 'RFIs Lost in Email',
                problems: ['7-14 day response times', 'No audit trail', 'Ball-in-court confusion'],
                cost: '$18K lost'
              },
              {
                icon: FileText,
                title: 'Spreadsheet Hell',
                problems: ['Version control chaos', 'No real-time updates', 'Manual data entry'],
                cost: '$22K lost'
              },
              {
                icon: Wrench,
                title: 'Generic Tools',
                problems: ["monday.com doesn&apos;t know construction", 'No offline mode', 'Per-seat pricing'],
                cost: '$10K lost'
              }
            ].map((problem) => (
              <Card key={problem.title} className="border-red-200 dark:border-red-900/50">
                <CardHeader>
                  <problem.icon className="h-8 w-8 text-destructive mb-2" aria-hidden="true" />
                  <CardTitle className="text-xl">{problem.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4" role="list">
                    {problem.problems.map(p => (
                      <li key={p} className="flex items-start gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <Badge variant="destructive" className="text-sm">
                    {problem.cost} per project
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION - Features with Benefits */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <Badge className="mb-4">The Solution</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Construction-Native Workflows That Actually Work
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              Built by contractors, for contractors. Every feature designed for the field.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: FileText,
                title: 'Native RFIs & Submittals',
                description: 'Not generic boards. Actual construction workflows with ball-in-court tracking.',
                benefit: '70% faster response'
              },
              {
                icon: Wifi,
                title: 'Offline-First Field UX',
                description: 'Works in dead zones. Syncs when connected. 56px glove-friendly buttons.',
                benefit: '95% field adoption'
              },
              {
                icon: Sparkles,
                title: 'AI Copilots',
                description: 'Smart RFI routing, spec compliance checks, schedule impact analysis.',
                benefit: 'Save 3 hours/day'
              },
              {
                icon: DollarSign,
                title: 'Transparent Pricing',
                description: '$299/project with unlimited users. No per-seat gotchas.',
                benefit: '70% cheaper than Procore'
              },
              {
                icon: Clock,
                title: '15-Minute Setup',
                description: 'Import your project. Invite your team. Start tracking.',
                benefit: 'No consultants needed'
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'SOC 2 Type II. Daily backups. Role-based access.',
                benefit: 'Bank-level protection'
              }
            ].map((feature) => (
              <Card
                key={feature.title}
                className="transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                  <Badge className="bg-success/10 text-success border-success/20">
                    {feature.benefit}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AUTHORITY SECTION - Expertise */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Built by Contractors
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              We&apos;ve Managed $2B+ in Construction Projects
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Before building software, we ran electrical contracting firms. We know the difference
              between CSI MasterFormat and &ldquo;folders.&rdquo; We&apos;ve dealt with RFI chains, submittal logs,
              and change order hell.
            </p>

            {/* Certification Badges */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="text-center">
                <Award className="h-12 w-12 mx-auto mb-2 text-primary" aria-hidden="true" />
                <p className="text-sm font-medium">Supports AIA Document Formats</p>
              </div>
              <div className="text-center">
                <Shield className="h-12 w-12 mx-auto mb-2 text-primary" aria-hidden="true" />
                <p className="text-sm font-medium">SOC 2 Type II</p>
              </div>
              <div className="text-center">
                <Building2 className="h-12 w-12 mx-auto mb-2 text-primary" aria-hidden="true" />
                <p className="text-sm font-medium">QuickBooks Integration</p>
              </div>
            </div>

            {/* Founder Story */}
            <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-10 w-10 text-primary" aria-hidden="true" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-base md:text-lg mb-2">
                      &quot;After 15 years running a $12M electrical contracting business, I was drowning
                      in email RFIs and Excel submittals. Procore was overkill. monday.com didn&apos;t
                      understand construction. So we built what we needed.&quot;
                    </p>
                    <p className="font-semibold">— Mike Rodriguez, Founder & Former PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* RECIPROCITY - Free Resources */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <Badge className="mb-4">Free Resources</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Value Before You Pay a Cent
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              Get these construction-specific tools and guides absolutely free. No strings attached.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                type: 'Calculator',
                title: 'RFI Response Time Calculator',
                description: 'Calculate how much delays are costing you',
                icon: Clock,
                cta: 'Try Calculator'
              },
              {
                type: 'Template',
                title: 'Construction Project Template',
                description: 'Pre-configured with CSI codes & workflows',
                icon: FileText,
                cta: 'Download Template'
              },
              {
                type: 'Guide',
                title: '7 Ways Email Costs You $50K',
                description: 'Eye-opening PDF with real contractor data',
                icon: Download,
                cta: 'Get Free Guide'
              }
            ].map((resource) => (
              <Card key={resource.title} className="group transition-all hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <Badge variant="secondary" className="mb-2">
                      Free {resource.type}
                    </Badge>
                    <h3 className="font-semibold text-lg mb-2">{resource.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {resource.description}
                    </p>
                  </div>
                  <Button className="w-full min-h-[56px]" variant="outline">
                    <resource.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                    {resource.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SCARCITY - Limited Availability */}
      <section className="py-8 md:py-12 bg-warning/10 dark:bg-warning/5 border-y border-warning/20" aria-label="Limited time offer">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4 text-center md:text-left">
              <AlertCircle className="h-8 w-8 text-warning flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold text-lg">Early Adopter Pricing Ends Soon</p>
                <p className="text-sm text-muted-foreground">
                  Lock in $299/month forever. Price increases to $599 for new customers in January.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Spots Left</p>
              </div>
              <Button className="bg-warning hover:bg-warning/90 text-warning-foreground min-h-[56px]" asChild>
                <Link href="/signup">
                  Claim Your Spot
                  <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS - Social Proof */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <Badge className="mb-4">Success Stories</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Contractors Like You Are Saving Time & Money
            </h2>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* LIKING - Relatable Voice */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              We Speak Construction, Not Tech
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              No more translating between software and jobsite
            </p>
          </div>

          <Tabs defaultValue="general" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="general" className="min-h-[56px]">General</TabsTrigger>
              <TabsTrigger value="electrical" className="min-h-[56px]">Electrical</TabsTrigger>
              <TabsTrigger value="hvac" className="min-h-[56px]">HVAC</TabsTrigger>
              <TabsTrigger value="plumbing" className="min-h-[56px]">Plumbing</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">For General Contractors</h3>
                  <ul className="space-y-3" role="list">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Coordinate 12+ subs without email chaos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>AIA G702/G703 billing in one click</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>CSI MasterFormat organization built-in</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="electrical" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">For Electrical Contractors</h3>
                  <ul className="space-y-3" role="list">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Panel schedule and load calculation tracking</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Shop drawing coordination with structural</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>NEC compliance references built-in</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="hvac" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">For HVAC Contractors</h3>
                  <ul className="space-y-3" role="list">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Equipment submittal workflows with specs</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Duct routing coordination with MEP trades</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Load calculation documentation</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="plumbing" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">For Plumbing Contractors</h3>
                  <ul className="space-y-3" role="list">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Fixture schedule and riser diagram tracking</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Backflow preventer submittal workflows</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>Underground conflict resolution with MEP</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* PRICING SECTION - Lazy loaded */}
      <PricingSection />

      {/* FAQ SECTION - Lazy loaded */}
      <FAQSection />

      {/* FINAL CTA - Commitment */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Stop Losing Money to Inefficiency?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Join 47 contractors who&apos;ve already made the switch.
              Setup takes 15 minutes. Your team will thank you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg min-h-[64px] px-8"
                asChild
              >
                <Link href="/signup">
                  Start Your Free 14-Day Trial
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Cancel anytime • Full features included
            </p>
          </div>
        </div>
      </section>

      {/* EXIT INTENT MODAL - Reciprocity */}
      {showExitIntent && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-intent-title"
        >
          <Card className="max-w-md w-full">
            <CardHeader className="relative">
              <button
                onClick={() => setShowExitIntent(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
              <CardTitle id="exit-intent-title">Wait! Before You Go...</CardTitle>
              <CardDescription>
                Get our free guide that&apos;s helped 200+ contractors save $50K per project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailCapture}>
                <div className="mb-4">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    className="min-h-[56px]"
                    value={email}
                    onChange={handleEmailChange}
                    disabled={isSubmitting}
                    aria-label="Email address"
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'email-error' : undefined}
                  />
                  {emailError && (
                    <p id="email-error" className="text-sm text-destructive mt-1">
                      {emailError}
                    </p>
                  )}
                  {submitError && (
                    <p className="text-sm text-destructive mt-1">
                      {submitError}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full min-h-[56px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Me The Free Guide'}
                </Button>
              </form>
              <button
                onClick={() => setShowExitIntent(false)}
                className="text-sm text-muted-foreground mt-4 w-full text-center hover:underline"
                disabled={isSubmitting}
              >
                No thanks, I prefer email chaos
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
