// Recharts 2.x ships with React 17/18 class component types that are
// incompatible with React 19's stricter JSX type checking.
// This shim re-declares the affected exports as functional components
// so they can be used in JSX without type errors.
declare module 'recharts' {
  import type { CSSProperties, ReactNode, SVGProps } from 'react';

  type FC<P = object> = (props: P) => ReactNode;

  interface CommonProps {
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
  }

  export interface ResponsiveContainerProps extends CommonProps {
    width?: string | number;
    height?: string | number;
    minWidth?: number;
    minHeight?: number;
    aspect?: number;
    debounce?: number;
  }
  export const ResponsiveContainer: FC<ResponsiveContainerProps>;

  export interface LineChartProps extends CommonProps {
    data?: unknown[];
    width?: number;
    height?: number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    layout?: 'horizontal' | 'vertical';
  }
  export const LineChart: FC<LineChartProps>;

  export interface AreaChartProps extends CommonProps {
    data?: unknown[];
    width?: number;
    height?: number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
  }
  export const AreaChart: FC<AreaChartProps>;

  export interface BarChartProps extends CommonProps {
    data?: unknown[];
    width?: number;
    height?: number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    layout?: 'horizontal' | 'vertical';
    barSize?: number;
  }
  export const BarChart: FC<BarChartProps>;

  export interface PieChartProps extends CommonProps {
    width?: number;
    height?: number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
  }
  export const PieChart: FC<PieChartProps>;

  export interface XAxisProps extends CommonProps {
    dataKey?: string;
    tick?: boolean | object | FC<SVGProps<SVGTextElement>>;
    axisLine?: boolean | object;
    tickLine?: boolean | object;
    tickFormatter?: (value: unknown, index: number) => string;
    type?: 'number' | 'category';
    domain?: unknown[];
    hide?: boolean;
  }
  export const XAxis: FC<XAxisProps>;

  export interface YAxisProps extends CommonProps {
    dataKey?: string;
    tick?: boolean | object | FC<SVGProps<SVGTextElement>>;
    axisLine?: boolean | object;
    tickLine?: boolean | object;
    tickFormatter?: (value: unknown, index: number) => string;
    type?: 'number' | 'category';
    domain?: unknown[];
    hide?: boolean;
    width?: number;
  }
  export const YAxis: FC<YAxisProps>;

  export interface CartesianGridProps extends CommonProps {
    strokeDasharray?: string;
    vertical?: boolean;
    horizontal?: boolean;
    stroke?: string;
  }
  export const CartesianGrid: FC<CartesianGridProps>;

  export interface TooltipProps extends CommonProps {
    formatter?: (value: unknown, name?: string, props?: unknown) => unknown;
    labelFormatter?: (label: unknown) => ReactNode;
    contentStyle?: CSSProperties;
    itemStyle?: CSSProperties;
    cursor?: boolean | object;
  }
  export const Tooltip: FC<TooltipProps>;

  export interface LegendProps extends CommonProps {
    wrapperStyle?: CSSProperties;
    iconType?: string;
    iconSize?: number;
    layout?: 'horizontal' | 'vertical';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    align?: 'left' | 'center' | 'right';
  }
  export const Legend: FC<LegendProps>;

  export interface AreaProps extends CommonProps {
    type?: string;
    dataKey: string;
    stroke?: string;
    fill?: string;
    fillOpacity?: number;
    strokeWidth?: number;
    dot?: boolean | object;
    activeDot?: boolean | object;
    name?: string;
    stackId?: string;
  }
  export const Area: FC<AreaProps>;

  export interface BarProps extends CommonProps {
    dataKey: string;
    fill?: string;
    stroke?: string;
    name?: string;
    radius?: number | number[];
    stackId?: string;
    barSize?: number;
  }
  export const Bar: FC<BarProps>;

  export interface LineProps extends CommonProps {
    type?: string;
    dataKey: string;
    stroke?: string;
    strokeWidth?: number;
    dot?: boolean | object;
    activeDot?: boolean | object;
    name?: string;
  }
  export const Line: FC<LineProps>;

  export interface PieProps extends CommonProps {
    data?: unknown[];
    dataKey: string;
    nameKey?: string;
    cx?: string | number;
    cy?: string | number;
    innerRadius?: string | number;
    outerRadius?: string | number;
    fill?: string;
    stroke?: string;
    label?: boolean | object | FC<unknown>;
    labelLine?: boolean | object;
    paddingAngle?: number;
  }
  export const Pie: FC<PieProps>;

  export interface CellProps extends CommonProps {
    fill?: string;
    stroke?: string;
    key?: string;
  }
  export const Cell: FC<CellProps>;
}
