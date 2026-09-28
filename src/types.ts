export type PhoneNumberType =
  'local' | 'national' | 'toll_free' | 'mobile' | 'shared_cost';

export type RequirementAction = 'ordering' | 'porting' | 'branded_calling';

export type RequirementFieldType = 'document' | 'address' | 'textual';

export type RequirementGroupStatus =
  | 'unapproved'
  | 'pending-approval'
  | 'approved'
  | 'declined'
  | 'expired'
  | 'no-longer-eligible';

export interface AcceptanceCriteria {
  time_limit?: string | null;
  locality_limit?: string | null;
  acceptable_values?: string[] | null;
  min_length?: number | null;
  max_length?: number | null;
  acceptable_characters?: string | null;
  regex?: string | null;
  case_sensitive?: boolean | null;
}

export interface RequirementType {
  id: string;
  name: string;
  type: RequirementFieldType;
  description?: string;
  example?: string;
  acceptance_criteria?: AcceptanceCriteria;
}

export interface Requirement {
  id: string;
  country_code: string;
  locality?: string;
  phone_number_type: PhoneNumberType;
  action: RequirementAction;
  requirement_types?: RequirementType[];
  created_at?: string;
  updated_at?: string;
}

export interface RegulatoryRequirementValue {
  requirement_id: string;
  field_value?: string;
  field_type?: RequirementFieldType;
  status?: string;
}

export interface RequirementGroup {
  id: string;
  country_code: string;
  phone_number_type: PhoneNumberType;
  action: RequirementAction;
  status: RequirementGroupStatus;
  customer_reference?: string;
  regulatory_requirements?: RegulatoryRequirementValue[];
  created_at?: string;
  updated_at?: string;
}

export interface TelnyxDocument {
  id: string;
  filename?: string;
  status?: string;
}

export interface PageMeta {
  total_pages?: number;
  total_results?: number;
  page_number?: number;
  page_size?: number;
}

export interface TelnyxAddress {
  id: string;
  country_code?: string;
  street_address?: string;
  extended_address?: string;
  locality?: string;
  administrative_area?: string;
  postal_code?: string;
  business_name?: string;
  first_name?: string;
  last_name?: string;
}

export interface AddressPayload {
  country_code: string;
  street_address: string;
  locality: string;
  postal_code: string;
  administrative_area?: string;
  extended_address?: string;
  business_name?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

export type NumberFeature = 'sms' | 'mms' | 'voice' | 'fax' | 'emergency';

export interface AvailableNumber {
  phone_number: string;
  phone_number_type: PhoneNumberType;
  quickship?: boolean;
  reservable?: boolean;
  best_effort?: boolean;
  features?: { name: string }[];
  cost_information?: {
    monthly_cost?: string;
    upfront_cost?: string;
    currency?: string;
  };
  region_information?: { region_name?: string; region_type?: string }[];
}

export interface PhoneNumber {
  id: string;
  phone_number: string;
  status?: string;
  phone_number_type?: PhoneNumberType;
  country_iso_alpha2?: string;
  connection_name?: string;
  messaging_profile_name?: string;
  customer_reference?: string;
  tags?: string[];
  purchased_at?: string;
  /** Boxly's own view of the number, merged in by the proxy. */
  boxly?: {
    known: boolean;
    verification_status: string | null;
    verified: boolean;
    cca_code: string | null;
    connected: boolean;
    plan_name: string | null;
    sms_count: number | null;
  };
}

export interface SmsPlanTier {
  name: string;
  sms_count: number;
  price_per_month: string;
  price_per_sms: string;
}

export interface ConnectedSmsChannel {
  phone_number: string;
  plan_name: string;
  sms_count: number;
  connected_channel_id: string;
}

export interface SmsPlanCatalogue {
  currency: string;
  currency_symbol: string;
  plans: SmsPlanTier[];
}

export interface NumberOrder {
  id: string;
  status?: string;
  phone_numbers_count?: number;
  customer_reference?: string;
  requirements_met?: boolean;
  created_at?: string;
  phone_numbers?: {
    phone_number?: string;
    status?: string;
    requirements_status?: string;
    requirement_group_id?: string;
  }[];
}
