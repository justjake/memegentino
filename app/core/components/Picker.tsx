import { ReactNode } from "react"

interface FilterPicker<T> {
  filter: string
  onFilterChange: (newValue: string) => void
  value: T | undefined
  values: T[]
  renderValue: (value: T) => ReactNode
}
