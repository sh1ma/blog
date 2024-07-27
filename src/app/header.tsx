import Link from "next/link"

export const BlogHeader = async () => {
  return (
    <header className="flex justify-center bg-primary-default text-white">
      <div className="grid h-full  w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center p-4">
        <Link href="/">
          <h1 className="text-2xl">blog.sh1ma.dev</h1>
        </Link>
      </div>
    </header>
  )
}
