const API_KEY = "e386b2d1848a40e389f2fc5b9740c741"

type ManifestPaths = Record<string, string>

let manifestPathsPromise: Promise<ManifestPaths> | null = null
const definitionCache = new Map<string, Promise<Record<string, unknown>>>()

async function getManifestPaths(): Promise<ManifestPaths> {
  if (!manifestPathsPromise) {
    manifestPathsPromise = fetch(
      "https://www.bungie.net/Platform/Destiny2/Manifest/",
      {
        headers: { "X-API-Key": API_KEY },
      }
    )
      .then((response) => response.json())
      .then((data) => data.Response.jsonWorldComponentContentPaths.en)
  }

  return manifestPathsPromise
}

async function fetchDefinitionTable(
  tableName: string
): Promise<Record<string, unknown>> {
  if (!definitionCache.has(tableName)) {
    definitionCache.set(
      tableName,
      getManifestPaths().then(async (paths) => {
        const response = await fetch(`https://www.bungie.net${paths[tableName]}`)
        return response.json()
      })
    )
  }

  return definitionCache.get(tableName)!
}

export interface ManifestEntry {
  hash: number
  index: number
  displayProperties: {
    name: string
    icon: string
    description: string
  }
}

export interface WeaponEntry extends ManifestEntry {
  patternHash: number
  itemTypeDisplayName?: string
}

interface InventoryItemDefinition {
  hash?: number
  index?: number
  itemType?: number
  redacted?: boolean
  itemTypeDisplayName?: string
  displayProperties?: {
    name?: string
    icon?: string
    description?: string
  }
  translationBlock?: {
    weaponPatternHash?: number
  }
}

interface PatternDefinition {
  index?: number
  redacted?: boolean
}

const WEAPON_ITEM_TYPE = 3

export async function getPerkDefinitions(): Promise<Record<string, unknown>> {
  return fetchDefinitionTable("DestinySandboxPerkDefinition")
}

export async function buildWeaponEntries(): Promise<WeaponEntry[]> {
  const [items, patterns] = await Promise.all([
    fetchDefinitionTable("DestinyInventoryItemDefinition"),
    fetchDefinitionTable("DestinySandboxPatternDefinition"),
  ])

  const patternByHash = new Map<number, number>()
  for (const [hash, rawPattern] of Object.entries(patterns)) {
    const pattern = rawPattern as PatternDefinition
    if (pattern.redacted || pattern.index === undefined) continue
    patternByHash.set(Number(hash), pattern.index)
  }

  const weapons: WeaponEntry[] = []

  for (const [hash, rawItem] of Object.entries(items)) {
    const item = rawItem as InventoryItemDefinition
    if (item.itemType !== WEAPON_ITEM_TYPE) continue
    if (item.redacted) continue
    if (!item.displayProperties?.name) continue

    const patternHash = item.translationBlock?.weaponPatternHash
    if (!patternHash) continue

    const index = patternByHash.get(patternHash)
    if (index === undefined) continue

    weapons.push({
      hash: Number(hash),
      patternHash,
      index,
      itemTypeDisplayName: item.itemTypeDisplayName,
      displayProperties: {
        name: item.displayProperties.name,
        icon: item.displayProperties.icon || "",
        description: item.displayProperties.description || "",
      },
    })
  }

  return weapons.sort((a, b) => a.index - b.index)
}
