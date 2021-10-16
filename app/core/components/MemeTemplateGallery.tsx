import {
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints"
import { Link, Routes } from "blitz"
import {
  DatabaseValue,
  getStableNotionFileUrl,
  notionClientBrowser,
  plainText,
} from "integrations/notion"
import React, { Suspense, useState } from "react"
import { useQuery } from "react-query"
import { PickerSearchInput } from "./DatabasePicker"
import { WorkspaceValue } from "./WorkspacePicker"

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
                url: getStableNotionFileUrl({
                  expiresTs: Number(new Date(file.file.expiry_time)),
                  url: file.file.url,
                }),
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

  const query = useQuery(
    ["databasePages", workspace.bot_id, database.id, search],
    async () => {
      const notion = notionClientBrowser(workspace.workspace_id)

      const req: QueryDatabaseParameters = {
        database_id: database.id,
        sorts: [
          {
            direction: "descending",
            timestamp: "last_edited_time",
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
      return pages.results.filter((row) => findAllFiles(row).length > 0)
    },
    {
      keepPreviousData: true,
    }
  )

  const isEmpty = query.data && query.data.length === 0 && search === ""

  return (
    <div className="items">
      {query.data &&
        query.data.map((it) => {
          const files = findAllFiles(it).map((file) => {
            // eslint-disable-next-line @next/next/no-img-element
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
                // Pass the row in a param so we don't have to re-load it from
                // the Notion API, which can be slow.
                row: JSON.stringify(it),
              })}
              // For whatever reason, we can't use as=... with the Routes helper.
              // It breaks cmd-click.
              as={`/spaces/${workspace.workspace_id}/templates/${it.id}`}
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

      {isEmpty && <p>No rows in this database contain a file.</p>}

      <style jsx>{`
        .item {
          display: flex;
          flex-direction: column;
          color: blue;

          text-decoration: none;
          height: 300px;
          width: 100%;
        }

        .item:visited {
          color: blue;
        }

        h3 {
          margin: 0;
          margin-bottom: 8px;
          margin-top: 16px;
          display: flex;
          justify-content: space-between;
        }

        .cta {
          color: #aaa;
        }

        .item:hover .cta {
          color: #777;
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
  const [reload, setReload] = useState(0)
  const [search, setSearch] = useState("")
  // const handleReload = useCallback(() => setReload(Date.now()))

  return (
    <div className="gallery">
      <PickerSearchInput
        label="Filter templates"
        value={search}
        onChange={setSearch}
        // onReload={handleReload}
      />

      <Suspense fallback={null}>
        <MemeTemplateGalleryList key={reload} search={search} {...props} />
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
