"use server"

export const exifCutterFromFormData = async (formData: FormData) => {
  const exifCutted = await fetch(process.env.EXIFCUTTER_URL, {
    method: "POST",
    body: formData.get("file"),
  })

  console.log(exifCutted.status)

  const result = await exifCutted.text()

  return result
}

export const putObject = async (key: string, file: ArrayBuffer) => {
  const CDN = process.env.CDN
  const obj = await CDN.put(key, file)
  console.log(obj)
  return "ok"
}
