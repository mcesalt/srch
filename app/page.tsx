"use client"

import { useEffect, useState } from "react"

import { PerkTable } from "@/components/perk-table"
import { WeaponTable } from "@/components/weapon-table"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SearchTab = "perks" | "weapons"

export default function IndexPage() {
  const [tab, setTab] = useState<SearchTab>("perks")

  const titles = [
    "YanisPerks",
    "Discord: @yanbxr",
    "Yanis made this!",
    "yanischeats.cc",
  ]

  useEffect(() => {
    let titleIndex = 0

    const updatePageTitle = () => {
      document.title = titles[titleIndex]
      titleIndex = (titleIndex + 1) % titles.length
    }

    updatePageTitle()
    const titleUpdateInterval = setInterval(updatePageTitle, 5000)

    return () => clearInterval(titleUpdateInterval)
  }, [])

  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          For all my YanisPasters <br className="hidden sm:inline" />
        </h1>
        <p className="max-w-[1000px] text-lg text-muted-foreground">
          Fast perk and weapon index searcher for Destiny 2, built with React
          and Next.js.
        </p>
      </div>

      <div className="flex w-full max-w-[980px] gap-2">
        <Button
          variant={tab === "perks" ? "default" : "outline"}
          onClick={() => setTab("perks")}
          className={cn(tab === "perks" && "pointer-events-none")}
        >
          Perks
        </Button>
        <Button
          variant={tab === "weapons" ? "default" : "outline"}
          onClick={() => setTab("weapons")}
          className={cn(tab === "weapons" && "pointer-events-none")}
        >
          Weapons
        </Button>
      </div>

      {tab === "perks" ? (
        <PerkTable />
      ) : (
        <WeaponTable active={tab === "weapons"} />
      )}
    </section>
  )
}
