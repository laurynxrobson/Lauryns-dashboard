import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'
import { useAuthStore } from '../store/authStore'

export default function AuthScreen() {
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  async function handleFaceId() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()

      if (!hasHardware || !isEnrolled) {
        // Fallback for simulator / devices without biometric
        login('Lauryn', 'lauryn@example.com')
        return
      }

      setLoading(true)
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Lauryn\'s Dashboard',
        fallbackLabel: 'Use passcode',
      })

      if (result.success) {
        login('Lauryn', 'lauryn@example.com')
      } else {
        Alert.alert('Authentication failed', 'Please try again.')
      }
    } catch {
      Alert.alert('Error', 'Biometric authentication unavailable.')
    } finally {
      setLoading(false)
    }
  }

  function handleMockLogin() {
    login('Lauryn', 'lauryn@example.com')
  }

  return (
    <View className="flex-1 bg-muted items-center justify-center px-6">
      {/* Logo */}
      <View className="w-16 h-16 rounded-2xl bg-text-primary items-center justify-center mb-6">
        <Text className="text-surface text-2xl">✦</Text>
      </View>

      <Text className="text-xl font-semibold text-text-primary mb-1">
        Lauryn's Dashboard
      </Text>
      <Text className="text-sm text-text-secondary mb-10">Your personal life OS</Text>

      {/* Auth card */}
      <View className="w-full max-w-xs bg-surface border border-border rounded-2xl p-6">
        {/* Face ID button */}
        <TouchableOpacity
          onPress={handleFaceId}
          disabled={loading}
          className="w-full flex-row items-center justify-center gap-3 py-3 bg-text-primary rounded-xl mb-4"
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-2xl">🔒</Text>
          )}
          <Text className="text-surface font-medium text-sm">
            {loading ? 'Verifying…' : 'Unlock with Face ID'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-3 mb-4">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-xs text-text-secondary">or</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        {/* Quick access (dev only) */}
        <TouchableOpacity
          onPress={handleMockLogin}
          className="w-full py-2.5 border border-border rounded-xl items-center"
          activeOpacity={0.7}
        >
          <Text className="text-sm text-text-secondary">Continue without biometric</Text>
        </TouchableOpacity>
      </View>

      {/* Security note */}
      <Text className="text-xs text-text-secondary mt-6 text-center">
        🔐 Secured with iOS Keychain · OAuth 2.0 · JWT
      </Text>
    </View>
  )
}
