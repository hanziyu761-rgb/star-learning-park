/**
 * 原创图形绘制：平面图形与钟面（react-native-svg），不使用任何第三方素材。
 */
import { PuzzleView } from './PuzzleFigure';
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import type { Figure, ShapeKind, Visual } from '@/lesson/types';
import { colors } from '@/theme';

/** 平面图形在 100×100 画布中的路径 */
function shapeElement(shape: ShapeKind, color: string) {
  const stroke = { stroke: '#3A2E2A', strokeWidth: 4, strokeLinejoin: 'round' as const };
  switch (shape) {
    case 'circle':
      return <Circle cx={50} cy={50} r={38} fill={color} {...stroke} />;
    case 'triangle':
      return <Polygon points="50,12 90,84 10,84" fill={color} {...stroke} />;
    case 'square':
      return <Rect x={16} y={16} width={68} height={68} fill={color} {...stroke} />;
    case 'rect':
      return <Rect x={6} y={28} width={88} height={44} fill={color} {...stroke} />;
    case 'rtri':
      // 直角三角形：直角在左下（旋转后 4 个方向都不同）
      return <Polygon points="14,14 14,86 86,86" fill={color} {...stroke} />;
    case 'house':
      // 小房子形：下面正方形 + 上面三角形
      return <Polygon points="50,8 88,44 88,90 12,90 12,44" fill={color} {...stroke} />;
  }
}

export function ShapeFigure({
  shape,
  color,
  rotation = 0,
  size = 72,
  dashed,
}: {
  shape: ShapeKind;
  color: string;
  rotation?: number;
  size?: number;
  /** 虚线影子（旋转题的目标） */
  dashed?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={SHAPE_NAME[shape]}>
      <G rotation={rotation} origin="50, 50" opacity={dashed ? 0.5 : 1}>
        {dashed ? (
          <G>{React.cloneElement(shapeElement(shape, '#E8E2D8'), { strokeDasharray: '8,6', stroke: '#9C928A' })}</G>
        ) : (
          shapeElement(shape, color)
        )}
      </G>
    </Svg>
  );
}

export const SHAPE_NAME: Record<ShapeKind, string> = {
  circle: '圆',
  triangle: '三角形',
  square: '正方形',
  rect: '长方形',
  rtri: '三角形',
  house: '小房子形',
};

/** 钟面：时针短而粗，分针长而细；角度由时间计算，保证两针关系正确 */
export function ClockFace({
  hour,
  minute = 0,
  size = 180,
  highlight,
}: {
  hour: number;
  minute?: number;
  size?: number;
  highlight?: boolean;
}) {
  const hourAngle = ((hour % 12) + minute / 60) * 30; // 每小时 30°，分针走动时时针也跟着走
  const minuteAngle = minute * 6; // 每分钟 6°
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      accessibilityLabel={`钟面 ${hour % 12 === 0 ? 12 : hour % 12}时${minute ? `${minute}分` : ''}`}
    >
      <Circle cx={100} cy={100} r={94} fill="#FFFDF6" stroke={highlight ? colors.correct : '#3A2E2A'} strokeWidth={6} />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 * Math.PI) / 180;
        const long = i % 5 === 0;
        const r1 = long ? 78 : 84;
        return (
          <Line
            key={i}
            x1={100 + r1 * Math.sin(a)}
            y1={100 - r1 * Math.cos(a)}
            x2={100 + 90 * Math.sin(a)}
            y2={100 - 90 * Math.cos(a)}
            stroke="#3A2E2A"
            strokeWidth={long ? 3 : 1}
          />
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const a = (n * 30 * Math.PI) / 180;
        return (
          <SvgText
            key={n}
            x={100 + 64 * Math.sin(a)}
            y={100 - 64 * Math.cos(a) + 7}
            fontSize={20}
            fontWeight="bold"
            fill="#3A2E2A"
            textAnchor="middle"
          >
            {n}
          </SvgText>
        );
      })}
      {/* 时针 */}
      <Line
        x1={100}
        y1={100}
        x2={100 + 42 * Math.sin((hourAngle * Math.PI) / 180)}
        y2={100 - 42 * Math.cos((hourAngle * Math.PI) / 180)}
        stroke="#E8505B"
        strokeWidth={9}
        strokeLinecap="round"
      />
      {/* 分针 */}
      <Line
        x1={100}
        y1={100}
        x2={100 + 70 * Math.sin((minuteAngle * Math.PI) / 180)}
        y2={100 - 70 * Math.cos((minuteAngle * Math.PI) / 180)}
        stroke="#4D9DE0"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Circle cx={100} cy={100} r={7} fill="#3A2E2A" />
    </Svg>
  );
}

export function FigureView({ figure, size }: { figure: Figure; size?: number }) {
  if (figure.type === 'clock')
    return <ClockFace hour={figure.hour} minute={figure.minute} size={size ?? figure.size ?? 120} />;
  if (figure.type === 'puzzle') return <PuzzleView puzzle={figure.puzzle} alt={figure.alt} />;
  return (
    <ShapeFigure
      shape={figure.shape}
      color={figure.color}
      rotation={figure.rotation}
      size={size ?? figure.size ?? 72}
    />
  );
}

/** 统一的配图显示：有 figure 画图形，否则显示表情符号 */
export function VisualView({ visual, size = 52, figureSize }: { visual: Visual; size?: number; figureSize?: number }) {
  if (visual.figure) {
    const n = visual.count ?? 1;
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {Array.from({ length: n }, (_, i) => (
          <FigureView key={i} figure={visual.figure!} size={figureSize} />
        ))}
      </View>
    );
  }
  return <Text style={{ fontSize: size, textAlign: 'center' }}>{visual.emoji.repeat(visual.count ?? 1)}</Text>;
}
