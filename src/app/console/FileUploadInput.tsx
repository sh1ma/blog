"use client"
import { exifCutterFromFormData, putObject } from "@/images/images"
import { useState, useTransition } from "react"

export const FileUploadInputForm = () => {
  const [fileName, setFileName] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()

  const upload = (formData: FormData) => {
    console.log("a")
    console.log(formData)
    startTransition(async () => {
      console.log("b")

      const exifCutted = await exifCutterFromFormData(formData)

      console.log("c")
      const encoder = new TextEncoder()
      const blobStr = new Uint8Array(exifCutted).toString()
      const encoded = encoder.encode(blobStr)
      const key = await crypto.subtle.digest("SHA-256", encoded)
      const keyArray = Array.from(new Uint8Array(key))
      const keyStr = keyArray
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")

      await putObject(`${keyStr}.webp`, exifCutted)
      setFileName(`https://cdn.sh1ma.dev/${keyStr}.webp`)
    })
  }

  return (
    <>
      <form action={upload}>
        <input type="file" name="file" />
        <button type="submit" className="bg-white px-4 py-2 text-primary-light">
          Upload
        </button>
      </form>
      {isPending ? "送信中" : fileName && <p>{fileName}</p>}
    </>
  )
}
