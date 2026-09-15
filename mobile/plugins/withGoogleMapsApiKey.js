/**
 * Injecte GOOGLE_MAPS_API_KEY pendant le prebuild EAS.
 * Les variables « secret » ne sont pas lues par app.config.js en local,
 * mais elles sont disponibles sur le builder au moment des plugins.
 */
const { AndroidConfig } = require('expo/config-plugins');

module.exports = function withGoogleMapsApiKey(config) {
  const apiKey = String(
    process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''
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
