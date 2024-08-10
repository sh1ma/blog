import { FileUploadInputForm } from "./FileUploadInput"

const ConsolePage = async () => {
  return (
    <div className="max-w-7xl px-4">
      <p>画像アップロード</p>
      <FileUploadInputForm />
    </div>
  )
}

export default ConsolePage
