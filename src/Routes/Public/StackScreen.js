import React, { Suspense, lazy } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoadingScreen from '../../screens/LoadingScreen/LoadingScreen';
import LanguageScreen from '../../screens/LanguageScreen/LanguageScreen';
import ForgotPassword from '../../screens/ForgotPassword/ForgotPassword';
import RegisterScreen from '../../screens/RegisterScreen/RegisterScreen';
import LoginSignUpScreen from '../../screens/LoginSignUpScreen/LoginSignUpScreen';
import RegisterStart from '../../screens/RegisterStart/RegisterStart';
import LoginScreen from '../../screens/LoginScreen/LoginScreen';
import TermsAndCondition from '../../screens/LoginScreen/TermsAndCondition';
import { View } from 'react-native';
import PlayerScreen from '../../screens/PlayerScreen/PlayerScreen';
import QuMLPlayer from '../../screens/PlayerScreen/QuMLPlayer/QuMLPlayer';
import QuMLPlayerOffline from '../../screens/PlayerScreen/QuMLPlayer/QuMLPlayerOffline';
import PdfPlayer from '../../screens/PlayerScreen/PdfPlayer/PdfPlayer';
import PdfPlayerOffline from '../../screens/PlayerScreen/PdfPlayer/PdfPlayerOffline';
import VideoPlayer from '../../screens/PlayerScreen/VideoPlayer/VideoPlayer';
import VideoPlayerOffline from '../../screens/PlayerScreen/VideoPlayer/VideoPlayerOffline';
import EpubPlayer from '../../screens/PlayerScreen/EpubPlayer/EpubPlayer';
import EpubPlayerOffline from '../../screens/PlayerScreen/EpubPlayer/EpubPlayerOffline';
import ECMLPlayer from '../../screens/PlayerScreen/ECMLPlayer/ECMLPlayer';
import ECMLPlayerOffline from '../../screens/PlayerScreen/ECMLPlayer/ECMLPlayerOffline';
import H5PPlayer from '../../screens/PlayerScreen/H5PPlayer/H5PPlayer';
import H5PPlayerOffline from '../../screens/PlayerScreen/H5PPlayer/H5PPlayerOffline';
import HTMLPlayer from '../../screens/PlayerScreen/HTMLPlayer/HTMLPlayer';
import HTMLPlayerOffline from '../../screens/PlayerScreen/HTMLPlayer/HTMLPlayerOffline';
import YoutubePlayer from '../../screens/PlayerScreen/YoutubePlayer/YoutubePlayer';
import StandAlonePlayer from '../../screens/PlayerScreen/StandAlonePlayer/StandAlonePlayer';
import EnableLocationScreen from '../../screens/Location/EnableLocationScreen';
import UnauthorizedScreen from '../../screens/Unauthorized/UnauthorizedScreen';
import PlpWebViewScreen from '../../screens/PlpWebViewScreen/PlpWebViewScreen';
import ProgramsScreen from '../../screens/ProgramsScreen/ProgramsScreen';

const TabScreen = lazy(() => import('./TabScreen'));
const DashboardStack = lazy(() => import('./DashboardStack'));
const SCPUserTabScreen = lazy(() => import('../SCPUser/SCPUserTabScreen'));
const YouthNetTabScreen = lazy(() => import('../Youthnet/YouthNetTabScreen'));

const stackLazyFallback = (
  <View style={{ flex: 1, backgroundColor: 'white' }} />
);

const StackScreen = () => {
  const Stack = createNativeStackNavigator();

  const headerBackground = () => {
    return <View style={{ backgroundColor: 'white', flex: 1 }}></View>;
  };

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      //solved blanck screen issue for long time
      initialRouteName="LoadingScreen"
      //initialRouteName="LanguageScreen"
    >
      <Stack.Screen
        name="LoadingScreen"
        component={LoadingScreen}
        options={{ lazy: true }} // Lazily load the screen
      />
      <Stack.Screen
        name="LanguageScreen"
        component={LanguageScreen}
        options={{ lazy: true }} // Lazily load the screen
      />
      <Stack.Screen
        name="RegisterScreen"
        component={RegisterScreen}
        options={{
          headerShown: false,
          headerBackground: () => headerBackground(),
          lazy: true,
        }}
      />

      <Stack.Screen
        name="LoginSignUpScreen"
        component={LoginSignUpScreen}
        options={{
          headerShown: false,
          headerBackground: () => headerBackground(),
          lazy: true,
        }}
      />
      <Stack.Screen name="RegisterStart" component={RegisterStart} />
      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{ headerShown: false, lazy: true }}
      />

      <Stack.Screen
        name="Dashboard"
        options={{ headerShown: false, lazy: true }}
      >
        {(props) => (
          <Suspense fallback={stackLazyFallback}>
            <TabScreen {...props} />
          </Suspense>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="SCPUserTabScreen"
        options={{ headerShown: false, lazy: true }}
      >
        {(props) => (
          <Suspense fallback={stackLazyFallback}>
            <SCPUserTabScreen {...props} />
          </Suspense>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="YouthNetTabScreen"
        options={{ headerShown: false, lazy: true }}
      >
        {(props) => (
          <Suspense fallback={stackLazyFallback}>
            <YouthNetTabScreen {...props} />
          </Suspense>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="PlayerScreen"
        component={PlayerScreen}
        options={{
          headerShown: false,
          headerBackground: () => (
            <View style={{ backgroundColor: 'white', flex: 1 }}></View>
          ),
          lazy: true,
        }}
      />
      <Stack.Screen
        name="QuMLPlayer"
        component={QuMLPlayer}
        options={{
          headerShown: true,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="QuMLPlayerOffline"
        component={QuMLPlayerOffline}
        options={{
          headerShown: true,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="PdfPlayer"
        component={PdfPlayer}
        options={{
          headerShown: true,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="PdfPlayerOffline"
        component={PdfPlayerOffline}
        options={{
          headerShown: true,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="VideoPlayer"
        component={VideoPlayer}
        options={{
          headerShown: true,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="VideoPlayerOffline"
        component={VideoPlayerOffline}
        options={{
          headerShown: true,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="EpubPlayer"
        component={EpubPlayer}
        options={{
          headerShown: true,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="EpubPlayerOffline"
        component={EpubPlayerOffline}
        options={{
          headerShown: true,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="ECMLPlayer"
        component={ECMLPlayer}
        options={{
          headerShown: true,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="ECMLPlayerOffline"
        component={ECMLPlayerOffline}
        options={{
          headerShown: true,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="H5PPlayer"
        component={H5PPlayer}
        options={{
          headerShown: true,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="H5PPlayerOffline"
        component={H5PPlayerOffline}
        options={{
          headerShown: true,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="HTMLPlayer"
        component={HTMLPlayer}
        options={{
          headerShown: true,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="HTMLPlayerOffline"
        component={HTMLPlayerOffline}
        options={{
          headerShown: true,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="YoutubePlayer"
        component={YoutubePlayer}
        options={{
          headerShown: true,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="StandAlonePlayer"
        component={StandAlonePlayer}
        options={{
          headerShown: false,
          lazy: true,
        }}
      />
      <Stack.Screen
        name="TermsAndCondition"
        component={TermsAndCondition}
        options={{
          headerShown: false,
          lazy: true,
        }}
      />

      <Stack.Screen
        name="DashboardStack"
        options={{ headerShown: false, lazy: true }}
      >
        {(props) => (
          <Suspense fallback={stackLazyFallback}>
            <DashboardStack {...props} />
          </Suspense>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="EnableLocationScreen"
        component={EnableLocationScreen} // Changed to Assessment for now
        options={{ headerShown: false, lazy: true }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPassword} // Changed to Assessment for now
        options={{ headerShown: false, lazy: true }}
      />
      <Stack.Screen
        name="UnauthorizedScreen"
        component={UnauthorizedScreen}
        options={{ headerShown: false, lazy: true }}
      />
      <Stack.Screen
        name="PlpWebViewScreen"
        component={PlpWebViewScreen}
        options={{ headerShown: false, lazy: true }}
      />
      <Stack.Screen
        name="ProgramsScreen"
        component={ProgramsScreen}
        options={{ headerShown: false, lazy: true }}
      />
    </Stack.Navigator>
  );
};

export default StackScreen;
