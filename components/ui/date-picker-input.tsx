"use client"

import * as React from "react"
import { format, parse } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

export interface DatePickerInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  name?: string
  id?: string
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = "Select date",
  className,
  disabled,
  name,
  id,
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false)

  // Convert string value to Date object
  const dateValue = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined

  const handleDateSelect = (date: Date | undefined) => {
    if (date && onChange) {
      onChange(format(date, 'yyyy-MM-dd'))
    } else if (!date && onChange) {
      onChange('')
    }
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value)
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        type="date"
        value={value || ''}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={cn("flex-1", className)}
        disabled={disabled}
        name={name}
        id={id}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            disabled={disabled}
            type="button"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
