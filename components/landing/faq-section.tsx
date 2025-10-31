'use client'

import { memo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: "How long does setup actually take?",
    answer: "Seriously, 15-20 minutes. Create your account, import your project details, invite your team via email, and you&apos;re tracking RFIs same day. No consultants, no training sessions. If you can use email, you can use Construction Work OS.",
  },
  {
    question: "Does offline mode really work, or is it just marketing?",
    answer: "It actually works. We built it for field superintendents in rural areas and basement mechanical rooms. Log daily reports, update RFI status, take photos - all without cell service. Everything syncs automatically when you reconnect. We use the same tech as Google Docs offline mode.",
  },
  {
    question: "What if my team isn&apos;t tech-savvy?",
    answer: "That&apos;s why we built 56px glove-friendly buttons and a dead-simple interface. If they can text, they can use this. Plus, unlimited users means everyone can practice without per-seat costs. Our field adoption rate is 95% - higher than any competitor.",
  },
  {
    question: "How is this different from Procore or PlanGrid?",
    answer: "Three ways: (1) We&apos;re 70% cheaper with no per-seat pricing, (2) We&apos;re built BY contractors, not software people trying to understand construction, (3) Offline-first mobile instead of web-app-in-a-wrapper. We&apos;re the tool we wished existed when we ran our $12M electrical contracting business.",
  },
  {
    question: "Can I integrate with QuickBooks for billing?",
    answer: "Yes. We support QuickBooks Online and Desktop. Export AIA G702/G703 payment applications directly to QuickBooks with one click. No double data entry, no CSV imports, just works.",
  },
  {
    question: "What about data security? Our projects are confidential.",
    answer: "We&apos;re SOC 2 Type II certified (same as Fortune 500 companies). Data encrypted in transit and at rest. Daily backups with 30-day retention. Role-based access controls so your subs only see their scope. We take security as seriously as you do.",
  },
  {
    question: "Do you support AIA document formats?",
    answer: "Yes, we support AIA Document Formats including G702/G703 payment applications, and our workflows align with standard AIA contract administration practices. We&apos;re not officially AIA-certified (they don&apos;t certify software), but we follow their formats exactly.",
  },
  {
    question: "What if we need to cancel?",
    answer: "Cancel anytime, no contracts, no penalties. We bill month-to-month per active project. Pause a project and you&apos;re not charged. Your data stays accessible for 90 days after cancellation. We also offer a 30-day money-back guarantee if you&apos;re not saving time.",
  },
  {
    question: "Can we import our existing project data?",
    answer: "Yes. We support CSV imports for RFIs, submittals, and contacts. Our team can also help with bulk data migration from Procore, PlanGrid, or Excel at no extra charge. Usually takes 1-2 days, not weeks.",
  },
  {
    question: "Is there a free trial? Do I need a credit card?",
    answer: "14-day free trial, no credit card required, full feature access. Invite your whole team, test offline mode, try the mobile app. If you&apos;re not convinced after 14 days, no hard feelings. We&apos;re betting you&apos;ll love it.",
  },
]

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-24 bg-muted/30" id="faq">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <Badge className="mb-4">FAQ</Badge>
          <h2 className="text-4xl font-bold mb-4">
            Questions We Get From Contractors Like You
          </h2>
          <p className="text-xl text-muted-foreground">
            Straight answers, no sales BS
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="border-border">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left p-6 flex items-start justify-between gap-4 hover:bg-muted/50 transition-colors"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="font-semibold text-lg pr-8">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform mt-1",
                    openIndex === index && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
              {openIndex === index && (
                <CardContent
                  id={`faq-answer-${index}`}
                  className="px-6 pb-6 pt-0"
                  role="region"
                >
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Still have questions */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <p className="text-lg font-semibold mb-3">Still have questions?</p>
              <p className="text-muted-foreground mb-6">
                Talk to someone who&apos;s actually run projects, not a sales rep reading a script.
              </p>
              <button className="text-primary hover:underline font-semibold">
                Schedule a 15-minute call →
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

// Memoize to prevent unnecessary re-renders (FAQ content only changes on user interaction)
export default memo(FAQSection)
