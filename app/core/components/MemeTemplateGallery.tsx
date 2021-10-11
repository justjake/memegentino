import {
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { notionClientProxy } from "integrations/notion"
import { useQuery } from "react-query"
import React, { Suspense, useState } from "react"
import { plainText, DatabaseValue, PickerSearchInput } from "./DatabasePicker"
import { WorkspaceValue } from "./WorkspacePicker"
import { Link, Routes } from "blitz"
import { PickerRow } from "./RecordIcon"

export interface MemeTemplateGalleryProps {
  database: DatabaseValue
  workspace: WorkspaceValue
}

export type DatabaseRowValue = QueryDatabaseResponse["results"][number]

function isDefined<T>(v: T | undefined): v is T {
  return v !== undefined
}

export function findTitleProp(row: DatabaseRowValue) {
  return Object.entries(row.properties).find(([name, prop]) => prop.type === "title")
}

export function findAllFiles(row: DatabaseRowValue) {
  return Object.values(row.properties)
    .filter((it) => it.type === "files")
    .flatMap((it) => {
      if (it.type !== "files") {
        return []
      }

      return it.files
        .map((file) => {
          switch (file.type) {
            case "external":
              return {
                name: file.name,
                url: file.external.url,
              }
            case "file":
              return {
                name: file.name,
                url: file.file.url,
              }
          }
        })
        .filter(isDefined)
    })
}

export function DatabaseRowTitle(props: { titleProp?: string; row: DatabaseRowValue }) {
  const titleProp = props.titleProp || findTitleProp(props.row)?.[0]
  if (!titleProp) {
    return null
  }

  const title = props.row.properties[titleProp]
  if (!title || title.type !== "title") {
    return null
  }

  const text = plainText(title.title)

  if (text !== "") {
    return <>{text}</>
  }

  return <span style={{ opacity: 0.1 }}>Untitled</span>
}

export function MemeTemplateGalleryList(props: MemeTemplateGalleryProps & { search: string }) {
  const { workspace, database, search } = props

  const databaseProps = Object.entries(database.properties)
  const databaseTitleProp = databaseProps.find(([name, prop]) => prop.type === "title")?.[0]
  const databaseFileProps = databaseProps
    .filter(([, prop]) => prop.type === "files")
    .map((it) => it[0])

  const query = useQuery(["databasePages", workspace.bot_id, database.id, search], async () => {
    const notion = notionClientProxy(workspace.workspace_id)

    const req: QueryDatabaseParameters = {
      database_id: database.id,
      sorts: [
        {
          direction: "descending",
          timestamp: "created_time",
        },
      ],
    }

    if (databaseTitleProp && search) {
      req.filter = {
        property: databaseTitleProp,
        title: {
          contains: search,
        },
      }
    }

    const pages = await notion.databases.query(req)
    return pages.results
  })

  return (
    <div className="items">
      {query.data &&
        query.data.map((it) => {
          const files = findAllFiles(it).map((file) => {
            return <img key={file.url} src={file.url} alt={file.name} />
          })

          if (!files.length) {
            return null
          }

          return (
            <Link
              key={it.id}
              href={Routes.ShowTemplate({
                workspaceId: workspace.workspace_id,
                blockId: it.id,
              })}
            >
              <a className="item">
                {databaseTitleProp && (
                  <h3>
                    <span>
                      <DatabaseRowTitle titleProp={databaseTitleProp} row={it} />
                    </span>
                    <span className="cta">meme it {">>"}</span>
                  </h3>
                )}
                <div className="filmstrip">{files}</div>
              </a>
            </Link>
          )
        })}
      <style jsx>{`
        .item {
          display: flex;
          flex-direction: column;

          text-decoration: none;
          height: 300px;
        }

        h3 {
          margin: 0;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
        }

        .cta {
          color: #aaa;
        }

        .filmstrip {
          border-radius: 3px;
          align-items: center;
          justify-content: center;
          background: #eee;
          display: flex;
          flex: 1;
          max-width: 100%;
          flex-direction: row;
          overflow: auto;
        }

        img {
          height: 100%;
          max-width: 100%;
        }

        .items {
          justify-content: space-between;
          flex-wrap: wrap;
          display: flex;
          flex-direction: row;
          flex-wrap: 1;
          flex: 1;
          max-width: 100%;
        }
      `}</style>
    </div>
  )
}

export function MemeTemplateGallery(props: MemeTemplateGalleryProps) {
  const [search, setSearch] = useState("")

  return (
    <div className="gallery">
      <PickerSearchInput label="Filter templates" value={search} onChange={setSearch} />

      <Suspense fallback={null}>
        <MemeTemplateGalleryList search={search} {...props} />
      </Suspense>

      <style jsx>{`
        .gallery {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
      `}</style>
    </div>
  )
}
