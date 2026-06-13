const API_KEY = "e386b2d1848a40e389f2fc5b9740c741"

type ManifestPaths = Record<string, string>
type DefinitionTable = Record<string, unknown>

let manifestPathsPromise: Promise<ManifestPaths> | null = null
const definitionCache = new Map<string, Promise<DefinitionTable>>()

async function fetchLivePerkDefinitions(): Promise<DefinitionTable> {
  const manifestResponse = await fetch(
    "https://www.bungie.net/Platform/Destiny2/Manifest/",
    {
      headers: { "X-API-Key": API_KEY },
    }
  )

  if (!manifestResponse.ok) {
    throw new Error(`Manifest request failed: ${manifestResponse.status}`)
  }

  const manifest = await manifestResponse.json()
  const perkPath =
    manifest?.Response?.jsonWorldComponentContentPaths?.en
      ?.DestinySandboxPerkDefinition

  if (!perkPath) {
    throw new Error("DestinySandboxPerkDefinition path missing from manifest")
  }

  const perksResponse = await fetch(`https://www.bungie.net${perkPath}`)

  if (!perksResponse.ok) {
    throw new Error(`Perk manifest request failed: ${perksResponse.status}`)
  }

  const perks = await perksResponse.json()

  if (!perks || typeof perks !== "object") {
    throw new Error("Invalid perk manifest response")
  }

  return perks as DefinitionTable
}

export async function loadPerkDefinitions(): Promise<DefinitionTable> {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""

  try {
    const response = await fetch(`${basePath}/perks.json`)

    if (response.ok) {
      const perks = await response.json()

      if (perks && typeof perks === "object") {
        return perks as DefinitionTable
      }
    }
  } catch {
    // Fall back to live Bungie fetch for local dev.
  }

  return fetchLivePerkDefinitions()
}

async function getManifestPaths(): Promise<ManifestPaths> {
  if (!manifestPathsPromise) {
    manifestPathsPromise = fetch(
      "https://www.bungie.net/Platform/Destiny2/Manifest/",
      {
        headers: { "X-API-Key": API_KEY },
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Manifest request failed: ${response.status}`)
        }

        const data = await response.json()
        const paths = data?.Response?.jsonWorldComponentContentPaths?.en

        if (!paths) {
          throw new Error("Manifest paths missing from Bungie response")
        }

        return paths as ManifestPaths
      })
      .catch((error) => {
        manifestPathsPromise = null
        throw error
      })
  }

  return manifestPathsPromise
}

async function fetchDefinitionTable(
  tableName: string
): Promise<DefinitionTable> {
  if (definitionCache.has(tableName)) {
    return definitionCache.get(tableName)!
  }

  const promise = getManifestPaths()
    .then(async (paths) => {
      const path = paths[tableName]

      if (!path) {
        throw new Error(`Missing manifest path for ${tableName}`)
      }

      const response = await fetch(`https://www.bungie.net${path}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch ${tableName}: ${response.status}`)
      }

      const data = await response.json()

      if (!data || typeof data !== "object") {
        throw new Error(`Invalid manifest data for ${tableName}`)
      }

      return data as DefinitionTable
    })
    .catch((error) => {
      definitionCache.delete(tableName)
      throw error
    })

  definitionCache.set(tableName, promise)
  return promise
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

interface PerkDefinition {
  index?: number
  displayProperties?: {
    name?: string
    icon?: string
    description?: string
  }
}

interface InventoryItemDefinition {
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

export async function buildPerkEntries(): Promise<ManifestEntry[]> {
  const data = await loadPerkDefinitions()
  const perks: ManifestEntry[] = []

  for (const [hash, rawPerk] of Object.entries(data)) {
    const perk = rawPerk as PerkDefinition
    if (!perk.displayProperties?.name || !perk.displayProperties?.icon) continue
    if (perk.index === undefined) continue

    perks.push({
      hash: Number(hash),
      index: perk.index,
      displayProperties: {
        name: perk.displayProperties.name,
        icon: perk.displayProperties.icon,
        description: perk.displayProperties.description || "",
      },
    })
  }

  return perks.sort((a, b) => a.index - b.index)
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
