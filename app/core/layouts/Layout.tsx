import { ReactNode } from "react"
import { Head } from "blitz"

type LayoutProps = {
  title?: string
  children: ReactNode
}

const Layout = ({ title, children }: LayoutProps) => {
  return (
    <>
      <Head>
        <title>{title || "memegentino"}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container">
        <main>{children}</main>

        <style jsx global>{`
          html,
          body {
            padding: 0;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu,
              Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
          }

          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            box-sizing: border-box;
          }

          .container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          @media screen and (min-height: 800px) {
            .container {
              justify-content: start;
            }
          }

          main {
            padding: 5rem 12px;
            min-width: 512px;
            display: flex;
            max-width: 1024px;
            flex-direction: column;
            min-height: 50vh;
          }

          .buttons {
            display: grid;
            grid-auto-flow: column;
            grid-gap: 0.5rem;
          }
          .button {
            font-family: inherit;
            font-size: 1rem;
            background-color: #eee;
            border-radius: 2px;
            padding: 1rem 2rem;
            color: inherit;
            text-align: center;
            border: none;
            font-weight: normal;
            text-decoration: none;
            cursor: default;
          }

          .button + .button {
            margin-left: 4px;
          }

          .button.small {
            padding: 0.5rem 1rem;
          }

          .button:hover {
            background-color: rgba(0, 0, 0, 0.1);
          }

          pre {
            background: #fafafa;
            border-radius: 5px;
            padding: 0.75rem;
            text-align: center;
          }
          code {
            font-size: 0.9rem;
            font-family: Menlo, Monaco, Lucida Console, Liberation Mono, DejaVu Sans Mono,
              Bitstream Vera Sans Mono, Courier New, monospace;
          }
        `}</style>
      </div>
    </>
  )
}

export default Layout
