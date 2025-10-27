import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationProvider } from "./context/NavigationContext";
import { LanguageProvider } from "./context/LanguageContext";
import './config/i18n'; // Initialize i18n
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
import ServerStatusChecker from "./components/ServerStatusChecker";
import MaintenanceSupervisorScreen from "./screens/maintenance/MaintenanceSupervisorScreen";
import MaintenanceSupervisorListScreen from "./screens/maintenance/MaintenanceSupervisorListScreen";
import ReportBreakdownScreen from "./screens/breakdown/ReportBreakdownScreen";
import BreakdownSelectionScreen from "./screens/breakdown/BreakdownSelectionScreen";
import BreakdownReportScreen from "./screens/breakdown/BreakdownReportScreen";
import UpdateBreakdownScreen from "./screens/breakdown/UpdateBreakdownScreen";
import WorkOrderManagementScreen from "./screens/work_order/WorkOrderManagementScreen";
import WorkOrderDetailsScreen from "./screens/work_order/WorkOrderDetailsScreen";
import NotificationHandler from "./components/NotificationHandler";
import NotificationSettingsScreen from "./screens/NotificationSettingsScreen";
import FCMTestComponent from "./components/FCMTestComponent";
import FCMDebugComponent from "./components/FCMDebugComponent";
import DirectFCMAccess from "./components/DirectFCMAccess";
import StatusBarNotificationTester from "./components/StatusBarNotificationTester";
import NotificationTroubleshooter from "./components/NotificationTroubleshooter";
import { NotificationProvider } from "./context/NotificationContext";


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// TabNavigator removed - Employee and Department assets are now separate stack screens

export default function App() {
  return (
    <LanguageProvider>
      <NavigationProvider>
        <NotificationProvider>
          <NotificationHandler>
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
                <Stack.Screen name="ServerStatus" component={ServerStatusChecker} />
                <Stack.Screen name="MaintenanceSupervisor" component={MaintenanceSupervisorListScreen} />
                <Stack.Screen name="MaintenanceSupervisorForm" component={MaintenanceSupervisorScreen} />
                <Stack.Screen name="REPORTBREAKDOWN" component={ReportBreakdownScreen} />
                <Stack.Screen name="BREAKDOWNSELECTION" component={BreakdownSelectionScreen} />
                <Stack.Screen name="BREAKDOWNREPORT" component={BreakdownReportScreen} />
                <Stack.Screen name="UPDATEBREAKDOWN" component={UpdateBreakdownScreen} />
                <Stack.Screen name="WorkOrderManagement" component={WorkOrderManagementScreen} />
                <Stack.Screen name="WorkOrderDetails" component={WorkOrderDetailsScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="FCMTest" component={FCMTestComponent} />
        <Stack.Screen name="FCMDebug" component={FCMDebugComponent} />
        <Stack.Screen name="DirectFCMAccess" component={DirectFCMAccess} />
        <Stack.Screen name="StatusBarTester" component={StatusBarNotificationTester} />
        <Stack.Screen name="NotificationTroubleshooter" component={NotificationTroubleshooter} />
              </Stack.Navigator>
            </NavigationContainer>
          </NotificationHandler>
        </NotificationProvider>
      </NavigationProvider>
    </LanguageProvider>
  );
}
