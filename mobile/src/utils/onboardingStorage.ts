import { getSecureItem, setSecureItem } from './secureStore';

const ONBOARDING_KEY = 'stf_onboarding_v1';

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await getSecureItem(ONBOARDING_KEY);
  return value === '1';
}

export async function markOnboardingComplete(): Promise<void> {
  await setSecureItem(ONBOARDING_KEY, '1');
}
