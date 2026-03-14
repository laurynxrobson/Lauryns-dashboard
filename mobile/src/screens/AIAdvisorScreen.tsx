import { useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { format, parseISO } from 'date-fns'
import { useAIStore } from '../store/aiStore'
import { useHealthStore } from '../store/healthStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useHabitStore } from '../store/habitStore'
import { calculateReadiness } from '../lib/readinessEngine'

const SUGGESTED_PROMPTS = [
  'Plan my training week based on my readiness',
  'How can I improve my HRV?',
  'Analyse my recent workouts and suggest progressions',
  'What should I prioritise today?',
]

export default function AIAdvisorScreen() {
  const { messages, isLoading, sendMessage, clearConversation } = useAIStore()
  const todayMetrics = useHealthStore((s) => s.getTodayMetrics())
  const { workouts } = useWorkoutStore()
  const { habits } = useHabitStore()
  const readiness = calculateReadiness(todayMetrics ?? {})

  const [input, setInput] = useState('')
  const scrollRef = useRef<ScrollView>(null)

  function buildContext() {
    const today = format(new Date(), 'yyyy-MM-dd')
    return {
      healthMetrics: todayMetrics ?? undefined,
      readiness: { score: readiness.score, tier: readiness.tier, label: readiness.label },
      recentWorkouts: workouts.slice(0, 5).map((w) => ({
        name: w.name,
        date: w.date,
        exercises: w.exercises.map((e) => ({ name: e.name, sets: e.sets })),
      })),
      habits: habits.map((h) => ({
        name: h.name,
        completedToday: !!h.completions[today],
      })),
    }
  }

  function handleSend(text = input) {
    if (!text.trim() || isLoading) return
    setInput('')
    sendMessage(
      text.trim(),
      buildContext(),
      (_id, _delta) => {
        scrollRef.current?.scrollToEnd({ animated: true })
      },
      (_id) => {
        scrollRef.current?.scrollToEnd({ animated: true })
      }
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-3 border-b border-gray-100 bg-gray-50 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: readiness.color }}>
              <Text className="text-white text-xs font-bold">AI</Text>
            </View>
            <View>
              <Text className="text-sm font-bold text-gray-900">AI Advisor</Text>
              <Text className="text-xs text-gray-400">
                Readiness <Text style={{ color: readiness.color }}>{readiness.score}</Text> · {readiness.label}
              </Text>
            </View>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity
              onPress={clearConversation}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text className="text-xs text-gray-400">Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View className="items-center pt-4">
              {/* Readiness snapshot */}
              <View
                className="w-full rounded-2xl p-4 mb-5 border"
                style={{ borderColor: readiness.color + '40', backgroundColor: readiness.color + '12' }}
              >
                <Text
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: readiness.color }}
                >
                  Today's Readiness · {readiness.label}
                </Text>
                <Text className="text-3xl font-bold text-gray-900">
                  {readiness.score}
                  <Text className="text-sm font-normal text-gray-400">/100</Text>
                </Text>
                {todayMetrics && (
                  <View className="flex-row gap-4 mt-2">
                    <Text className="text-xs text-gray-500">HRV {todayMetrics.hrv ?? '—'} ms</Text>
                    <Text className="text-xs text-gray-500">Sleep {todayMetrics.sleepHours ?? '—'} hrs</Text>
                    <Text className="text-xs text-gray-500">Steps {todayMetrics.steps?.toLocaleString() ?? '—'}</Text>
                  </View>
                )}
              </View>

              <Text className="text-xs text-gray-400 uppercase tracking-widest mb-3 self-start">
                Suggested questions
              </Text>
              {SUGGESTED_PROMPTS.map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => handleSend(p)}
                  className="w-full bg-white rounded-2xl px-4 py-3 mb-2 border border-gray-100 shadow-sm"
                  activeOpacity={0.8}
                >
                  <Text className="text-sm text-gray-800">{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            messages.map((m, i) => {
              const isUser = m.role === 'user'
              const isStreamingThis = isLoading && i === messages.length - 1 && !isUser
              return (
                <View
                  key={m.id}
                  className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <View
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      isUser
                        ? 'bg-gray-900 rounded-tr-sm'
                        : 'bg-white border border-gray-100 shadow-sm rounded-tl-sm'
                    }`}
                  >
                    <Text className={`text-sm leading-5 ${isUser ? 'text-white' : 'text-gray-900'}`}>
                      {m.content}
                      {isStreamingThis && (
                        <Text className="text-gray-400"> ▋</Text>
                      )}
                    </Text>
                    <Text className={`text-xs mt-1 ${isUser ? 'text-white/50' : 'text-gray-400'}`}>
                      {format(parseISO(m.timestamp), 'h:mm a')}
                    </Text>
                  </View>
                </View>
              )
            })
          )}
        </ScrollView>

        {/* Input bar */}
        <View className="flex-row items-end px-4 pb-4 pt-3 border-t border-gray-100 bg-gray-50 gap-2">
          <TextInput
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 max-h-24"
            placeholder="Ask about training, recovery…"
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: input.trim() && !isLoading ? readiness.color : '#E5E7EB' }}
          >
            <Text className="text-white text-base font-bold">↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
