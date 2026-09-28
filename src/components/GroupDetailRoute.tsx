import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { GroupDetail } from './GroupDetail';

/**
 * Carries the group id in from the URL, and the "we reopened your existing
 * group" notice in from the navigation that created it.
 */
export function GroupDetailRoute() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = (location.state as { notice?: string } | null)?.notice ?? null;

  if (!groupId) return null;

  return (
    <div className="stack">
      {notice && <div className="banner banner--info">{notice}</div>}
      <GroupDetail groupId={groupId} onBack={() => navigate('/groups')} />
    </div>
  );
}
