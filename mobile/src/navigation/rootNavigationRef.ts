import { createNavigationContainerRef } from '@react-navigation/native';

export const rootNavigationRef = createNavigationContainerRef();

export function navigateToCompetitions() {
  if (rootNavigationRef.isReady()) {
    rootNavigationRef.navigate('MainTabs' as never, { screen: 'Competitions' } as never);
  }
}
