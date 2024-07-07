// strategy="worker"がgaになるまで無効化する
// import Script from "next/script"

// export const GoogleAnalytics = () => {
//   return (
//     <>
//       <Script
//         async
//         strategy="worker"
//         src="https://www.googletagmanager.com/gtag/js?id=G-LZYCBK9WJY"
//       ></Script>
//       <Script id="gtag-init" async strategy="worker">
//         {`
//         window.dataLayer = window.dataLayer || [];
//         function gtag(){dataLayer.push(arguments);}
//         gtag('js', new Date());
//         gtag('config', 'G-LZYCBK9WJY');`}
//       </Script>
//     </>
//   )
// }
