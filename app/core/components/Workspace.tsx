import { notionClientBrowser } from "integrations/notion"
import { useQuery } from "react-query"
import { useMemo } from "react"

export function Workspace(props: { workspace_id: string; workspace_name: string | null }) {
  const { workspace_name, workspace_id } = props
  const databases = useQuery(`workspace:${workspace_id}`, () =>
    notionClientBrowser(workspace_id).search({
      filter: {
        property: "object",
        value: "database",
      },
    })
  )

  return (
    <div>
      <h5>{workspace_name}</h5>
      {databases.data?.results.map((db) => {
        if (db.object !== "database") {
          return
        }

        return (
          <div key={db.id}>
            <h6>{db.title.flatMap((it) => it.plain_text).join()}</h6>
          </div>
        )
      })}
    </div>
  )
}
