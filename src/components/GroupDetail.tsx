import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { Requirement, RequirementGroup, RequirementType } from '../types';
import { validateRequirementValue } from '../validation';
import { RequirementField } from './RequirementField';
import { StatusBadge } from './StatusBadge';

interface Props {
  groupId: string;
  onBack: () => void;
}

const EDITABLE_STATUSES = new Set(['unapproved', 'declined']);

export function GroupDetail({ groupId, onBack }: Props) {
  const [group, setGroup] = useState<RequirementGroup | null>(null);
  const [requirementTypes, setRequirementTypes] = useState<RequirementType[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const groupResponse = await api.getGroup(groupId);
      const loadedGroup = groupResponse.data;
      setGroup(loadedGroup);

      // The group stores values against requirement ids but not what those ids
      // mean, so the labels, help text and validation rules come from the
      // requirements published for this country and number type.
      const requirementsResponse = await api.listRequirements({
        country_code: loadedGroup.country_code,
        phone_number_type: loadedGroup.phone_number_type,
        action: loadedGroup.action,
      });
      setRequirementTypes(collectRequirementTypes(requirementsResponse.data));

      const existing: Record<string, string> = {};
      (loadedGroup.regulatory_requirements ?? []).forEach((requirement) => {
        if (requirement.field_value) {
          existing[requirement.requirement_id] = requirement.field_value;
        }
      });
      setValues(existing);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  const editable = group ? EDITABLE_STATUSES.has(group.status) : false;

  const reviewStatuses = useMemo(() => {
    const map: Record<string, string> = {};
    (group?.regulatory_requirements ?? []).forEach((requirement) => {
      if (requirement.status) map[requirement.requirement_id] = requirement.status;
    });
    return map;
  }, [group]);

  const declinedCount = useMemo(
    () => Object.values(reviewStatuses).filter((status) => status === 'declined').length,
    [reviewStatuses],
  );

  const filledCount = useMemo(
    () => requirementTypes.filter((type) => (values[type.id] ?? '').trim()).length,
    [requirementTypes, values],
  );

  function validateAll(): boolean {
    const nextErrors: Record<string, string> = {};
    requirementTypes.forEach((type) => {
      const message = validateRequirementValue(type, values[type.id] ?? '');
      if (message) nextErrors[type.id] = message;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildPayload() {
    return requirementTypes
      .filter((type) => (values[type.id] ?? '').trim())
      .map((type) => ({
        requirement_id: type.id,
        field_value: values[type.id].trim(),
      }));
  }

  async function handleSave() {
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const response = await api.updateGroup(groupId, buildPayload());
      setGroup(response.data);
      setNotice('Saved. You can come back and finish this later.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!validateAll()) {
      setError('Some answers still need fixing before this can be submitted.');
      return;
    }
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      await api.updateGroup(groupId, buildPayload());
      const response = await api.submitGroup(groupId);
      setGroup(response.data);
      setNotice('Submitted. Telnyx will review it and the status here will update.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="card"><div className="state">Loading…</div></div>;
  }

  if (!group) {
    return (
      <div className="stack">
        <button className="breadcrumb" onClick={onBack}>← Back to requirement groups</button>
        <div className="banner banner--danger">{error ?? 'Requirement group not found.'}</div>
      </div>
    );
  }

  return (
    <div className="stack">
      <button className="breadcrumb" onClick={onBack}>← Back to requirement groups</button>

      <div className="card">
        <div className="card__header">
          <div>
            <div className="card__title">
              {group.country_code} · {group.phone_number_type} · {group.action}
            </div>
            <div className="hint mono">{group.id}</div>
          </div>
          <div className="spacer" />
          <StatusBadge status={group.status} />
        </div>

        <div className="card__body">
          {group.status === 'declined' && (
            <div className="banner banner--danger">
              {declinedCount > 0
                ? `Telnyx did not accept ${declinedCount} of ${requirementTypes.length} items. They are marked below. Fix those and submit again.`
                : 'Telnyx declined this submission. Correct the answers below and submit again.'}
            </div>
          )}
          {group.status === 'pending-approval' && (
            <div className="banner banner--warning">
              In review with Telnyx. Nothing to do until they come back.
            </div>
          )}
          {group.status === 'approved' && (
            <div className="banner banner--success">
              Approved. We can order the number against this group.
            </div>
          )}
          {notice && <div className="banner banner--info">{notice}</div>}
          {error && <div className="banner banner--danger">{error}</div>}

          {requirementTypes.length === 0 ? (
            <div className="state">
              <div className="state__title">No requirements published</div>
              <div>Telnyx lists nothing for this country and number type.</div>
            </div>
          ) : (
            <div className="req-list">
              {requirementTypes.map((requirementType) => (
                <RequirementField
                  key={requirementType.id}
                  requirementType={requirementType}
                  value={values[requirementType.id] ?? ''}
                  error={errors[requirementType.id] ?? null}
                  disabled={!editable || saving}
                  countryCode={group.country_code}
                  reviewStatus={reviewStatuses[requirementType.id]}
                  onChange={(value) => {
                    setValues((current) => ({ ...current, [requirementType.id]: value }));
                    setErrors((current) => {
                      const next = { ...current };
                      delete next[requirementType.id];
                      return next;
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {editable && requirementTypes.length > 0 && (
          <div className="sticky-actions">
            <span className="hint">
              {filledCount} of {requirementTypes.length} answered
            </span>
            <div className="spacer" />
            <button className="btn btn--ghost" onClick={handleSave} disabled={saving}>
              Save progress
            </button>
            <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Working…' : 'Submit for approval'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function collectRequirementTypes(requirements: Requirement[]): RequirementType[] {
  const byId = new Map<string, RequirementType>();
  requirements.forEach((requirement) => {
    (requirement.requirement_types ?? []).forEach((requirementType) => {
      byId.set(requirementType.id, requirementType);
    });
  });
  return Array.from(byId.values());
}
