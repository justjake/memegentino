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

      {database && workspace && (
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
    <Suspense fallback="Loading...">
      <UserInfo />
    </Suspense>
  )
}

Home.suppressFirstRenderFlicker = true
Home.getLayout = (page) => <Layout title="Home">{page}</Layout>

export default Home
