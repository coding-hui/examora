import { useIntl } from '@umijs/max';
import {
  curveMonotoneX,
  area as d3Area,
  line as d3Line,
  scaleLinear,
  scalePoint,
} from 'd3';

export type TrendPoint = {
  label: string;
  value: number;
};

export type TrendSeries = {
  key: string;
  label: string;
  color: string;
  data: TrendPoint[];
  dashed?: boolean;
  showArea?: boolean;
};

type TrendLineChartProps = {
  ariaLabel: string;
  data?: TrendPoint[];
  series?: TrendSeries[];
  color?: string;
  height?: number;
  showArea?: boolean;
  showDots?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  compact?: boolean;
};

const chartWidth = 640;

const toSeries = ({
  data,
  series,
  color = '#18181b',
  showArea = false,
}: Pick<
  TrendLineChartProps,
  'data' | 'series' | 'color' | 'showArea'
>): TrendSeries[] => {
  if (series?.length) {
    return series;
  }

  return [
    {
      key: 'trend',
      label: 'Trend',
      color,
      data: data ?? [],
      showArea,
    },
  ];
};

const getChartValues = (series: TrendSeries[]) =>
  series.flatMap((item) => item.data.map((point) => point.value));

const getLabels = (series: TrendSeries[]) => {
  const labels = new Set<string>();
  series.forEach((item) => {
    item.data.forEach((point) => {
      labels.add(point.label);
    });
  });
  return Array.from(labels);
};

const TrendLineChart: React.FC<TrendLineChartProps> = ({
  ariaLabel,
  data,
  series,
  color,
  height = 120,
  showArea = false,
  showDots = false,
  showGrid = false,
  showLegend = false,
  compact = false,
}) => {
  const intl = useIntl();
  const mergedSeries = toSeries({ data, series, color, showArea });
  const values = getChartValues(mergedSeries);
  const labels = getLabels(mergedSeries);

  if (!values.length || !labels.length) {
    return (
      <div className="trend-chart trend-chart-empty" style={{ height }}>
        <span>{intl.formatMessage({ id: 'pages.dashboard.chart.empty' })}</span>
      </div>
    );
  }

  const padding = compact
    ? { top: 6, right: 8, bottom: 8, left: 8 }
    : { top: 18, right: 20, bottom: 24, left: 28 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const yDomain =
    minValue === maxValue ? [minValue - 1, maxValue + 1] : [minValue, maxValue];
  const xScale = scalePoint<string>()
    .domain(labels)
    .range([padding.left, padding.left + innerWidth])
    .padding(labels.length > 1 ? 0.35 : 0.5);
  const yScale = scaleLinear()
    .domain(yDomain)
    .nice()
    .range([padding.top + innerHeight, padding.top]);
  const getX = (point: TrendPoint) => xScale(point.label) ?? padding.left;

  const lineGenerator = d3Line<TrendPoint>()
    .x(getX)
    .y((point) => yScale(point.value))
    .curve(curveMonotoneX);

  const areaGenerator = d3Area<TrendPoint>()
    .x(getX)
    .y0(padding.top + innerHeight)
    .y1((point) => yScale(point.value))
    .curve(curveMonotoneX);

  const gridValues = yScale.ticks(4);
  const lastLabel = labels[labels.length - 1];

  return (
    <div
      className={compact ? 'trend-chart trend-chart-compact' : 'trend-chart'}
    >
      {showLegend && (
        <div className="trend-chart-legend">
          {mergedSeries.map((item) => (
            <span key={item.key}>
              <i style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      )}
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${chartWidth} ${height}`}
        preserveAspectRatio="none"
      >
        {showGrid &&
          gridValues.map((tick) => (
            <line
              key={tick}
              className="trend-chart-grid"
              x1={padding.left}
              x2={padding.left + innerWidth}
              y1={yScale(tick)}
              y2={yScale(tick)}
            />
          ))}

        {mergedSeries.map((item) => {
          const linePath = lineGenerator(item.data);
          const areaPath = areaGenerator(item.data);

          return (
            <g key={item.key}>
              {item.showArea && areaPath && (
                <path
                  className="trend-chart-area"
                  d={areaPath}
                  fill={item.color}
                />
              )}
              {linePath && (
                <path
                  className="trend-chart-line"
                  d={linePath}
                  stroke={item.color}
                  strokeDasharray={item.dashed ? '5 5' : undefined}
                />
              )}
              {showDots &&
                item.data.map((point) => (
                  <circle
                    key={`${item.key}-${point.label}`}
                    className="trend-chart-dot"
                    cx={getX(point)}
                    cy={yScale(point.value)}
                    r={compact ? 2.2 : 3}
                    fill={item.color}
                  />
                ))}
            </g>
          );
        })}

        {!compact && (
          <g className="trend-chart-axis">
            <text x={padding.left} y={height - 6}>
              {labels[0]}
            </text>
            <text x={padding.left + innerWidth} y={height - 6} textAnchor="end">
              {lastLabel}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default TrendLineChart;
