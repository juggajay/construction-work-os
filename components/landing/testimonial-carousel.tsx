'use client'

import { memo, useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Star, Building2 } from 'lucide-react'

interface Testimonial {
  id: number
  name: string
  title: string
  company: string
  projectSize: string
  quote: string
  metric: string
  avatar?: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Martinez",
    title: "Project Manager",
    company: "Martinez Construction LLC",
    projectSize: "$18M Commercial Build",
    quote: "We cut RFI response time from 12 days to 2 days. The ball-in-court tracking eliminated all the &apos;whose turn is it?&apos; confusion. Our architects actually thanked us for switching.",
    metric: "83% faster RFI responses",
  },
  {
    id: 2,
    name: "James Chen",
    title: "Electrical Contractor",
    company: "Chen Electric & Controls",
    projectSize: "$8M Healthcare Facility",
    quote: "Finally, a tool that understands submittal workflows. The offline mode saved us on a remote hospital project with spotty service. Worth every penny at $299/month.",
    metric: "Saved 4 hours per week",
  },
  {
    id: 3,
    name: "Mike Thompson",
    title: "General Contractor",
    company: "Thompson Brothers Construction",
    projectSize: "$22M Multi-family Development",
    quote: "Switched from Procore and cut our software costs by 70%. The unlimited user model means our whole field team can actually use it. Game changer for collaboration.",
    metric: "$8,400 annual savings",
  },
  {
    id: 4,
    name: "Lisa Rodriguez",
    title: "Superintendent",
    company: "Alpine Builders",
    projectSize: "$15M Office Renovation",
    quote: "The 56px buttons work perfectly with gloves. I can log daily reports from the field without taking them off. Little details like this show they actually understand construction.",
    metric: "95% field adoption rate",
  },
  {
    id: 5,
    name: "David Park",
    title: "Owner",
    company: "Park HVAC Services",
    projectSize: "$5M Educational Campus",
    quote: "Setup took 20 minutes, not 20 weeks. We imported our project, invited the team, and were tracking submittals same day. No consultants, no training sessions, just works.",
    metric: "20-minute setup time",
  },
]

function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToPrevious = useCallback(() => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  const goToNext = useCallback(() => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }, [])

  const currentTestimonial = testimonials[currentIndex] ?? testimonials[0]

  if (!currentTestimonial) {
    return null
  }

  return (
    <div className="relative max-w-4xl mx-auto">
      <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/30">
        <CardContent className="p-8 md:p-12">
          {/* Star Rating */}
          <div className="flex gap-1 mb-6 justify-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="h-5 w-5 fill-yellow-500 text-yellow-500"
                aria-hidden="true"
              />
            ))}
          </div>

          {/* Quote */}
          <blockquote className="text-lg md:text-xl text-center mb-8 leading-relaxed">
            &quot;{currentTestimonial.quote}&quot;
          </blockquote>

          {/* Metric Badge */}
          <div className="flex justify-center mb-6">
            <Badge className="bg-success/10 text-success border-success/20 px-4 py-2 text-sm font-semibold">
              {currentTestimonial.metric}
            </Badge>
          </div>

          {/* Author Info */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <div className="flex h-full w-full items-center justify-center bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </Avatar>
            <div className="text-center">
              <p className="font-semibold text-lg">{currentTestimonial.name}</p>
              <p className="text-sm text-muted-foreground">
                {currentTestimonial.title}, {currentTestimonial.company}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentTestimonial.projectSize}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevious}
          className="h-12 w-12 rounded-full"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Dots */}
        <div className="flex gap-2" role="tablist" aria-label="Testimonial navigation">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setIsAutoPlaying(false)
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
              role="tab"
              aria-selected={index === currentIndex}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNext}
          className="h-12 w-12 rounded-full"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

// Memoize to prevent unnecessary re-renders and optimize carousel performance
export default memo(TestimonialCarousel)
