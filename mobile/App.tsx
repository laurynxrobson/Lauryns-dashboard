import { NavigationContainer } from '@react-navigation/native'
import AppNavigator from './src/navigation/AppNavigator'
import { StatusBar } from 'expo-status-bar'

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <AppNavigator />
    </NavigationContainer>
  )
}
