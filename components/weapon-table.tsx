"use client"

import { useEffect, useState } from "react"

import { buildWeaponEntries, type WeaponEntry } from "@/lib/manifest"
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

interface WeaponTableProps {
  active: boolean
}

export function WeaponTable({ active }: WeaponTableProps) {
  const [weapons, setWeapons] = useState<WeaponEntry[]>([])
  const [filteredWeapons, setFilteredWeapons] = useState<WeaponEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(100)

  useEffect(() => {
    if (!active || loaded) return

    let cancelled = false

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const entries = await buildWeaponEntries()

        if (!cancelled) {
          setWeapons(entries)
          setFilteredWeapons(entries)
          setLoaded(true)
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load weapons from the Bungie manifest.")
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
  }, [active, loaded])

  function handleFilterChange(event: React.ChangeEvent<HTMLInputElement>) {
    const query = event.target.value.toLowerCase()

    const filteredData = weapons.filter(
      (weapon) =>
        weapon.displayProperties.name.toLowerCase().includes(query) ||
        weapon.index.toString().includes(query) ||
        weapon.itemTypeDisplayName?.toLowerCase().includes(query) ||
        weapon.displayProperties.description.toLowerCase().includes(query)
    )

    setFilteredWeapons(filteredData)
    setVisibleCount(100)
  }

  if (!active) {
    return null
  }

  if (loading) {
    return (
      <p className="text-muted-foreground">
        Loading weapons... this can take a moment.
      </p>
    )
  }

  if (error) {
    return <p className="text-destructive">{error}</p>
  }

  return (
    <section>
      <Input
        onChange={handleFilterChange}
        placeholder="Filter by weapon name or index"
        className="mb-10"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Icon</TableHead>
            <TableHead className="w-[100px]">Index</TableHead>
            <TableHead className="w-[220px]">Name</TableHead>
            <TableHead className="w-[160px]">Type</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredWeapons.slice(0, visibleCount).map((weapon) => (
            <TableRow key={weapon.hash}>
              <TableCell>
                {weapon.displayProperties.icon && (
                  <img
                    src={`https://www.bungie.net/${weapon.displayProperties.icon}`}
                    alt={`${weapon.displayProperties.name} icon`}
                    className="h-8 w-8"
                  />
                )}
              </TableCell>
              <TableCell className="font-medium">{weapon.index}</TableCell>
              <TableCell>{weapon.displayProperties.name}</TableCell>
              <TableCell>{weapon.itemTypeDisplayName || "N/A"}</TableCell>
              <TableCell>
                {weapon.displayProperties.description || "N/A"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {visibleCount < filteredWeapons.length && (
        <div className="mt-4 flex justify-center">
          <Button onClick={() => setVisibleCount((count) => count + 100)}>
            Load more
          </Button>
        </div>
      )}
    </section>
  )
}
