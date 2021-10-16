import { ReactNode, Suspense } from "react"
import { Head } from "blitz"
import { Spinner } from "../components/Spinner"

type LayoutProps = {
  title?: string
  children: ReactNode
}

const Layout = ({ title, children }: LayoutProps) => {
  return (
    <>
      <Head>
        <title>{title || "Memegentino"}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="frame" />

      <div className="container">
        <Suspense
          fallback={
            <div className="loading">
              <Spinner fullWidth alt={`Loading "${title}"`} />
            </div>
          }
        >
          <main>{children}</main>
        </Suspense>

        <style jsx global>{`
          html,
          body {
            padding: 0;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu,
              Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
            background: white;
          }

          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            box-sizing: border-box;
          }

          .frame {
            position: fixed;
            width: 100vw;
            height: 100vh;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            pointer-events: none;
            border: 1px solid #eee;
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

          .loading {
            min-height: 50vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          main {
            padding: 8px 12px;
            min-width: 512px;
            display: flex;
            width: 800px;
            max-width: 100%;
            flex-direction: column;
          }

          .buttons {
            display: grid;
            grid-auto-flow: column;
            grid-gap: 0.5rem;
          }
          .button {
            font-family: inherit;
            font-size: 1rem;
            background-color: rgba(30, 30, 30, 0.1);
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

          .button:disabled,
          .button:disabled:hover {
            background: transparent;
            border: 1px solid #eee;
          }

          .button:hover {
            background-color: rgba(0, 0, 0, 0.15);
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

export function ActionRow(props: { left?: ReactNode; right?: ReactNode }) {
  return (
    <div>
      {props.left}

      <div className="spacer" />

      {props.right}
      <style jsx>{`
        div {
          display: flex;
          flex: 1;
          margin: 12px 0;
          align-items: center;
        }

        .spacer {
          flex-grow: 1;
        }
      `}</style>
    </div>
  )
}

export default Layout
