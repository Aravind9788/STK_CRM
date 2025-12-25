import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from './screens/sales_executive/DashboardScreen';
import NewLeadScreen from './screens/sales_executive/NewLeadScreen';
import LoginScreen from './screens/LoginScreen';
import FollowupsScreen from './screens/sales_executive/FollowupsScreen';
import CatalogScreen from './screens/sales_executive/CatalogScreen';
import QuoteBuilderScreen from './screens/sales_executive/QuoteBuilderScreen';
import QuotationDetailsScreen from './screens/sales_executive/QuotationDetailsScreen';
import StoreManagerDashboardScreen from './screens/store_manager/StoreManagerDashboardScreen';
import StoreOrderDetailsScreen from './screens/store_manager/StoreOrderDetailsScreen';
import TeamLeadDashboardScreen from './screens/team_lead/TeamLeadDashboardScreen';
import SalesExPerformMenu from './screens/team_lead/SalesExPerformMenu';
import TeamPerformanceDashboard from './screens/team_lead/TeamPerformanceDashboard';
import IndividualPerformance from './screens/team_lead/IndividualPerformance';
import IndividualSalesPerformance from './screens/team_lead/IndividualSalesPerformance';
import PendingLeadsOverview from './screens/team_lead/PendingLeadsOverview';
import LowPerformerProfiles from './screens/team_lead/LowPerformerProfiles';
import StoreManagerDashboard from './screens/team_lead/StoreManagerDashboard';
import DirectorDashboard from './screens/director/DirectorDashboard';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="StoreManagerDashboard">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="NewLead" component={NewLeadScreen} />
        <Stack.Screen name="FollowupsScreen" component={FollowupsScreen} />
        <Stack.Screen name="catelog" component={CatalogScreen} />
        <Stack.Screen name="Quotebuilder" component={QuoteBuilderScreen} />
        <Stack.Screen name="QuotationDetails" component={QuotationDetailsScreen} />
        <Stack.Screen name="StoreManagerDashboard" component={StoreManagerDashboardScreen} />
        <Stack.Screen name="StoreOrderDetails" component={StoreOrderDetailsScreen} />
        <Stack.Screen name="TeamLeadDashboard" component={TeamLeadDashboardScreen} />
        <Stack.Screen name="TeamLeadSales" component={SalesExPerformMenu} />
        <Stack.Screen name="TeamPerformanceDashboard" component={TeamPerformanceDashboard} />
        <Stack.Screen name="IndividualPerformance" component={IndividualPerformance} />
        <Stack.Screen name="IndividualSalesPerformance" component={IndividualSalesPerformance} />
        <Stack.Screen name="PendingLeadsOverview" component={PendingLeadsOverview} />
        <Stack.Screen name="LowPerformerProfiles" component={LowPerformerProfiles} />
        <Stack.Screen name="StoreManagerPerformance" component={StoreManagerDashboard} />
        <Stack.Screen name="DirectorDashboard" component={DirectorDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
