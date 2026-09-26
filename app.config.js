module.exports = {
  expo: {
    name: 'Glendale Resource Finder',
    slug: 'glendale-resource-finder',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.glendaleresourcefinder.app',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Glendale Resource Finder uses your location to show nearby resources like shelters, restrooms, and food services on the map.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Glendale Resource Finder uses your location to show you nearby resources on the map.',
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#ffffff',
      },
      package: 'com.glendaleresourcefinder.app',
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    },
    newArchEnabled: true,
    plugins: [
      '@rnmapbox/maps',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Glendale Resource Finder uses your location to show you nearby resources like shelters, restrooms, water, and food services.',
          locationWhenInUsePermission:
            'Glendale Resource Finder uses your location to show resources near you on the map, such as shelters, restrooms, water fountains, and food services.',
        },
      ],
    ],
  },
};
