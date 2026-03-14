import { createStackNavigator } from '@react-navigation/stack'
import { useAuthStore } from '../store/authStore'
import AuthScreen from '../screens/AuthScreen'
import HabitsScreen from '../screens/HabitsScreen'

export type RootStackParamList = {
  Auth: undefined
  Habits: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Habits" component={HabitsScreen} />
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  )
}
