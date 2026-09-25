import { rootNavigationRef } from '../navigation/rootNavigationRef';

type NotifData = {
  type?: string;
  teamId?: number | string;
  catchId?: number | string;
  competitionId?: number | string;
};

function toInt(value: number | string | undefined): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

export function navigateFromNotificationData(raw: NotifData | null | undefined): void {
  if (!raw || !rootNavigationRef.isReady()) return;
  const type = raw.type;
  const teamId = toInt(raw.teamId);
  const catchId = toInt(raw.catchId);
  const competitionId = toInt(raw.competitionId);

  if (type === 'team_invitation') {
    rootNavigationRef.navigate('Invitations' as never);
    return;
  }
  if (type === 'catch_pending') {
    if (catchId) {
      rootNavigationRef.navigate('AdminCatchValidation' as never, { catchId, action: 'view' } as never);
    } else {
      rootNavigationRef.navigate('AdminCatchValidation' as never);
    }
    return;
  }
  if ((type === 'catch_validated' || type === 'catch_rejected') && teamId) {
    rootNavigationRef.navigate(
      'TeamDetail' as never,
      { id: teamId, highlightCatchId: catchId ?? undefined } as never
    );
    return;
  }
  if (competitionId) {
    rootNavigationRef.navigate('CompetitionDetail' as never, { id: competitionId } as never);
  }
}
