"use client"

import CytoscapeComponent from "react-cytoscapejs"
import ExportedScrapboxJson from "./talka-memo.json"
import cytoscape from "cytoscape"
import fcose from "cytoscape-fcose"

cytoscape.use(fcose)

type ScrapboxPage = {
  title: string
  id: string
  lines: string[]
}

type PageLink = {
  from: string
  toLabel: string
}

const resolveLines = (page: ScrapboxPage): PageLink[] => {
  const links: PageLink[] = []
  page.lines.forEach((line) => {
    const matches = line.match(/\[.*?\]/g)
    if (matches) {
      matches.forEach((match) => {
        const to = match.slice(1, -1)
        links.push({ from: page.id, toLabel: to })
      })
    }
  })
  return links
}

const exported = ExportedScrapboxJson as { pages: ScrapboxPage[] }

const pagelinks = exported.pages.reduce((acc, page) => {
  const links = resolveLines(page)
  acc.set(page.id, links)
  return acc
}, new Map<string, PageLink[]>())

const edges = Array.from(pagelinks.entries()).flatMap(([from, links]) => {
  return links.reduce(
    (acc, link) => {
      const to = exported.pages.find((page) => page.title === link.toLabel)
      if (to) {
        acc.push({ from, to: to.id })
      }
      return acc
    },
    [] as { from: string; to: string }[],
  )
})

const edgesToData = (edges: { from: string; to: string }[]) => {
  return edges.map((edge) => {
    return {
      data: { source: edge.from, target: edge.to },
    }
  })
}

const elements = exported.pages.reduce((acc, e) => {
  if (!edges.some((edge) => edge.from === e.id || edge.to === e.id)) {
    return acc
  }
  acc.push({
    data: { id: e.id, label: e.title },
    style: {
      color: "white",
    },
  } satisfies cytoscape.ElementDefinition)
  return acc
}, [] as cytoscape.ElementDefinition[])

const edgesData = edgesToData(edges)

const data = [...elements, ...edgesData]

export const ScprapboxGraph = () => {
  return (
    <CytoscapeComponent
      elements={data}
      layout={{ name: "concentric" }}
      style={{ width: "100%", height: "600px", backgroundColor: "#374151" }}
    />
  )
}
