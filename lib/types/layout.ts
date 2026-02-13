export interface TileConfig {
  id: string
  visible: boolean
  position: number
}

export interface PageLayout {
  tiles: TileConfig[]
}

export interface TileDefinition {
  id: string
  label: string
  icon?: string
  defaultVisible: boolean
}
