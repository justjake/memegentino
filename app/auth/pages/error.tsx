import { useRouter, BlitzPage, Link, Routes } from "blitz"
import Layout from "app/core/layouts/Layout"
import React from "react"

const AuthError: BlitzPage = () => {
  const router = useRouter()

  return (
    <div>
      <h1>Auth Error</h1>
      <pre>
        <code>{router.query.authError}</code>
      </pre>
      <Link href="/api/auth/notion">Try again</Link>
    </div>
  )
}

AuthError.getLayout = (page) => <Layout title="Auth Error">{page}</Layout>

export default AuthError
