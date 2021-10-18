import logout from "app/auth/mutations/logout"
import { DatabasePicker } from "app/core/components/DatabasePicker"
import { ErrorBoundary } from "app/core/components/ErrorBoundary"
import { MemeTemplateGallery } from "app/core/components/MemeTemplateGallery"
import { Spinner } from "app/core/components/Spinner"
import { WorkspacePicker, WorkspaceValue } from "app/core/components/WorkspacePicker"
import { useCurrentUser } from "app/core/hooks/useCurrentUser"
import Layout, { ActionRow } from "app/core/layouts/Layout"
import { BlitzPage, Link, Routes, useMutation } from "blitz"
import { DatabaseValue } from "integrations/notion"
import React, { Suspense, useCallback, useEffect, useState } from "react"

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

const Home: BlitzPage = () => {
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
      <ActionRow
        left={
          <div>
            {currentUser.name}
            <br />
            {currentUser.email}
          </div>
        }
        right={
          <div>
            <Link href={Routes.ListMemes()}>
              <a className="button small">Your Memes</a>
            </Link>
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
        }
      />
      {workspace && (
        <div className="row">
          <ErrorBoundary message="Error loading workspaces">
            <Suspense fallback={<Spinner alt="Loading workspaces..." fullWidth />}>
              <WorkspacePicker
                onChange={setWorkspace}
                value={workspace}
                workspaces={currentUser.notionOAuthTokens}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}
      {workspace && (
        <div className="row">
          <ErrorBoundary message="Error loading databases">
            <Suspense fallback={<Spinner alt="Loading workspaces..." fullWidth />}>
              <DatabasePicker
                key={workspace.bot_id}
                workspace={workspace}
                value={database}
                onChange={setDatabase}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}

      {database && workspace && (
        <div className="row">
          <ErrorBoundary message="Error loading rows from database">
            <Suspense fallback={<Spinner alt="Loading memes..." fullWidth />}>
              <MemeTemplateGallery key={database.id} database={database} workspace={workspace} />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}
      <style jsx>{`
        .row {
          display: flex;
          flex: 1;
          justify-content: space-between;
          margin: 12px 0;
        }
      `}</style>
    </>
  )
}

Home.suppressFirstRenderFlicker = true
Home.getLayout = (page) => <Layout title="Memegentino">{page}</Layout>

export default Home
