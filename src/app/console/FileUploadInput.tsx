"use client"
import { exifCutterFromFormData } from "@/images/images"
import { useState, useTransition } from "react"

export const FileUploadInputForm = () => {
  const [fileName, setFileName] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()

  const upload = (formData: FormData) => {
    startTransition(async () => {
      const fileName = await exifCutterFromFormData(formData)
      setFileName(`https://cdn.sh1ma.dev/${fileName}`)
    })
  }

  return (
    <>
      <form action={upload}>
        <input type="file" name="file" />
        <button
          type="submit"
          className="bg-white px-btn-x py-btn-y text-primary-light"
        >
          Upload
        </button>
      </form>
      {isPending ? "送信中" : fileName && <p>{fileName}</p>}
    </>
  )
}
