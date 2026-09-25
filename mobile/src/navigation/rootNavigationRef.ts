import { createNavigationContainerRef } from '@react-navigation/native';

export const rootNavigationRef = createNavigationContainerRef();

export function navigateToCompetitions(filter?: 'all' | 'ongoing' | 'upcoming' | 'ended' | 'participated') {
  if (rootNavigationRef.isReady()) {
    rootNavigationRef.navigate(
      'MainTabs' as never,
      { screen: 'Competitions', params: filter ? { filter } : undefined } as never
    );
  }
}
