import {
  DatabaseRowTitle,
  DatabaseRowValue,
  findAllFiles,
} from "app/core/components/MemeTemplateGallery"
import Layout from "app/core/layouts/Layout"
import {
  Link,
  BlitzPage,
  useRouter,
  GetServerSideProps,
  getSession,
  useMutation,
  GetServerSidePropsResult,
} from "blitz"
import db, { NotionOAuthTokenDefaultFields } from "db"
import { Client as NotionClient } from "@notionhq/client"
import { env } from "integrations/unix"
import { RecordIcon } from "app/core/components/RecordIcon"
import Form, { FORM_ERROR } from "app/core/components/Form"
import createMeme, { CreateMeme } from "app/memes/mutations/createMeme"
import LabeledTextField from "app/core/components/LabeledTextField"
import { useForm, useFormState } from "react-final-form"
import { useCallback, useEffect, useRef, useState } from "react"
import { z } from "zod"
import html2canvas from "html2canvas"

interface ShowTemplateProps {
  tokenId: string
  row: DatabaseRowValue
  images: Record<string, string>
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

  const notion = new NotionClient({
    baseUrl: env("NOTION_BASE_URL"),
    auth: token.access_token,
  })

  const page = await notion.pages.retrieve({
    page_id: blockId,
  })

  const files = findAllFiles(page)
  const fileMap: Record<string, string> = {}

  await Promise.all(
    files.map(async (file) => {
      // const controller = new AbortController()
      // const { signal } = controller

      const res = await fetch(file.url /*{ signal }*/)
      const contentType = res.headers.get("Content-Type")
      if (!contentType || !contentType.startsWith("image/")) {
        // controller.abort()
        return
      }

      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString("base64")

      fileMap[file.url] = `data:${contentType};base64,${base64}`
    })
  )

  return {
    props: {
      images: fileMap,
      tokenId: token.bot_id,
      row: page,
    },
  }
}

const ShowTemplate: BlitzPage<ShowTemplateProps> = ({ row, tokenId, images }) => {
  const files = findAllFiles(row)
  const [createMutation] = useMutation(createMeme)

  return (
    <>
      <div>
        <Link href="/">
          <a className="button small">{"<<"} Back</a>
        </Link>
      </div>
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
            window.location.href = `/api/meme/${meme.id}`
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
          const image = images[file.url] || file.url
          return <MemePreview key={file.url} src={image} />
        })}
      </Form>
    </>
  )
}
ShowTemplate.getLayout = (page) => <Layout title="Meme workshoppe">{page}</Layout>

function MemePreview(props: { src: string }) {
  const form = useForm<z.infer<typeof CreateMeme>>()
  const preview = useRef<HTMLDivElement>(null)
  const [, rerender] = useState({})

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
      if (e.preventDefault) {
        e.preventDefault()
      }
      if (!preview.current) {
        return
      }
      const canvas = await html2canvas(preview.current)
      const mimeType = props.src.includes("image/png") ? "image/png" : "image/jpeg"
      const base64 = canvas.toDataURL(mimeType).split("base64,")[1]

      form.batch(() => {
        form.change("dataBase64", base64)
        form.change("mimeType", mimeType)
      })

      form.submit()
    },
    [form]
  )

  const topText = form.getFieldState("topText")?.value || ""
  const bottomText = form.getFieldState("bottomText")?.value || ""

  const textShadow = Array(10).fill("0px 0px 3px black").join(",")

  return (
    <div>
      <div className="preview" ref={preview}>
        <img src={props.src} alt="meme template image" />
        <div className="top-text">{topText}</div>
        <div className="bottom-text">{bottomText}</div>
      </div>
      <div className="happening">
        <button className="button" onClick={inscribe}>
          Inscribe this meme... forever.
        </button>
      </div>
      <style jsx>{`
        .preview {
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
          max-height: 50vh;
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
