const { withAppDelegate, withSettingsGradle, withAppBuildGradle, withMainApplication } = require('@expo/config-plugins');

const withYandexMaps = (config) => {
  const apiKey = config.extra?.mapKitApiKey || '24ebf5ac-ba8e-47a7-b146-603f38894d2d';

  // iOS Configuration
  config = withAppDelegate(config, (config) => {
    let appDelegate = config.modResults.contents;

    // Add import if not present
    if (!appDelegate.includes('#import <YandexMapsMobile/YMKMapKitFactory.h>')) {
      appDelegate = appDelegate.replace(
        /#import "AppDelegate.h"/g,
        '#import "AppDelegate.h"\n#import <YandexMapsMobile/YMKMapKitFactory.h>'
      );
    }

    // Add initialization to didFinishLaunchingWithOptions
    const mapKitInit = `
  [YMKMapKit setApiKey:@"${apiKey}"];
  [YMKMapKit setLocale:@"ru_RU"];
  [YMKMapKit mapKit];
`;

    if (!appDelegate.includes('[YMKMapKit setApiKey:')) {
      appDelegate = appDelegate.replace(
        /return \[super application:application didFinishLaunchingWithOptions:launchOptions\];/g,
        `${mapKitInit}\n  return [super application:application didFinishLaunchingWithOptions:launchOptions];`
      );
    }

    config.modResults.contents = appDelegate;
    return config;
  });

  // Android Configuration
  config = withMainApplication(config, (config) => {
    let mainApplication = config.modResults.contents;

    // Add import
    if (!mainApplication.includes('import com.yandex.mapkit.MapKitFactory;')) {
      mainApplication = mainApplication.replace(
        /package .*/,
        (match) => `${match}\n\nimport com.yandex.mapkit.MapKitFactory;`
      );
    }

    // Add initialization to onCreate
    if (!mainApplication.includes('MapKitFactory.setApiKey(')) {
      mainApplication = mainApplication.replace(
        /super\.onCreate\(\);/,
        `super.onCreate();\n    MapKitFactory.setApiKey("${apiKey}");`
      );
    }

    config.modResults.contents = mainApplication;
    return config;
  });

  return config;
};

module.exports = withYandexMaps;
