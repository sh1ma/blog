import { ChevronDown } from "lucide-react"

export type TocItem = {
  id: string
  text: string
  level: 2 | 3 | 4
}

type TableOfContentsProps = {
  headings: TocItem[]
  initialOpen?: boolean
}

export const TableOfContents = ({
  headings,
  initialOpen = false,
}: TableOfContentsProps) => {
  if (!headings || headings.length === 0) {
    return null
  }

  return (
    <div className="mb-10 border-b border-gray-200 pb-6">
      <details className="group" open={initialOpen}>
        <summary className="flex cursor-pointer list-none items-center justify-between py-2 text-lg font-semibold text-text-primary transition-colors hover:text-brand-primary [&::-webkit-details-marker]:hidden">
          目次
          <ChevronDown
            className="transition-transform group-open:rotate-180"
            size={20}
          />
        </summary>

        <nav className="mt-4 pl-4 text-base leading-relaxed text-text-muted">
          <ul className="list-none space-y-2">
            {headings.map((heading) => (
              <li
                key={heading.id}
                className={
                  heading.level === 3
                    ? "pl-4"
                    : heading.level === 4
                      ? "pl-8"
                      : ""
                }
              >
                <a
                  href={`#${heading.id}`}
                  className="transition-colors hover:text-brand-primary"
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </details>
    </div>
  )
}
