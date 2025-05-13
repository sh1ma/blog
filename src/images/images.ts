"use server"

import { getCloudflareContext } from "@opennextjs/cloudflare"

export const exifCutterFromFormData = async (formData: FormData) => {
  const fileData = formData.get("file")
  const exifCutted = await fetch(
    (await getCloudflareContext({ async: true })).env.EXIFCUTTER_URL,
    {
      method: "POST",
      body: fileData,
    },
  )

  const fileExt = fileData instanceof File ? fileData.name.split(".").pop() : ""

  const result = await exifCutted.clone().arrayBuffer()

  const encoder = new TextEncoder()
  const blobStr = new Uint8Array(result).toString()
  const encoded = encoder.encode(blobStr)
  const key = await crypto.subtle.digest("SHA-256", encoded)
  const keyArray = Array.from(new Uint8Array(key))
  const keyStr = keyArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

  const fileName = `${keyStr.toString()}.${fileExt}`

  await putObject(fileName, result)

  return fileName
}

export const putObject = async (key: string, file: ArrayBuffer) => {
  const CDN = (await getCloudflareContext({ async: true })).env.CDN
  await CDN.put(key, file)

  return
}
