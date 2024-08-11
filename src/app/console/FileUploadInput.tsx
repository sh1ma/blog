"use client"
import { exifCutterFromFormData } from "@/images/images"
import { useState, useTransition } from "react"

export const FileUploadInputForm = () => {
  const [fileName, setFileName] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()

  const upload = (formData: FormData) => {
    startTransition(async () => {
      const keyStr = await exifCutterFromFormData(formData)

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
