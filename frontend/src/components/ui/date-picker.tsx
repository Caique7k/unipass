"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  value?: string
  onChange: (value: string) => void
  min?: string
  max?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

function parseDateValue(value?: string) {
  if (!value) {
    return undefined
  }

  const [year, month, day] = value.split("-").map(Number)

  if (!year || !month || !day) {
    return undefined
  }

  return new Date(year, month - 1, day)
}

function formatDateValue(value: Date) {
  return format(value, "yyyy-MM-dd")
}

function getDayTimestamp(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate()
  ).getTime()
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Selecione uma data",
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const selectedDate = useMemo(() => parseDateValue(value), [value])
  const minDate = useMemo(() => parseDateValue(min), [min])
  const maxDate = useMemo(() => parseDateValue(max), [max])

  function isDateDisabled(date: Date) {
    const timestamp = getDayTimestamp(date)

    if (minDate && timestamp < getDayTimestamp(minDate)) {
      return true
    }

    if (maxDate && timestamp > getDayTimestamp(maxDate)) {
      return true
    }

    return false
  }

  function handleSelect(date?: Date) {
    if (!date || isDateDisabled(date)) {
      return
    }

    onChange(formatDateValue(date))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-11 w-full justify-start rounded-2xl px-3 text-left font-normal",
              !selectedDate && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          <CalendarIcon className="size-4 shrink-0" />
          <span className="truncate">
            {selectedDate
              ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
              : placeholder}
          </span>
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto overflow-hidden rounded-2xl p-0"
      >
        <Calendar
          mode="single"
          locale={ptBR}
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={isDateDisabled}
          defaultMonth={selectedDate ?? maxDate ?? minDate ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  )
}
