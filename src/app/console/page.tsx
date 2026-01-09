import { FileUploadInputForm } from "./FileUploadInput"

const ConsolePage = async () => {
  return (
    <div className="max-w-7xl px-page-x">
      <p>画像アップロード</p>
      <FileUploadInputForm />
    </div>
  )
}

export default ConsolePage
