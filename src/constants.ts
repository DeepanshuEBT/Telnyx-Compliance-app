import type { PhoneNumberType, RequirementAction } from './types';

/**
 * Countries Boxly already sells numbers in, kept first for convenience. The
 * country field is a free-text ISO code so the list is a shortcut, not a limit.
 */
export const COMMON_COUNTRIES: { code: string; name: string }[] = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'AU', name: 'Australia' },
  { code: 'SE', name: 'Sweden' },
  { code: 'US', name: 'United States' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'ES', name: 'Spain' },
];

export const PHONE_NUMBER_TYPES: { value: PhoneNumberType; label: string }[] = [
  { value: 'local', label: 'Local' },
  { value: 'national', label: 'National' },
  { value: 'toll_free', label: 'Toll free' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'shared_cost', label: 'Shared cost' },
];

export const ACTIONS: { value: RequirementAction; label: string }[] = [
  { value: 'ordering', label: 'Ordering' },
  { value: 'porting', label: 'Porting' },
];

export const NUMBER_FEATURES: { value: string; label: string }[] = [
  { value: 'sms', label: 'SMS' },
  { value: 'mms', label: 'MMS' },
  { value: 'voice', label: 'Voice' },
  { value: 'fax', label: 'Fax' },
];

/** Telnyx takes one location filter at a time, so the UI picks which. */
export const SEARCH_BY: { value: string; label: string; placeholder: string }[] = [
  { value: 'national_destination_code', label: 'Area code', placeholder: 'e.g. 212' },
  { value: 'locality', label: 'City', placeholder: 'e.g. Chicago' },
  { value: 'administrative_area', label: 'State or region', placeholder: 'e.g. IL' },
  { value: 'rate_center', label: 'Rate center', placeholder: 'e.g. CHICAGO' },
];

export const NUMBER_MATCH_TYPES: { value: string; label: string }[] = [
  { value: 'starts_with', label: 'Starts with' },
  { value: 'contains', label: 'Contains' },
  { value: 'ends_with', label: 'Ends with' },
];
