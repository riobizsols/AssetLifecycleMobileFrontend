import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Employee_Asset from "./app/index"; // or wherever your Asset_1 is
import AnotherPage from "./app/Dept_Asset";
import Asset_2 from "./screens/employee_asset/emp_asset_2";
import Dept_Asset_1 from "./app/Dept_Asset";
import Dept_Asset_2 from "./screens/dept_asset/dept_asset_2";
import Dept_Asset_3 from "./screens/dept_asset/dept_asset_3";
import Dept_Asset_4 from "./screens/dept_asset/dept_asset_4";
import Dept_Asset_5 from "./screens/dept_asset/dept_asset_5";


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Employee Asset"
        component={Employee_Asset}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Department Asset"
        component={Dept_Asset_1}
        options={{ headerShown: false }}
      />
      {/* <Tab.Screen
        name="Asset"
        component={Dept_Asset_1}
        options={{ headerShown: false }}
      /> */}
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Asset_2" component={Asset_2} />
        <Stack.Screen name="Dept_Asset_2" component={Dept_Asset_2} />
        <Stack.Screen name="Dept_Asset_3" component={Dept_Asset_3} />
        <Stack.Screen name="Dept_Asset_4" component={Dept_Asset_4} />
        <Stack.Screen name="Dept_Asset_5" component={Dept_Asset_5} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
