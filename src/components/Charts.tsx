import { motion } from 'motion/react'

type Datum = {
  label: string
  value: number
}

function normalizeData(data: Datum[]) {
  if (data.length === 0) return []
  const values = data.map((item) => item.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(1, max - min)

  return data.map((item, index) => ({
    ...item,
    index,
    normalized: (item.value - min) / range,
  }))
}

export function LineChart({
  data,
  color = '#22f33d',
}: {
  data: Datum[]
  color?: string
}) {
  if (data.length === 0) {
    return <div className="chart-empty">No trend yet</div>
  }

  const normalized = normalizeData(data)
  const width = 300
  const height = 120

  const points = normalized
    .map((item) => {
      const x = (item.index / Math.max(1, normalized.length - 1)) * (width - 16) + 8
      const y = height - item.normalized * (height - 22) - 10
      return { x, y }
    })

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? width - 8} ${height - 2} L ${points[0]?.x ?? 8} ${height - 2} Z`

  return (
    <motion.div
      className="chart-shell"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="line-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#line-fill)" />
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.5 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
        {points.map((point, index) => (
          <circle key={`${data[index]?.label}-${index}`} cx={point.x} cy={point.y} r="2.5" fill={color} />
        ))}
      </svg>
      <div className="chart-labels">
        {data.map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
    </motion.div>
  )
}

export function BarChart({
  data,
  color = 'linear-gradient(180deg, #5bff68, #16cd30)',
}: {
  data: Datum[]
  color?: string
}) {
  if (data.length === 0) {
    return <div className="chart-empty">No volume yet</div>
  }

  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <div className="bar-chart">
      {data.map((item) => (
        <div className="bar-column" key={item.label}>
          <div className="bar-track">
            <motion.div
              className="bar-fill"
              style={{ height: `${Math.max(8, (item.value / max) * 100)}%`, background: color }}
              initial={{ scaleY: 0.2, opacity: 0.35 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function ProgressMeter({
  value,
  max,
  label,
}: {
  value: number
  max: number
  label: string
}) {
  const safeMax = Math.max(1, max)
  const ratio = Math.max(0, Math.min(1, value / safeMax))

  return (
    <div className="progress-meter">
      <div className="progress-meter-track">
        <motion.div
          className="progress-meter-fill"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(8, ratio * 100)}%` }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        />
      </div>
      <div className="progress-meter-scale">
        <span>0</span>
        <span>{label}</span>
        <span>{safeMax}</span>
      </div>
    </div>
  )
}
