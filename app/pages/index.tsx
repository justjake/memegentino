import React, { Suspense, useCallback, useEffect, useState } from "react"
import { Image, Link, BlitzPage, useMutation, Routes } from "blitz"
import Layout from "app/core/layouts/Layout"
import { useCurrentUser } from "app/core/hooks/useCurrentUser"
import logout from "app/auth/mutations/logout"
import logo from "public/logo.png"
import { Workspace } from "app/core/components/Workspace"
import { WorkspacePicker, WorkspaceValue } from "app/core/components/WorkspacePicker"
import { GetDatabaseResponse } from "@notionhq/client/build/src/api-endpoints"
import { useQuery } from "react-query"
import { notionClientProxy } from "integrations/notion"
import { DatabasePicker, DatabaseValue } from "app/core/components/DatabasePicker"
import { MemeTemplateGallery } from "app/core/components/MemeTemplateGallery"

/*
 * This file is just for a pleasant getting started page for your new app.
 * You can delete everything in here and start from scratch if you like.
 */

interface EmptyState {
  workspace?: undefined
  database?: undefined
}
interface WithWorkspace {
  workspace: WorkspaceValue
  database?: undefined
}

interface WithDatabase {
  workspace: WorkspaceValue
  database: DatabaseValue
}

type AppState = EmptyState | WithWorkspace | WithDatabase

const UserInfo = () => {
  const currentUser = useCurrentUser()
  const [logoutMutation] = useMutation(logout)
  const [state, setState] = useState<AppState>({})

  const setWorkspace = useCallback((workspace: WorkspaceValue) => {
    setState((currentState) => {
      if (currentState.workspace?.bot_id === workspace.bot_id) {
        return currentState
      }

      return {
        workspace,
      }
    })
  }, [])

  const setDatabase = useCallback((database: DatabaseValue) => {
    setState((currentState) => {
      if (currentState.workspace) {
        return {
          ...currentState,
          database,
        }
      }

      return currentState
    })
  }, [])

  useEffect(() => {
    if (currentUser && !state.workspace) {
      const firstWorkspace = currentUser.notionOAuthTokens[0]
      if (firstWorkspace) {
        setWorkspace(firstWorkspace)
      }
    }
  }, [state.workspace, currentUser])

  if (!currentUser) {
    return (
      <>
        <a href="/api/auth/notion" className="button small">
          Log in with Notion
        </a>
      </>
    )
  }

  const { workspace, database } = state

  return (
    <>
      <div className="row">
        <div>
          {currentUser.name}
          <br />
          {currentUser.email}
        </div>
        <div>
          <a href="/api/auth/notion" className="button small">
            Add Workspace
          </a>
          <button
            className="button small"
            onClick={async () => {
              await logoutMutation()
            }}
          >
            Logout
          </button>
        </div>
      </div>
      {workspace && (
        <div className="row">
          <WorkspacePicker
            onChange={setWorkspace}
            value={workspace}
            workspaces={currentUser.notionOAuthTokens}
          />
        </div>
      )}
      {workspace && (
        <div className="row">
          <DatabasePicker
            key={workspace.bot_id}
            workspace={workspace}
            value={database}
            onChange={setDatabase}
          />
        </div>
      )}

      {database && (
        <div className="row">
          <MemeTemplateGallery key={database.id} database={database} workspace={workspace} />
        </div>
      )}
      <style jsx>{`
        .row {
          display: flex;
          justify-content: space-between;
          width: 50vw;
          min-width: 480px;
          margin: 14px 0;
        }
      `}</style>
    </>
  )
}

const Home: BlitzPage = () => {
  return (
    <div className="container">
      <main>
        <Suspense fallback="Loading...">
          <UserInfo />
        </Suspense>
      </main>

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

        main {
          padding: 5rem 0;
          min-width: 512px;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 50vh;
        }

        main p {
          font-size: 1.2rem;
        }

        p {
          text-align: center;
        }

        footer {
          width: 100%;
          height: 60px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #45009d;
        }

        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        footer a {
          color: #f4f4f4;
          text-decoration: none;
        }

        .logo {
          margin-bottom: 2rem;
        }

        .logo img {
          width: 300px;
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

        .button-outline {
          border: 2px solid #6700eb;
          padding: 1rem 2rem;
          color: #6700eb;
          text-align: center;
        }

        .button-outline:hover {
          border-color: #45009d;
          color: #45009d;
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

        .grid {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;

          max-width: 800px;
          margin-top: 3rem;
        }

        @media (max-width: 600px) {
          .grid {
            width: 100%;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

Home.suppressFirstRenderFlicker = true
Home.getLayout = (page) => <Layout title="Home">{page}</Layout>

export default Home
