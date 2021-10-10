import { createContext, HTMLAttributes, ReactNode, useMemo, useState } from "react"
import { PickerCheck, PickerRow, RecordIcon } from "./RecordIcon"

const WorkspaceContext = createContext<WorkspaceValue | undefined>(undefined)
WorkspaceContext.displayName = "Workspace"

export interface WorkspaceValue {
  workspace_id: string
  workspace_name: string | null
  workspace_icon: string | null
  bot_id: string
}

interface WorkspacePickerProps {
  value: WorkspaceValue
  onChange: (newValue: WorkspaceValue) => void
  workspaces: WorkspaceValue[]
}

interface WorkspaceRowProps extends HTMLAttributes<HTMLDivElement> {
  workspace: WorkspaceValue
  active: boolean
  right?: ReactNode
}

export function WorkspaceRow(props: WorkspaceRowProps) {
  const { workspace, ...restProps } = props

  return (
    <PickerRow
      {...restProps}
      body={workspace.workspace_name}
      left={
        workspace.workspace_icon && (
          <RecordIcon icon={workspace.workspace_icon} alt="workspace icon" width={24} />
        )
      }
    />
  )
}

export function WorkspacePicker(props: WorkspacePickerProps) {
  const { onChange, workspaces, value } = props

  const [open, setOpen] = useState(false)
  if (workspaces.length === 1) {
    return <WorkspaceRow workspace={value} active={false} />
  }

  return (
    <>
      {!open && (
        <div className="menu">
          <WorkspaceRow
            onClick={() => setOpen(true)}
            workspace={value}
            right={"WS"}
            active={false}
          />
        </div>
      )}

      {open && (
        <div className="menu open">
          {workspaces.flatMap((ws, i, array) => {
            const last = i === array.length - 1
            const active = ws.bot_id === value.bot_id
            return [
              <WorkspaceRow
                key={ws.bot_id}
                workspace={ws}
                onClick={() => {
                  setOpen(false)
                  onChange(ws)
                }}
                active={active}
                right={active && <PickerCheck />}
              />,
              !last && <div key={`${ws.bot_id} spacer`} className="space" />,
            ]
          })}
        </div>
      )}
      <style jsx>{`
        .menu {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 4px;
          border: 1px solid #eee;
          border-radius: 2px;
        }

        .menu.open {
          box-shadow: 0px 2px 15px rgba(0, 0, 0, 0.2);
        }

        .space {
          height: 4px;
        }
      `}</style>
    </>
  )
}
