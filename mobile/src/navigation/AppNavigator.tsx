import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import { useAuthStore } from '../store/authStore'
import AuthScreen from '../screens/AuthScreen'
import HabitsScreen from '../screens/HabitsScreen'
import HealthScreen from '../screens/HealthScreen'
import ReadinessScreen from '../screens/ReadinessScreen'
import WorkoutScreen from '../screens/WorkoutScreen'
import WorkoutLogScreen from '../screens/WorkoutLogScreen'

// ─── type definitions ─────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
}

export type MainTabParamList = {
  Habits: undefined
  Health: undefined
  Workouts: undefined
}

export type HealthStackParamList = {
  HealthHome: undefined
  Readiness: undefined
}

export type WorkoutStackParamList = {
  WorkoutHome: undefined
  WorkoutLog: { workoutId: string }
}

// ─── navigators ───────────────────────────────────────────────────────────────

const Root = createStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()
const HealthStack = createStackNavigator<HealthStackParamList>()
const WorkoutStack = createStackNavigator<WorkoutStackParamList>()

function HealthNavigator() {
  return (
    <HealthStack.Navigator screenOptions={{ headerShown: false }}>
      <HealthStack.Screen name="HealthHome" component={HealthScreen} />
      <HealthStack.Screen name="Readiness" component={ReadinessScreen} />
    </HealthStack.Navigator>
  )
}

function WorkoutNavigator() {
  return (
    <WorkoutStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkoutStack.Screen name="WorkoutHome" component={WorkoutScreen} />
      <WorkoutStack.Screen name="WorkoutLog" component={WorkoutLogScreen} />
    </WorkoutStack.Navigator>
  )
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Habits: '◎',
    Health: '〰️',
    Workouts: '🏋️',
  }
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.4 }}>
      {icons[label] ?? '●'}
    </Text>
  )
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopColor: '#F3F4F6',
          backgroundColor: '#FFFFFF',
          height: 84,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Habits" component={HabitsScreen} />
      <Tab.Screen name="Health" component={HealthNavigator} />
      <Tab.Screen name="Workouts" component={WorkoutNavigator} />
    </Tab.Navigator>
  )
}

// ─── root navigator ───────────────────────────────────────────────────────────

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Root.Screen name="Main" component={MainTabs} />
      ) : (
        <Root.Screen name="Auth" component={AuthScreen} />
      )}
    </Root.Navigator>
  )
}
