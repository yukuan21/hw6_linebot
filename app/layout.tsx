import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Line Bot 系統',
  description: '智慧聊天機器人後端系統',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}




