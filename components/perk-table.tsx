"use client"

import { useEffect, useState } from "react"

import { getPerkDefinitions, type ManifestEntry } from "@/lib/manifest"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function isValidPerk(perk: ManifestEntry) {
  return (
    perk.displayProperties.name.length > 0 &&
    perk.displayProperties.icon.length > 0
  )
}

export function PerkTable() {
  const [perks, setPerks] = useState<ManifestEntry[]>([])
  const [filteredPerks, setFilteredPerks] = useState<ManifestEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(100)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const data = await getPerkDefinitions()
        const sortedPerks = Object.entries(data)
          .map(([hash, perk]) => {
            const entry = perk as Omit<ManifestEntry, "hash">
            return {
              hash: Number(hash),
              index: entry.index,
              displayProperties: entry.displayProperties,
            }
          })
          .filter((perk) => isValidPerk(perk))
          .sort((a, b) => a.index - b.index)

        if (!cancelled) {
          setPerks(sortedPerks)
          setFilteredPerks(sortedPerks)
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load perks from the Bungie manifest.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [])

  function handleFilterChange(event: React.ChangeEvent<HTMLInputElement>) {
    const query = event.target.value.toLowerCase()

    const filteredData = perks.filter(
      (perk) =>
        perk.displayProperties.name.toLowerCase().includes(query) ||
        perk.index.toString().includes(query) ||
        perk.displayProperties.description.toLowerCase().includes(query)
    )

    setFilteredPerks(filteredData)
    setVisibleCount(100)
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading perks...</p>
  }

  if (error) {
    return <p className="text-destructive">{error}</p>
  }

  return (
    <section>
      <Input
        onChange={handleFilterChange}
        placeholder="Filter by name, index, or description"
        className="mb-10"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Icon</TableHead>
            <TableHead className="w-[100px]">Index</TableHead>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPerks.slice(0, visibleCount).map((perk) => (
            <TableRow key={perk.hash}>
              <TableCell>
                {perk.displayProperties.icon && (
                  <img
                    src={`https://www.bungie.net/${perk.displayProperties.icon}`}
                    alt={`${perk.displayProperties.name} icon`}
                    className="h-8 w-8"
                  />
                )}
              </TableCell>
              <TableCell className="font-medium">{perk.index}</TableCell>
              <TableCell>{perk.displayProperties.name}</TableCell>
              <TableCell>{perk.displayProperties.description || "N/A"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {visibleCount < filteredPerks.length && (
        <div className="mt-4 flex justify-center">
          <Button onClick={() => setVisibleCount((count) => count + 100)}>
            Load more
          </Button>
        </div>
      )}
    </section>
  )
}
