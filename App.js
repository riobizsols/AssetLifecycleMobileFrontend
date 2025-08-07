import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationProvider } from "./context/NavigationContext";
import Employee_Asset from "./app/index"; // or wherever your Asset_1 is
import AnotherPage from "./app/Dept_Asset";
import Emp_Asset_2 from "./screens/employee_asset/emp_asset_2";
import Dept_Asset_1 from "./app/Dept_Asset";
import Asset_1 from "./app/Asset";
import Dept_Asset_2 from "./screens/dept_asset/dept_asset_2";
import Dept_Asset_3 from "./screens/dept_asset/dept_asset_3";
import Dept_Asset_4 from "./screens/dept_asset/dept_asset_4";
import Dept_Asset_5 from "./screens/dept_asset/dept_asset_5";
import Dept_Asset_6 from "./screens/dept_asset/dept_asset_6";
import Asset_2 from "./screens/asset/asset_2";
import Asset_3 from "./screens/asset/asset_3";
import AssetHistory from "./screens/asset/asset_history";
import EmployeeAssetHistory from "./screens/employee_asset/emp_asset_history";
import EmployeeAssetAssign from "./screens/employee_asset/emp_asset_assign";
import EmployeeAssetDetails from "./screens/employee_asset/emp_asset_details";
import EmployeeAssetAssignment from "./screens/employee_asset/emp_asset_assignment";
import EmployeeAssetSelect from "./screens/employee_asset/emp_asset_select";
import LoginScreen from "./screens/auth/LoginScreen";
import LoadingScreen from "./screens/auth/LoadingScreen";
import HomeScreen from "./screens/HomeScreen";


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// TabNavigator removed - Employee and Department assets are now separate stack screens

export default function App() {
  return (
    <NavigationProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Loading" component={LoadingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Asset" component={Asset_1} />
          <Stack.Screen name="EmployeeAsset" component={Employee_Asset} />
          <Stack.Screen name="DepartmentAsset" component={Dept_Asset_1} />
          <Stack.Screen name="Emp_Asset_2" component={Emp_Asset_2} />
          <Stack.Screen name="Dept_Asset_2" component={Dept_Asset_2} />
          <Stack.Screen name="Dept_Asset_3" component={Dept_Asset_3} />
          <Stack.Screen name="Dept_Asset_4" component={Dept_Asset_4} />
          <Stack.Screen name="Dept_Asset_5" component={Dept_Asset_5} />
          <Stack.Screen name="Dept_Asset_6" component={Dept_Asset_6} />
          <Stack.Screen name="AssetDetails" component={Asset_2} />
          <Stack.Screen name="AssetAssignment" component={Asset_3} />
          <Stack.Screen name="AssetHistory" component={AssetHistory} />
          <Stack.Screen name="EmployeeAssetHistory" component={EmployeeAssetHistory} />
          <Stack.Screen name="EmployeeAssetAssign" component={EmployeeAssetAssign} />
          <Stack.Screen name="EmployeeAssetDetails" component={EmployeeAssetDetails} />
          <Stack.Screen name="EmployeeAssetAssignment" component={EmployeeAssetAssignment} />
          <Stack.Screen name="EmployeeAssetSelect" component={EmployeeAssetSelect} />
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationProvider>
  );
}
