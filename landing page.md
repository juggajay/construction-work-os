/**
 * Construction Work OS Landing Page
 * Implements all 6 Cialdini principles of persuasion
 * Optimized for mid-market contractor conversion
 */

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
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
  Users,
  Wrench,
  HardHat,
  TrendingUp,
  Shield,
  Award,
  ChevronRight,
  Calendar,
  Zap,
  Mail
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// Lazy load heavy components
const TestimonialCarousel = dynamic(() => import('@/components/landing/testimonial-carousel'))
const PricingSection = dynamic(() => import('@/components/landing/pricing-section'))
const FAQSection = dynamic(() => import('@/components/landing/faq-section'))

export default function LandingPage() {
  // Track visitor urgency (for ethical scarcity)
  const [timeOnPage, setTimeOnPage] = useState(0)
  const [showExitIntent, setShowExitIntent] = useState(false)
  
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

  return (
    <div className="min-h-screen bg-background">
      {/* HERO SECTION - Implements Authority, Social Proof, Commitment */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        
        <div className="container relative py-24 md:py-32">
          {/* Social Proof Badge (Principle 1) */}
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-4 animate-fade-in">
              <Star className="mr-1 h-3 w-3 fill-yellow-500 text-yellow-500" />
              Trusted by 47 contractors managing $847M in projects
            </Badge>
            
            {/* Authority Headline (Principle 2) */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6">
              The Work OS Built for{' '}
              <span className="text-gradient-primary">Construction</span>
            </h1>
            
            {/* Value Proposition */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Stop losing RFIs in email chains. Native workflows for contractors who build America.{' '}
              <span className="font-semibold text-foreground">$299/project, unlimited users.</span>
            </p>
            
            {/* Commitment Ladder CTAs (Principle 5) */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button size="lg" className="cta-primary text-lg min-h-[56px]">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg min-h-[56px]">
                <Play className="mr-2 h-5 w-5" />
                Watch 2-Min Demo
              </Button>
            </div>
            
            {/* Risk Reversal */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-success" />
                No credit card required
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-success" />
                14-day free trial
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-success" />
                Cancel anytime
              </span>
            </div>
          </div>
          
          {/* Product Screenshot with Trust Badges */}
          <div className="mt-16 mx-auto max-w-6xl">
            <div className="relative rounded-xl shadow-2xl overflow-hidden border elevation-1">
              <img 
                src="/dashboard-screenshot.png" 
                alt="Construction Work OS Dashboard"
                className="w-full dark:brightness-90"
              />
              <Badge className="absolute top-4 left-4 bg-green-500 text-white">
                <Wifi className="mr-1 h-3 w-3" />
                Works Offline
              </Badge>
              <Badge className="absolute top-4 right-4 bg-blue-500 text-white">
                <Sparkles className="mr-1 h-3 w-3" />
                AI-Powered
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR - Live Metrics (Principle 1) */}
      <section className="border-y bg-muted/30 py-4">
        <div className="container">
          <div className="flex items-center justify-between gap-8 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm">
              <span className="animate-pulse h-2 w-2 bg-success rounded-full" />
              <span className="font-semibold text-success">2,847 RFIs</span>
              <span className="text-muted-foreground">processed this week</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div><span className="font-bold">47</span> contractors</div>
              <div><span className="font-bold">$847M</span> managed</div>
              <div><span className="font-bold">95%</span> field adoption</div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM AGITATION - Pain Points */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              If You're Managing Projects Like This, You're Losing Money
            </h2>
            <p className="text-xl text-muted-foreground">
              The average contractor loses $50K per project to inefficiency. Here's why:
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Mail,
                title: 'RFIs Lost in Email',
                problems: ['3-day response times', 'No audit trail', 'Ball-in-court confusion'],
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
                problems: ["monday.com doesn't know construction", 'No offline mode', 'Per-seat pricing'],
                cost: '$10K lost'
              }
            ].map((problem) => (
              <Card key={problem.title} className="border-red-200 dark:border-red-900/50">
                <CardHeader>
                  <problem.icon className="h-8 w-8 text-danger mb-2" />
                  <CardTitle className="text-xl">{problem.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {problem.problems.map(p => (
                      <li key={p} className="flex items-start gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-danger mt-0.5" />
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
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <Badge className="mb-4">The Solution</Badge>
            <h2 className="text-4xl font-bold mb-4">
              Construction-Native Workflows That Actually Work
            </h2>
            <p className="text-xl text-muted-foreground">
              Built by contractors, for contractors. Every feature designed for the field.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
                description: 'Smart RFI routing, compliance checks, predictive delays.',
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
              <Card key={feature.title} className="hover-lift">
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>{feature.title}</CardTitle>
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

      {/* AUTHORITY SECTION - Expertise (Principle 2) */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="expertise-badge mb-4">
              Built by Contractors
            </Badge>
            <h2 className="text-4xl font-bold mb-6">
              We've Managed $2B+ in Construction Projects
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Before building software, we ran electrical contracting firms. We know the difference 
              between CSI MasterFormat and "folders." We've dealt with RFI chains, submittal logs, 
              and change order hell.
            </p>
            
            {/* Certification Badges */}
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <Award className="h-12 w-12 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">AIA Compatible</p>
              </div>
              <div className="text-center">
                <Shield className="h-12 w-12 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">SOC 2 Type II</p>
              </div>
              <div className="text-center">
                <Building2 className="h-12 w-12 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">QuickBooks Certified</p>
              </div>
            </div>
            
            {/* Founder Story */}
            <Card className="authority-gradient border-primary/20">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <img 
                    src="/founder-photo.jpg" 
                    alt="Founder"
                    className="w-20 h-20 rounded-full"
                  />
                  <div className="text-left flex-1">
                    <p className="text-lg mb-2">
                      "After 15 years running a $12M electrical contracting business, I was drowning 
                      in email RFIs and Excel submittals. Procore was overkill. monday.com didn't 
                      understand construction. So we built what we needed."
                    </p>
                    <p className="font-semibold">— Mike Rodriguez, Founder & Former PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* RECIPROCITY - Free Resources (Principle 3) */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <Badge className="mb-4">Free Resources</Badge>
            <h2 className="text-4xl font-bold mb-4">
              Value Before You Pay a Cent
            </h2>
            <p className="text-xl text-muted-foreground">
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
              <Card key={resource.title} className="group hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        Free {resource.type}
                      </Badge>
                      <h3 className="font-semibold text-lg mb-2">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {resource.description}
                      </p>
                    </div>
                  </div>
                  <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                    <resource.icon className="mr-2 h-4 w-4" />
                    {resource.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SCARCITY - Limited Availability (Principle 4) */}
      <section className="py-12 bg-warning/10 dark:bg-warning/5 border-y border-warning/20">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-warning" />
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
              <Button className="scarcity-indicator">
                Claim Your Spot
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS - Social Proof (Principle 1) */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <Badge className="mb-4">Success Stories</Badge>
            <h2 className="text-4xl font-bold mb-4">
              Contractors Like You Are Saving Time & Money
            </h2>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* LIKING - Relatable Voice (Principle 6) */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              We Speak Construction, Not Tech
            </h2>
            <p className="text-xl text-muted-foreground">
              No more translating between software and jobsite
            </p>
          </div>
          
          <Tabs defaultValue="general" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="electrical">Electrical</TabsTrigger>
              <TabsTrigger value="hvac">HVAC</TabsTrigger>
              <TabsTrigger value="plumbing">Plumbing</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4">For General Contractors</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <span>Coordinate 12+ subs without email chaos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <span>AIA G702/G703 billing in one click</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <span>CSI MasterFormat organization built-in</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Add other trade tabs */}
          </Tabs>
        </div>
      </section>

      {/* PRICING - Clear Value */}
      <PricingSection />

      {/* FAQ - Objection Handling */}
      <FAQSection />

      {/* FINAL CTA - Commitment (Principle 5) */}
      <section className="py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Stop Losing Money to Inefficiency?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join 47 contractors who've already made the switch. 
              Setup takes 15 minutes. Your team will thank you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="cta-primary text-lg min-h-[64px] px-8">
                Start Your Free 14-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Wait! Before You Go...</CardTitle>
              <CardDescription>
                Get our free guide that's helped 200+ contractors save $50K per project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input 
                type="email" 
                placeholder="your@email.com"
                className="mb-4"
              />
              <Button className="w-full">
                Send Me The Free Guide
              </Button>
              <button 
                onClick={() => setShowExitIntent(false)}
                className="text-sm text-muted-foreground mt-4 w-full text-center hover:underline"
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