import { motion } from 'motion/react'

type Datum = {
  label: string
  value: number
}

function getBounds(data: Datum[]) {
  const values = data.map((item) => item.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  return { min, max: max === min ? max + 1 : max }
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

  const width = 280
  const height = 120
  const { min, max } = getBounds(data)

  const points = data
    .map((item, index) => {
      const x = (index / Math.max(1, data.length - 1)) * (width - 8) + 4
      const y = height - ((item.value - min) / (max - min)) * (height - 16) - 8
      return `${x},${y}`
    })
    .join(' ')

  return (
    <motion.div
      className="chart-shell"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" preserveAspectRatio="none">
        <motion.polyline
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
          initial={{ pathLength: 0, opacity: 0.3 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
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
  color = 'linear-gradient(180deg, #2bff49, #18df34)',
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
          <motion.div
            className="bar-fill"
            style={{ height: `${Math.max(12, (item.value / max) * 100)}%`, background: color }}
            initial={{ scaleY: 0.2, opacity: 0.35 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
