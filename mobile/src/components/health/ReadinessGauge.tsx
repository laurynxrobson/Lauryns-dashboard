/**
 * ReadinessGauge
 * A circular arc gauge drawn with SVG paths (no react-native-svg dependency
 * beyond what we added). Shows the 0–100 score with colour coding.
 */

import { View, Text } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

interface Props {
  score: number   // 0–100
  color: string   // hex
  size?: number
}

export default function ReadinessGauge({ score, color, size = 160 }: Props) {
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius

  // Arc spans 270° (from 135° to 45° going clockwise)
  const arcLength = circumference * 0.75
  const progress = arcLength * (score / 100)
  const dashOffset = arcLength - progress

  // Start the arc at the bottom-left (135° from the positive x-axis)
  // We rotate the SVG group so the arc starts at the bottom-left
  const startAngle = 135 * (Math.PI / 180)
  const startX = cx + radius * Math.cos(startAngle)
  const startY = cy + radius * Math.sin(startAngle)

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          // Rotate so the arc starts at bottom-left
          transform={`rotate(135, ${cx}, ${cy})`}
        />
        {/* Coloured progress arc */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(135, ${cx}, ${cy})`}
        />
      </Svg>

      {/* Score text centred in the gauge */}
      <View
        className="absolute items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: size * 0.28, color }}
        >
          {score}
        </Text>
        <Text className="text-xs text-gray-400 uppercase tracking-wide">
          Readiness
        </Text>
      </View>
    </View>
  )
}
