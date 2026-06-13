import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const API_KEY = "e386b2d1848a40e389f2fc5b9740c741"
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.join(__dirname, "..", "public", "perks.json")

async function downloadPerks() {
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
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, JSON.stringify(perks))

  console.log(`Saved perk manifest to ${outputPath}`)
}

downloadPerks().catch((error) => {
  console.error(error)
  process.exit(1)
})
