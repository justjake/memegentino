import { GetDatabaseResponse, SearchResponse } from "@notionhq/client/build/src/api-endpoints"
import { notionClientProxy } from "integrations/notion"
import React, { ReactNode, Suspense, useEffect, useMemo, useState } from "react"
import { useQuery } from "react-query"
import { WorkspaceValue } from "./WorkspacePicker"
import { PickerCheck, PickerRow, RecordIcon } from "./RecordIcon"

export type DatabaseValue = Pick<
  GetDatabaseResponse,
  "cover" | "created_time" | "last_edited_time" | "icon" | "id" | "object" | "properties" | "title"
>

interface DatabasePickerProps {
  workspace: WorkspaceValue
  value?: DatabaseValue
  onChange: (newValue: DatabaseValue) => void
}

type SearchResult = SearchResponse["results"][number]
type DatabaseResult = Extract<SearchResult, { object: "database" }>
type RichText = DatabaseResult["title"]

function resultIsDatabase(result: SearchResult): result is DatabaseResult {
  return result.object === "database"
}

export function plainText(text: RichText): string {
  return text.map((it) => it.plain_text).join()
}

function DatabasePickerList(props: DatabasePickerProps & { search: string }) {
  const { search, value, onChange } = props

  const query = useQuery(
    ["databases", props.workspace.bot_id, search],
    async () => {
      const notion = notionClientProxy(props.workspace.workspace_id)
      const results = await notion.search({
        query: search === "" ? undefined : search,
        filter: {
          property: "object",
          value: "database",
        },
        sort: {
          timestamp: "last_edited_time",
          direction: "descending",
        },
      })
      return results.results.filter(resultIsDatabase)
    },
    {
      keepPreviousData: true,
    }
  )

  useEffect(() => {
    if (!value && query.data && query.data[0]) {
      onChange(query.data[0])
    }
  }, [value, query.data, onChange])

  return (
    <div>
      {query.data &&
        query.data.slice(0, 5).map((it) => {
          const active = it.id === props.value?.id
          return (
            <PickerRow
              key={it.id}
              left={<RecordIcon icon={it.icon} alt="database icon" width={24} />}
              body={plainText(it.title)}
              active={active}
              right={active && <PickerCheck />}
            />
          )
        })}

      <style jsx>{`
        div {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
      `}</style>
    </div>
  )
}

export function PickerSearchInput(props: {
  value: string
  placeholder?: string
  onChange(newValue: string): void
  label: ReactNode
}) {
  return (
    <label>
      <div>{props.label}</div>
      <input type="search" value={props.value} onChange={(e) => props.onChange(e.target.value)} />
      <style jsx>
        {`
          label {
            margin-bottom: 8px;
            font-size: 1em;
            display: flex;
            flex: 1;
            justify-content: center;
            align-items: center;
          }

          input {
            margin-left: 4px;
            font-size: 1em;
            flex: 1;
          }
        `}
      </style>
    </label>
  )
}

export function DatabasePicker(props: DatabasePickerProps) {
  const [search, setSearch] = useState("meme")

  return (
    <div className="picker">
      <PickerSearchInput
        label={"Filter databases"}
        value={search}
        onChange={setSearch}
        placeholder={"Dank memes db"}
      />

      <Suspense fallback={null}>
        <DatabasePickerList {...props} search={search} />
      </Suspense>

      <style jsx>{`
        .picker {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
      `}</style>
    </div>
  )
}
