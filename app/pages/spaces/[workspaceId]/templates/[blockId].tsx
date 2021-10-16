import { Client as NotionClient } from "@notionhq/client"
import { GetPageResponse } from "@notionhq/client/build/src/api-endpoints"
import { ErrorView } from "app/core/components/ErrorBoundary"
import Form, { FORM_ERROR } from "app/core/components/Form"
import LabeledTextField from "app/core/components/LabeledTextField"
import {
  DatabaseRowTitle,
  DatabaseRowValue,
  findAllFiles,
} from "app/core/components/MemeTemplateGallery"
import { RecordIcon } from "app/core/components/RecordIcon"
import { Spinner } from "app/core/components/Spinner"
import Layout, { ActionRow } from "app/core/layouts/Layout"
import createMeme, { CreateMeme } from "app/memes/mutations/createMeme"
import getTemplateImagesAsBase64 from "app/templates/queries/getTemplateImagesAsBase64"
import {
  BlitzPage,
  GetServerSideProps,
  GetServerSidePropsResult,
  getSession,
  Link,
  Routes,
  useMutation,
  useParam,
  useQuery,
} from "blitz"
import db from "db"
import html2canvas from "html2canvas"
import { getStableNotionFileKey, notionClientServer } from "integrations/notion"
import { env } from "integrations/unix"
import router from "next/router"
import { useCallback, useEffect, useRef, useState } from "react"
import { useForm } from "react-final-form"
import { z } from "zod"

interface ShowTemplateProps {
  tokenId: string
  row: DatabaseRowValue
}

export const getServerSideProps: GetServerSideProps<
  ShowTemplateProps,
  { workspaceId: string; blockId: string }
> = async (context): Promise<GetServerSidePropsResult<ShowTemplateProps>> => {
  const session = await getSession(context.req, context.res)
  if (!session.userId || !context.params) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    }
  }

  const workspaceId = String(context.params.workspaceId)
  const blockId = String(context.params.blockId)

  if (!workspaceId || !blockId) {
    throw new Error("missing param")
  }

  const token = await db.notionOAuthToken.findFirst({
    where: {
      userId: session.userId,
      workspace_id: workspaceId,
    },
  })

  if (!token) {
    return {
      redirect: {
        destination: "/error?authError=Log in to view this page",
        permanent: false,
      },
    }
  }

  let row: GetPageResponse
  if (typeof context.query.row === "string") {
    // Some requests can have the row pre-populated, so we can avoid re-querying
    // the Notion API.
    row = JSON.parse(context.query.row)
  } else {
    const notion = notionClientServer(token)
    row = await notion.pages.retrieve({
      page_id: blockId,
    })
  }

  return {
    props: {
      tokenId: token.bot_id,
      row,
    },
  }
}

const ShowTemplate: BlitzPage<ShowTemplateProps> = ({ row, tokenId }) => {
  const files = findAllFiles(row)
  const [filesBase64] = useQuery(
    getTemplateImagesAsBase64,
    {
      workspaceId: useParam("workspaceId", "string") as string,
      blockId: useParam("blockId", "string") as string,
    },
    {
      suspense: false,
    }
  )
  const [createMutation] = useMutation(createMeme)

  return (
    <>
      <ActionRow
        left={
          <Link href="/">
            <a className="button small">{"<<"} Home</a>
          </Link>
        }
      />
      <h1>
        {row.icon && (
          <RecordIcon
            icon={row.icon}
            alt="Meme template page icon"
            width={48}
            style={{ marginRight: 12 }}
          />
        )}
        <DatabaseRowTitle row={row} />
      </h1>

      <Form
        schema={CreateMeme}
        initialValues={{
          sourceBlockId: row.id,
          createdWithTokenId: tokenId,
          allowPublic: true,
          allowWorkspace: true,
          allowBySourceBlock: true,
        }}
        onSubmit={async (values) => {
          console.warn("onSubmit", values)
          try {
            const meme = await createMutation(values)
            router.push(Routes.ShowMeme({ memeId: meme.id }))
          } catch (error) {
            console.error("form error", error)
            return {
              [FORM_ERROR]: `Whoops, got an error: ${error}`,
            }
          }
        }}
      >
        <LabeledTextField label="Top text" placeholder="How do you do" name="topText" type="text" />
        <LabeledTextField
          label="Bottom text"
          placeholder="fellow kids"
          name="bottomText"
          type="text"
        />

        {files.map((file) => {
          const image = filesBase64 ? filesBase64[getStableNotionFileKey(file.url)] : file.url
          if (!image) {
            return <ErrorView message={"Failed to load base64 image content"} />
          }
          return <MemePreview ready={Boolean(filesBase64)} key={file.url} src={image} />
        })}
      </Form>
    </>
  )
}
ShowTemplate.getLayout = (page) => <Layout title="Meme workshoppe">{page}</Layout>

function MemePreview(props: { ready: boolean; src: string }) {
  const form = useForm<z.infer<typeof CreateMeme>>()
  const preview = useRef<HTMLDivElement>(null)
  const [, rerender] = useState({})
  const ready = props.ready

  useEffect(() => {
    return form.subscribe(
      (data) => {
        console.log("form changed", data.values)
        rerender({})
      },
      {
        values: true,
      }
    )
  }, [form])

  const inscribe = useCallback(
    async (e: any) => {
      if (!ready) {
        return
      }

      if (e.preventDefault) {
        e.preventDefault()
      }
      if (!preview.current) {
        return
      }
      const canvas = await html2canvas(preview.current, {
        scale: 1,
      })
      const width = Math.floor(canvas.width)
      const height = Math.floor(canvas.height)
      const mimeType = props.src.includes("image/png") ? "image/png" : "image/jpeg"
      const base64 = canvas.toDataURL(mimeType).split("base64,")[1]

      form.batch(() => {
        form.change("widthPx", width)
        form.change("heightPx", height)
        form.change("dataBase64", base64)
        form.change("mimeType", mimeType)
      })

      form.submit()
    },
    [form, ready]
  )

  const topText = form.getFieldState("topText")?.value || ""
  const bottomText = form.getFieldState("bottomText")?.value || ""

  const textShadow = Array(10).fill("0px 0px 3px black").join(",")

  const buttonText = ready ? "Inscribe this meme... forever" : "Reticulating splines..."

  return (
    <div>
      <div className="preview" ref={preview}>
        <img src={props.src} alt="meme template image" />
        <div className="top-text">{topText}</div>
        <div className="bottom-text">{bottomText}</div>
      </div>
      <div className="happening">
        <button className="button" disabled={!ready} onClick={inscribe}>
          {buttonText}
          {!ready && (
            <span style={{ marginLeft: 12 }}>
              <Spinner alt="Waiting for image to load" />
            </span>
          )}
        </button>
      </div>
      <style jsx>{`
        .preview {
          text-align: center;
          position: relative;
          width: 100%;
          border: 1px solid black;
           {
            /* border-radius: 5px; */
          }
          overflow: hidden;
        }

        .happening {
          margin-top: 8px;
        }

        img {
           {
            /* max-height: 50vh; */
          }
          max-width: 100%;
          margin-bottom: -5px;
        }

        .top-text,
        .bottom-text {
          position: absolute;
          left: 0;
          right: 0;
          font-family: "Impact", sans-serif;
          color: white;
          text-shadow: ${textShadow};
          font-size: 3rem;
          text-align: center;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .top-text {
          top: 0;
        }

        .bottom-text {
          bottom: 0;
        }
      `}</style>
    </div>
  )
}

export default ShowTemplate
