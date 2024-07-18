import React, { useEffect } from 'react';
import { View } from 'react-native';
import LoadingScreen from './screens/LoadingScreen/LoadingScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LanguageScreen from './screens/LanguageScreen/LanguageScreen';
import { ApplicationProvider } from '@ui-kitten/components';
//importing all designs from eva as eva
import * as eva from '@eva-design/eva';
//importing custom theme for UI Kitten
import theme from './assets/themes/theme.json';
import RegisterScreen from './screens/RegisterScreen/RegisterScreen';
import LoginSignUpScreen from './screens/LoginSignUpScreen/LoginSignUpScreen';
import RegisterStart from './screens/RegisterStart/RegisterStart';

//multiple language
import { LanguageProvider } from './context/LanguageContext'; // Adjust path as needed
import LoginScreen from './screens/LoginScreen/LoginScreen';
import ContinueRegisterScreen from './screens/ContinueRegisterScreen/ContinueRegisterScreen';
import PlayerScreen from './screens/PlayerScreen/PlayerScreen';
import QuMLPlayer from './screens/PlayerScreen/QuMLPlayer/QuMLPlayer';
import PdfPlayer from './screens/PlayerScreen/PdfPlayer/PdfPlayer';
import PdfPlayerOffline from './screens/PlayerScreen/PdfPlayer/PdfPlayerOffline';
import VideoPlayer from './screens/PlayerScreen/VideoPlayer/VideoPlayer';
import VideoPlayerOffline from './screens/PlayerScreen/VideoPlayer/VideoPlayerOffline';
import EpubPlayer from './screens/PlayerScreen/EpubPlayer/EpubPlayer';
import EpubPlayerOffline from './screens/PlayerScreen/EpubPlayer/EpubPlayerOffline';
import { PermissionsAndroid, Platform } from 'react-native';

async function checkAndRequestStoragePermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
    ];
    const granted = await PermissionsAndroid.requestMultiple(permissions);

    const allGranted = permissions.every(
      (permission) => granted[permission] === PermissionsAndroid.RESULTS.GRANTED
    );

    if (!allGranted) {
      Alert.alert(
        'Permission Denied',
        'Storage permission is required to download files. The app will now exit.',
        [{ text: 'OK', onPress: () => BackHandler.exitApp() }]
      );
      return false;
    }
  } else {
    const hasWritePermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );
    const hasReadPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
    );

    if (!hasWritePermission || !hasReadPermission) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);

      if (
        granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] !==
          PermissionsAndroid.RESULTS.GRANTED ||
        granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] !==
          PermissionsAndroid.RESULTS.GRANTED
      ) {
        Alert.alert(
          'Permission Denied',
          'Storage permission is required to download files. The app will now exit.',
          [{ text: 'OK', onPress: () => BackHandler.exitApp() }]
        );
        return false;
      }
    }
  }
  return true;
}

const Stack = createNativeStackNavigator();

const App = () => {
  useEffect(() => {
    const initializeApp = async () => {
      const hasPermission = await checkAndRequestStoragePermission();
      if (!hasPermission) {
        // Exit the app if permissions are denied
        BackHandler.exitApp();
        return;
      }
    };

    initializeApp();
  }, []);

  return (
    <LanguageProvider>
      {/* // App.js file has to be wrapped with ApplicationProvider for UI Kitten to
      work */}
      <ApplicationProvider {...eva} theme={{ ...eva.light, ...theme }}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="LoadingScreen"
          >
            <Stack.Screen name="LoadingScreen" component={LoadingScreen} />
            <Stack.Screen name="LanguageScreen" component={LanguageScreen} />
            <Stack.Screen
              name="PlayerScreen"
              component={PlayerScreen}
              options={{
                headerShown: false,
                headerBackground: () => (
                  <View style={{ backgroundColor: 'white', flex: 1 }}></View>
                ),
              }}
            />
            <Stack.Screen
              name="QuMLPlayer"
              component={QuMLPlayer}
              options={{
                headerShown: false,
                headerBackground: () => (
                  <View style={{ backgroundColor: 'white', flex: 1 }}></View>
                ),
              }}
            />
            <Stack.Screen
              name="PdfPlayer"
              component={PdfPlayer}
              options={{
                headerShown: false,
                headerBackground: () => (
                  <View style={{ backgroundColor: 'white', flex: 1 }}></View>
                ),
              }}
            />
            <Stack.Screen
              name="PdfPlayerOffline"
              component={PdfPlayerOffline}
              options={{
                headerShown: false,
                headerBackground: () => (
                  <View style={{ backgroundColor: 'white', flex: 1 }}></View>
                ),
              }}
            />
            <Stack.Screen
              name="VideoPlayer"
              component={VideoPlayer}
              options={{
                headerShown: false,
                headerBackground: () => (
                  <View style={{ backgroundColor: 'white', flex: 1 }}></View>
                ),
              }}
            />
            <Stack.Screen
              name="VideoPlayerOffline"
              component={VideoPlayerOffline}
              options={{
                headerShown: false,
                headerBackground: () => (
                  <View style={{ backgroundColor: 'white', flex: 1 }}></View>
                ),
              }}
            />
            <Stack.Screen
              name="EpubPlayer"
              component={EpubPlayer}
              options={{
                headerShown: false,
                headerBackground: () => (
                  <View style={{ backgroundColor: 'white', flex: 1 }}></View>
                ),
              }}
            />
            <Stack.Screen
              name="EpubPlayerOffline"
              component={EpubPlayerOffline}
              options={{
                headerShown: false,
                headerBackground: () => (
                  <View style={{ backgroundColor: 'white', flex: 1 }}></View>
                ),
              }}
            />
            <Stack.Screen
              name="RegisterScreen"
              component={RegisterScreen}
              options={{
                headerShown: false,
                headerBackground: () => (
                  <View style={{ backgroundColor: 'white', flex: 1 }}></View>
                ),
              }}
            />
            <Stack.Screen
              name="LoginSignUpScreen"
              component={LoginSignUpScreen}
              options={{
                headerShown: false,
                headerBackground: () => (
                  <View style={{ backgroundColor: 'white', flex: 1 }}></View>
                ),
              }}
            />
            <Stack.Screen name="RegisterStart" component={RegisterStart} />
            <Stack.Screen
              name="LoginScreen"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ContinueRegisterScreen"
              component={ContinueRegisterScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ApplicationProvider>
    </LanguageProvider>
  );
};

export default App;
