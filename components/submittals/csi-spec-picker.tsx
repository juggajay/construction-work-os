'use client';

/**
 * CSI Spec Section Picker Component
 * Searchable picker for CSI MasterFormat spec sections
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';

interface CSISpecPickerProps {
  value: string;
  onValueChange: (value: string, title?: string) => void;
  sections?: Array<{ section_code: string; section_title: string }>;
}

// Common CSI sections - in production, fetch from database
const defaultSections = [
  { section_code: '03 30 00', section_title: 'Cast-in-Place Concrete' },
  { section_code: '03 20 00', section_title: 'Concrete Reinforcing' },
  { section_code: '05 50 00', section_title: 'Metal Fabrications' },
  { section_code: '09 90 00', section_title: 'Painting and Coating' },
  { section_code: '23 00 00', section_title: 'Heating, Ventilating, and Air Conditioning' },
  { section_code: '26 00 00', section_title: 'Electrical' },
  { section_code: '31 23 00', section_title: 'Excavation and Fill' },
];

export function CSISpecPicker({ value, onValueChange, sections = defaultSections }: CSISpecPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedSection = sections.find((s) => s.section_code === value);

  return (
    <div className="space-y-2">
      <Label>CSI Spec Section</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedSection ? (
              <span>
                <span className="font-mono">{selectedSection.section_code}</span> -{' '}
                {selectedSection.section_title}
              </span>
            ) : (
              'Select spec section...'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search sections..." />
            <CommandList>
              <CommandEmpty>No section found.</CommandEmpty>
              <CommandGroup>
                {sections.map((section) => (
                  <CommandItem
                    key={section.section_code}
                    value={`${section.section_code} ${section.section_title}`}
                    onSelect={() => {
                      onValueChange(section.section_code, section.section_title);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value === section.section_code ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <span className="font-mono mr-2">{section.section_code}</span>
                    <span className="text-sm">{section.section_title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Fallback: Manual input if picker not used */}
      <Input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Or enter manually: 03 30 00"
        pattern="[0-9]{2}\s[0-9]{2}\s[0-9]{2}"
        className="font-mono"
      />
    </div>
  );
}
