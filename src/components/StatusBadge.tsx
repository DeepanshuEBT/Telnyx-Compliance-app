import { GROUP_STATUS_LABELS } from '../api';
import type { RequirementGroupStatus } from '../types';

const TONE: Record<RequirementGroupStatus, string> = {
  unapproved: 'neutral',
  'pending-approval': 'warning',
  approved: 'success',
  declined: 'danger',
  expired: 'danger',
  'no-longer-eligible': 'danger',
};

export function StatusBadge({ status }: { status: RequirementGroupStatus }) {
  return (
    <span className={`badge badge--${TONE[status] ?? 'neutral'}`}>
      {GROUP_STATUS_LABELS[status] ?? status}
    </span>
  );
}
