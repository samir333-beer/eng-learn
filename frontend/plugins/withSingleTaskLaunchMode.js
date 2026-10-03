const { withAndroidManifest } = require('@expo/config-plugins');
function withSingleTaskLaunchMode(config) {
return withAndroidManifest(config, (config) => {
const mainApplication = config.modResults.manifest.application[0];
const mainActivity = mainApplication.activity.find(
(activity) => activity.$['android:name'] === '.MainActivity'
);
if (mainActivity) {
mainActivity.$['android:launchMode'] = 'singleTask';
}
return config;
});
}
module.exports = withSingleTaskLaunchMode;