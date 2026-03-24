/* eslint-disable */
const path = require('path');

module.exports = {
  assets: ['./src/assets/fonts'],
  // react-native-config does not expose android in its package; New Architecture needs autolinking + CMake codegen.
  dependencies: {
    'react-native-config': {
      platforms: {
        android: {
          sourceDir: path.join(
            __dirname,
            'node_modules/react-native-config/android',
          ),
          packageImportPath: 'import com.lugg.RNCConfig.RNCConfigPackage;',
          packageInstance: 'new RNCConfigPackage()',
          buildTypes: [],
          libraryName: 'RNCConfigSpec',
          componentDescriptors: [],
          cmakeListsPath: path.join(
            __dirname,
            'node_modules/react-native-config/android/build/generated/source/codegen/jni/CMakeLists.txt',
          ),
        },
      },
    },
    // CLI reports android: null for this package; without autolinking, RNCDatePicker TurboModule is missing.
    '@react-native-community/datetimepicker': {
      platforms: {
        android: {
          sourceDir: path.join(
            __dirname,
            'node_modules/@react-native-community/datetimepicker/android',
          ),
          packageImportPath:
            'import com.reactcommunity.rndatetimepicker.RNDateTimePickerPackage;',
          packageInstance: 'new RNDateTimePickerPackage()',
          buildTypes: [],
          libraryName: 'RNDateTimePickerCGen',
          componentDescriptors: [],
          cmakeListsPath: path.join(
            __dirname,
            'node_modules/@react-native-community/datetimepicker/android/build/generated/source/codegen/jni/CMakeLists.txt',
          ),
        },
      },
    },
  },
};
