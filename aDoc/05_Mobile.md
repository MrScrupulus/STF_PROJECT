# STF Project — Mobile (Expo / React Native)

## Tech & organisation
- Expo SDK `~54` (`mobile/package.json`)
- Écrans : `mobile/src/screens/*.tsx`
- Services API : `mobile/src/services/*.ts`
- Config API : `mobile/src/config/api.ts`
- Stockage sécurisé : `expo-secure-store`
- Réseau : axios + interceptors (`mobile/src/services/api.ts`)

## Auth côté mobile
- Login renvoie un `token` JWT (et potentiellement un `refresh_token`)
- Stockage :
  - `jwtToken` dans SecureStore
  - `refreshToken` dans SecureStore
- Intercepteur axios ajoute `Authorization: Bearer <jwtToken>` à chaque requête.
- Sur 401 : purge tokens (la redirection est gérée par le contexte d’auth).

## Écrans principaux (exemples)
- `HomeScreen.tsx`
- `CompetitionsScreen.tsx` + `CompetitionDetailScreen.tsx`
- `CatchesScreen.tsx` + `AddCatchScreen.tsx`
- `TeamsScreen.tsx` + `TeamDetailScreen.tsx`
- `HistoryScreen.tsx`
- `ProfileScreen.tsx` + `EditProfileScreen.tsx` + `ChangePasswordScreen.tsx`
- `InvitationsScreen.tsx`
- `NotificationsScreen.tsx` + `NotificationPreferencesScreen.tsx`
- Admin : `AdminDashboardScreen.tsx`, `AdminCatchValidationScreen.tsx`, `AdminAddCatchScreen.tsx`, `CreateCompetitionScreen.tsx`

## API base URL (important en dev)
Le baseURL est calculé dans `mobile/src/config/api.ts` :
- priorité à `EXPO_PUBLIC_API_URL` si défini
- sinon une URL “dev device” (ex : IP locale) est utilisée

⚠️ À adapter selon votre contexte (simulateur, émulateur, device physique).

## Logs (mobile)
- Utilitaire : `mobile/src/utils/logger.ts` (logs uniquement en dev).

