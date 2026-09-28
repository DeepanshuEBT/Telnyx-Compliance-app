import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api';
import type { RequirementType } from '../types';
import { describeCriteria } from '../validation';
import { AddressField } from './AddressField';

interface Props {
  requirementType: RequirementType;
  value: string;
  error: string | null;
  disabled: boolean;
  countryCode: string;
  /** Telnyx reviews each requirement separately, not just the group. */
  reviewStatus?: string | null;
  onChange: (value: string) => void;
}

export function RequirementField({
  requirementType,
  value,
  error,
  disabled,
  countryCode,
  reviewStatus,
  onChange,
}: Props) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);

  const uploadDocument = useMutation({
    mutationFn: (file: File) => api.uploadDocument(file),
    onSuccess: (response, file) => {
      onChange(response.data.id);
      setUploadedName(file.name);
    },
    onError: (err) => setUploadError((err as Error).message),
  });

  const uploading = uploadDocument.isPending;

  const criteria = requirementType.acceptance_criteria;
  const acceptableValues = criteria?.acceptable_values ?? [];

  function handleFile(file: File) {
    setUploadError(null);
    uploadDocument.mutate(file);
  }

  const declined = reviewStatus === 'declined';

  return (
    <div className={`req ${declined ? 'req--declined' : ''}`}>
      <div className="req__head">
        <span className="req__name">{requirementType.name}</span>
        <span className="type-pill">{requirementType.type}</span>
        {reviewStatus && <ReviewBadge status={reviewStatus} />}
      </div>

      {declined && (
        <p className="req__declined">
          Telnyx did not accept this one. Replace it and submit again.
        </p>
      )}

      {requirementType.description && (
        <p className="req__desc">{requirementType.description}</p>
      )}
      {requirementType.example && (
        <p className="req__example">For example: {requirementType.example}</p>
      )}

      <div className="req__criteria">
        {describeCriteria(criteria).map((line) => (
          <span className="criterion" key={line}>{line}</span>
        ))}
      </div>

      <div className="req__control">
        {requirementType.type === 'document' ? (
          <div className="file-row">
            <input
              type="file"
              disabled={disabled || uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {uploading && <span className="hint">Uploading…</span>}
            {!uploading && value && (
              <span className="badge badge--success">
                {uploadedName ? `${uploadedName} uploaded` : 'Document attached'}
              </span>
            )}
          </div>
        ) : requirementType.type === 'address' ? (
          <AddressField
            value={value}
            disabled={disabled}
            defaultCountryCode={countryCode}
            onChange={onChange}
          />
        ) : acceptableValues.length > 0 ? (
          <select
            className={`select ${error ? 'input--invalid' : ''}`}
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
          >
            <option value="">Select…</option>
            {acceptableValues.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            className={`input field--grow ${error ? 'input--invalid' : ''}`}
            value={value}
            disabled={disabled}
            placeholder={requirementType.example ?? ''}
            onChange={(event) => onChange(event.target.value)}
          />
        )}

        {value && requirementType.type === 'document' && (
          <span className="hint mono">Document ID: {value}</span>
        )}

        {uploadError && <span className="req__error">{uploadError}</span>}
        {error && <span className="req__error">{error}</span>}
      </div>
    </div>
  );
}

const REVIEW_TONE: Record<string, string> = {
  approved: 'success',
  declined: 'danger',
  'pending-approval': 'warning',
  unapproved: 'neutral',
};

const REVIEW_LABEL: Record<string, string> = {
  approved: 'Accepted',
  declined: 'Not accepted',
  'pending-approval': 'In review',
  unapproved: 'Not submitted',
};

function ReviewBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge--${REVIEW_TONE[status] ?? 'neutral'}`}>
      {REVIEW_LABEL[status] ?? status}
    </span>
  );
}
