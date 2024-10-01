import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Courses from '../screens/Dashboard/Courses/Courses';
import Preference from '../screens/Dashboard/Preference/Preference';
import ViewAllContent from '../screens/Dashboard/ViewAllContent';
import CourseContentList from '../screens/Dashboard/Courses/CourseContentList';
import UnitList from '../screens/Dashboard/Courses/UnitList';

const Stack = createNativeStackNavigator();

const DashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Courses" component={Courses} />
      <Stack.Screen name="CourseContentList" component={CourseContentList} />
      <Stack.Screen name="UnitList" component={UnitList} />
      <Stack.Screen name="Preference" component={Preference} />
      <Stack.Screen name="ViewAll" component={ViewAllContent} />
    </Stack.Navigator>
  );
};

export default DashboardStack;
