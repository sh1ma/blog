"use server"

export const exifCutterFromFormData = async (formData: FormData) => {
  const exifCutted = await fetch(process.env.EXIFCUTTER_URL, {
    method: "POST",
    body: formData.get("file"),
  })

  const result = await exifCutted.clone().arrayBuffer()

  const encoder = new TextEncoder()
  const blobStr = new Uint8Array(result).toString()
  const encoded = encoder.encode(blobStr)
  const key = await crypto.subtle.digest("SHA-256", encoded)
  const keyArray = Array.from(new Uint8Array(key))
  const keyStr = keyArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

  await putObject(`${keyStr.toString()}.webp`, result)

  return keyStr
}

export const putObject = async (key: string, file: ArrayBuffer) => {
  const CDN = process.env.CDN
  await CDN.put(key, file, {
    httpMetadata: {
      contentType: "image/webp",
    },
  })

  return
}
