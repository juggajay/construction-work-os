'use client'

import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, ArrowRight, Zap } from 'lucide-react'

interface PricingTier {
  name: string
  price: string
  description: string
  features: string[]
  cta: string
  popular?: boolean
  comparison?: string
}

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    price: "$199",
    description: "Perfect for small contractors testing the waters",
    features: [
      "1 active project",
      "Unlimited team members",
      "RFI & Submittal tracking",
      "Basic daily reports",
      "Mobile app access",
      "Email support",
      "14-day free trial",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Professional",
    price: "$299",
    description: "Most popular for mid-market contractors",
    features: [
      "3 active projects",
      "Unlimited team members",
      "Full RFI, Submittal & Change Order workflows",
      "Advanced daily reports with photos",
      "Offline-first mobile app",
      "QuickBooks Integration",
      "Priority support (2-hour SLA)",
      "Custom CSI MasterFormat setup",
      "Supports AIA Document Formats",
      "SOC 2 Type II security",
    ],
    cta: "Start Free Trial",
    popular: true,
    comparison: "70% cheaper than Procore",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large GCs managing $50M+ portfolios",
    features: [
      "Unlimited projects",
      "Unlimited team members",
      "Everything in Professional, plus:",
      "White-label branding",
      "Custom integrations (API access)",
      "Dedicated account manager",
      "Custom training & onboarding",
      "SLA guarantees (99.9% uptime)",
      "Single sign-on (SSO)",
      "Advanced analytics & reporting",
    ],
    cta: "Contact Sales",
  },
]

function PricingSection() {
  return (
    <section className="py-24 bg-background" id="pricing">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <Badge className="mb-4">Transparent Pricing</Badge>
          <h2 className="text-4xl font-bold mb-4">
            No Per-Seat Pricing. No Hidden Fees.
          </h2>
          <p className="text-xl text-muted-foreground">
            Pay per project, invite unlimited users. Simple pricing that scales with your business.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative ${
                tier.popular
                  ? 'border-primary shadow-xl scale-105 md:scale-110'
                  : 'border-border'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    <Zap className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                <CardDescription className="mb-4">{tier.description}</CardDescription>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold">{tier.price}</span>
                  {tier.price !== "Custom" && (
                    <span className="text-muted-foreground">/project/month</span>
                  )}
                </div>
                {tier.comparison && (
                  <Badge variant="secondary" className="mt-3 bg-success/10 text-success border-success/20">
                    {tier.comparison}
                  </Badge>
                )}
              </CardHeader>

              <CardContent>
                <Button
                  className={`w-full mb-6 min-h-[56px] text-lg ${
                    tier.popular ? 'bg-primary hover:bg-primary/90' : ''
                  }`}
                  variant={tier.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  {tier.cta}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <ul className="space-y-3" role="list">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Money-back guarantee */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-6">
              <p className="text-lg font-semibold mb-2">30-Day Money-Back Guarantee</p>
              <p className="text-sm text-muted-foreground">
                Not saving time? Get a full refund, no questions asked. We&apos;re that confident you&apos;ll love it.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

// Memoize to prevent unnecessary re-renders (static content)
export default memo(PricingSection)
