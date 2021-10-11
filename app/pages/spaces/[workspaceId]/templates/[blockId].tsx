import {
  DatabaseRowTitle,
  DatabaseRowValue,
  findAllFiles,
} from "app/core/components/MemeTemplateGallery"
import Layout from "app/core/layouts/Layout"
import { BlitzPage, useRouter, GetServerSideProps, getSession, Routes, useMutation } from "blitz"
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
}

type ShowTemplateQuery = Parameters<typeof Routes.ShowTemplate>[0]

export const getServerSideProps: GetServerSideProps<ShowTemplateProps, ShowTemplateParams> = async (
  context
) => {
  const session = await getSession(context.req, context.res)
  if (!session.userId) {
    return {
      redirect: "/",
    }
  }

  const workspaceId: string = context.params.workspaceId
  const blockId: string = context.params.blockId

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
      redirect: "/error?authError=Log in to view this page",
    }
  }

  const notion = new NotionClient({
    baseUrl: env("NOTION_BASE_URL"),
    auth: token.access_token,
  })

  const page = await notion.pages.retrieve({
    page_id: blockId,
  })

  return {
    props: {
      tokenId: token.bot_id,
      row: page,
    },
  }
}

const ShowTemplate: BlitzPage<ShowTemplateProps> = ({ row, tokenId }) => {
  const files = findAllFiles(row)
  const [createMutation] = useMutation(createMeme)
  const router = useRouter()

  return (
    <>
      <h1>
        <RecordIcon icon={row.icon} alt="Meme template page icon" width={48} />
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
          try {
            const meme = await createMutation(values)
            router.push(`/api/meme/${meme.id}`)
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
          return <MemePreview key={file.url} src={file.url} />
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
    return form.subscribe(() => rerender({}), {
      modified: true,
    })
  })

  const enscribe = useCallback(async () => {
    if (!preview.current) {
      return
    }
    const canvas = await html2canvas(preview.current)
    const mimeType = "image/jpeg"
    const base64 = canvas.toDataURL(mimeType).split("base64,")[1]

    form.batch(() => {
      form.change("dataBase64", base64)
      form.change("mimeType", mimeType)
    })
    form.submit()
  }, [form])

  const topText = form.getFieldState("topText")?.value || ""
  const bottomText = form.getFieldState("bottomText")?.value || ""

  const textShadow = Array(10).fill("0px 0px 3px black").join(",")

  return (
    <div>
      <div className="preview" ref={preview}>
        <img src={props.src} />
        <div className="top-text">{topText}</div>
        <div className="bottom-text">{bottomText}</div>
      </div>
      <div className="happening">
        <button className="button" onClick={enscribe}>
          Inscribe this meme... forever.
        </button>
      </div>
      <style jsx>{`
        .preview {
          position: relative;
          width: 100%;
          border: 1px solid black;
          border-radius: 5px;
          overflow: hidden;
        }

        .happening {
          margin-top: 8px;
        }

        img {
          height: 600px;
          max-width: 100%;
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
