import React from 'react';
import LoadingScreen from './screens/LoadingScreen/LoadingScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LanguageScreen from './screens/LanguageScreen/LanguageScreen';
import { ApplicationProvider } from '@ui-kitten/components';
//importing all designs from eva as eva
import * as eva from '@eva-design/eva';
//importing custom theme for UI Kitten
import theme from './assets/themes/theme.json';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    // App.js file has to be wrapped with ApplicationProvider for UI Kitten to work
    <ApplicationProvider {...eva} theme={{ ...eva.light, ...theme }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="LoadingScreen"
        >
          <Stack.Screen name="LoadingScreen" component={LoadingScreen} />
          <Stack.Screen name="LanguageScreen" component={LanguageScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ApplicationProvider>
  );
};

export default App;
