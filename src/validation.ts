import type { AcceptanceCriteria, RequirementType } from './types';

/**
 * Telnyx publishes acceptance criteria per requirement, so we can reject a bad
 * value here rather than spending a review cycle finding out. Returns an error
 * message, or null when the value is acceptable.
 */
export function validateRequirementValue(
  requirementType: RequirementType,
  value: string,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'This is required.';

  const criteria = requirementType.acceptance_criteria;
  if (!criteria) return null;

  if (criteria.acceptable_values?.length) {
    // Telnyx flags some lists as case insensitive, so "Company" should pass a
    // list of ["individual", "company"].
    const caseSensitive = criteria.case_sensitive !== false;
    const matches = criteria.acceptable_values.some((option) =>
      caseSensitive
        ? option === trimmed
        : option.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!matches) {
      return `Must be one of: ${criteria.acceptable_values.join(', ')}.`;
    }
  }

  if (criteria.regex && !matchesPattern(trimmed, criteria.regex, criteria.case_sensitive)) {
    return 'This is not in the format Telnyx expects.';
  }

  if (criteria.min_length != null && trimmed.length < criteria.min_length) {
    return `Must be at least ${criteria.min_length} characters.`;
  }

  if (criteria.max_length != null && trimmed.length > criteria.max_length) {
    return `Must be ${criteria.max_length} characters or fewer.`;
  }

  const offending = findDisallowedCharacters(trimmed, criteria.acceptable_characters);
  if (offending) {
    return `Cannot contain ${offending}. Allowed: ${criteria.acceptable_characters}.`;
  }

  return null;
}

function matchesPattern(
  value: string,
  regex: string,
  caseSensitive?: boolean | null,
): boolean {
  try {
    return new RegExp(regex, caseSensitive === false ? 'i' : '').test(value);
  } catch {
    // A pattern we cannot compile is not a reason to block the customer.
    return true;
  }
}

function findDisallowedCharacters(
  value: string,
  acceptableCharacters?: string | null,
): string | null {
  if (!acceptableCharacters) return null;

  let pattern: RegExp;
  try {
    pattern = new RegExp(`[^${acceptableCharacters}]`, 'g');
  } catch {
    // Telnyx sends this as a human-readable hint in some locales, so a value we
    // cannot compile is not a reason to block the customer.
    return null;
  }

  const matches = Array.from(new Set(value.match(pattern) ?? []));
  if (!matches.length) return null;
  return matches.map((character) => `"${character}"`).join(', ');
}

export function describeCriteria(criteria?: AcceptanceCriteria): string[] {
  if (!criteria) return [];

  const described: string[] = [];
  if (criteria.time_limit) described.push(`Dated within ${criteria.time_limit}`);
  if (criteria.locality_limit) described.push(`Must be in ${criteria.locality_limit}`);
  if (criteria.min_length != null) described.push(`Min ${criteria.min_length} chars`);
  if (criteria.max_length != null) described.push(`Max ${criteria.max_length} chars`);
  if (criteria.acceptable_values?.length) {
    described.push(`One of: ${criteria.acceptable_values.join(', ')}`);
  }
  if (criteria.regex) described.push('Must match a set format');
  return described;
}
