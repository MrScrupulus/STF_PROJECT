/**
 * Injecte GOOGLE_MAPS_API_KEY pendant le prebuild EAS.
 * Fallback : clé Android de google-services.json (même projet Firebase).
 */
const fs = require('fs');
const path = require('path');
const { AndroidConfig } = require('expo/config-plugins');

function readMapsKeyFromGoogleServices() {
  try {
    const gsPath = path.join(__dirname, '..', 'google-services.json');
    if (!fs.existsSync(gsPath)) {
      return '';
    }
    const gs = JSON.parse(fs.readFileSync(gsPath, 'utf8'));
    return String(gs?.client?.[0]?.api_key?.[0]?.current_key || '').trim();
  } catch {
    return '';
  }
}

module.exports = function withGoogleMapsApiKey(config) {
  const apiKey = String(
    process.env.GOOGLE_MAPS_API_KEY ||
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
      readMapsKeyFromGoogleServices() ||
      ''
  ).trim();

  if (apiKey) {
    config.android = config.android || {};
    config.android.config = {
      ...(config.android.config || {}),
      googleMaps: { apiKey },
    };
    config.extra = {
      ...(config.extra || {}),
      googleMapsConfigured: true,
    };
  }

  return AndroidConfig.GoogleMapsApiKey.withGoogleMapsApiKey(config);
};
