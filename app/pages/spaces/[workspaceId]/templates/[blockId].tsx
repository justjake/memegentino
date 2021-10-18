import { GetPageResponse } from "@notionhq/client/build/src/api-endpoints"
import { useDrag } from "@use-gesture/react"
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
import router from "next/router"
import {
  CSSProperties,
  Dispatch,
  MouseEventHandler,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useForm } from "react-final-form"
import { z } from "zod"

interface ShowTemplateProps {
  tokenId: string
  row: DatabaseRowValue
  defaultEffect?: MemeEditorState
  topText?: string
  bottomText?: string
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

  let defaultEffect: MemeEditorState | undefined
  if (typeof context.query.effects === "string") {
    defaultEffect = JSON.parse(context.query.effects)
  }

  return {
    props: {
      tokenId: token.bot_id,
      defaultEffect,
      row,
      topText: typeof context.query.topText === "string" ? context.query.topText : undefined,
      bottomText:
        typeof context.query.bottomText === "string" ? context.query.bottomText : undefined,
    },
  }
}

const ShowTemplate: BlitzPage<ShowTemplateProps> = ({
  row,
  tokenId,
  defaultEffect,
  topText,
  bottomText,
}) => {
  const files = findAllFiles(row)
  const [filesBase64, base64Query] = useQuery(
    getTemplateImagesAsBase64,
    {
      workspaceId: useParam("workspaceId", "string") as string,
      blockId: useParam("blockId", "string") as string,
    },
    {
      suspense: false,
      enabled: false,
    }
  )

  useEffect(() => {
    base64Query.refetch()
  }, [base64Query, row.id])

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
          topText: topText || "",
          bottomText: bottomText || "",
        }}
        onSubmit={async (values) => {
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
          return (
            <MemeEditor
              defaultEffect={defaultEffect}
              ready={Boolean(filesBase64)}
              key={file.url}
              src={image}
            />
          )
        })}
      </Form>
    </>
  )
}
ShowTemplate.getLayout = (page) => <Layout title="Meme workshoppe">{page}</Layout>

interface MemeEditorState {
  height?: CSSProperties["height"]
  topText?: CSSProperties
  bottomText?: CSSProperties
}

function MemeEditor(props: { ready: boolean; src: string; defaultEffect?: MemeEditorState }) {
  const { ready, src, defaultEffect } = props
  const form = useForm<z.infer<typeof CreateMeme>>()
  const imageIntrinsics = useImageIntrinsics(src)

  const [memeDiv, setMemeDiv] = useState<HTMLDivElement | null>(null)
  const [, rerender] = useState({})
  const [state, setState] = useState<MemeEditorState>(defaultEffect || {})

  useEffect(() => {
    return form.subscribe(
      () => {
        rerender({})
      },
      {
        values: true,
      }
    )
  }, [form])

  useEffect(
    function observeHeightResize() {
      if (!memeDiv) {
        return
      }

      const mutationObserver = new MutationObserver(() => {
        const height = memeDiv.style.height

        setState(({ height: prevHeight, ...state }) => {
          if (height === "auto") {
            return state
          }

          return {
            ...state,
            height,
          }
        })
      })

      mutationObserver.observe(memeDiv, {
        attributes: true,
      })

      return () => mutationObserver.disconnect()
    },
    [memeDiv]
  )

  const handleResetHeight = useCallback<MouseEventHandler>((e) => {
    e.preventDefault()
    setState(({ height, ...state }) => state)
  }, [])

  const handleCreateMeme = useCallback(
    async (e: any) => {
      if (!ready) {
        return
      }

      if (e.preventDefault) {
        e.preventDefault()
      }
      if (!memeDiv) {
        return
      }
      const canvas = await html2canvas(memeDiv, {
        scale: 1,
      })
      const width = Math.floor(canvas.width)
      const height = Math.floor(canvas.height)
      const mimeType = src.includes("image/png") ? "image/png" : "image/jpeg"
      const base64 = canvas.toDataURL(mimeType).split("base64,")[1]

      form.batch(() => {
        form.change("widthPx", width)
        form.change("heightPx", height)
        form.change("dataBase64", base64)
        form.change("mimeType", mimeType)

        const hasEffects = Object.values(state).some(Boolean)
        if (hasEffects) {
          form.change("effects", JSON.stringify(state))
        } else {
          form.change("effects", undefined)
        }
      })

      form.submit()
    },
    [form, ready, src, memeDiv, state]
  )

  const useDragText = (key: "topText" | "bottomText") =>
    useDrag(
      ({ offset: [left, top] }) => {
        setState((state) => {
          const newState = { ...state }
          const pos = { left, top }
          newState[key] = pos
          return newState
        })
      },
      {
        from: ({ target }) => {
          const targetPos = memeDiv!.getBoundingClientRect()
          const textPos = (target as Element).getBoundingClientRect()
          const initial = addPos(negatePos(targetPos), textPos)
          return [initial.left, initial.top]
        },
        bounds: { current: memeDiv },
      }
    )

  const dragTopText = useDragText("topText")
  const dragBottomText = useDragText("bottomText")

  const topText = form.getFieldState("topText")?.value || ""
  const bottomText = form.getFieldState("bottomText")?.value || ""
  const textShadow = Array(20).fill("0px 0px 3px black").join(",")
  const buttonText = ready ? "Inscribe this meme... forever" : "Reticulating splines..."

  // const topTextStyle: CSSProperties | undefined = state.topText

  return (
    <div>
      <div
        className="meme"
        ref={setMemeDiv}
        style={{
          aspectRatio: imageIntrinsics && `${imageIntrinsics.width} / ${imageIntrinsics.height}`,
          height: state.height ? state.height : imageIntrinsics ? "auto" : undefined,
        }}
      >
        <div className="text">
          <span className="draggable" {...dragTopText()} style={cssAbs(state.topText)}>
            <span className="ui-label bottom">Top text</span>
            {topText}
          </span>
        </div>
        <div className="text">
          <span className="draggable" {...dragBottomText()} style={cssAbs(state.bottomText)}>
            <span className="ui-label">Bottom text</span>
            {bottomText}
          </span>
        </div>
        <span className="ui-label resize-label">Resize</span>
      </div>
      <div className="happening">
        <button className="button" disabled={!ready} onClick={handleCreateMeme}>
          {buttonText}
          {!ready && (
            <span style={{ marginLeft: 12 }}>
              <Spinner alt="Waiting for image to load" />
            </span>
          )}
        </button>
        <ResetButton state={state} setState={setState} field={"height"}>
          Reset size
        </ResetButton>
        <ResetButton state={state} setState={setState} field={"topText"}>
          Reset top text position
        </ResetButton>
        <ResetButton state={state} setState={setState} field={"bottomText"}>
          Reset bottom text position
        </ResetButton>
      </div>
      <style jsx>{`
        .meme {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          text-align: center;
          position: relative;
          width: 100%;
          height: 0px;
          border: 1px solid black;
          overflow: hidden;
          background-image: url("${src}");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          resize: vertical;
        }

        .ui-label {
          position: absolute;
          display: none;
          font-size: 12px;
          padding: 1px 3px;
          color: white;
          pointer-events: none;
          user-select: none;
          text-shadow: none;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
            Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
          background: blue;
          border-radius: 2px 2px 0 0;
          bottom: calc(100% + 1px);
        }

        .ui-label.bottom {
          bottom: initial;
          top: calc(100% + 1px);
          border-radius: 0 0 2px 2px;
        }

        .resize-label {
          position: absolute;
          bottom: 0;
          right: 0;
          padding-right: 10px;
        }

        .meme:hover .ui-label {
          display: initial;
          white-space: nowrap;
        }

        .happening {
          margin-top: 8px;
        }

        .text {
          font-family: "Impact", sans-serif;
          color: white;
          text-shadow: ${textShadow};
          font-size: 3rem;
          text-align: center;
          white-space: pre-wrap;
        }

        .draggable {
          cursor: move;
          position: relative;
          touch-action: none;
          user-select: none;
        }

        .meme:hover .draggable {
          box-shadow: 0px 0px 0px 2px blue;
          border-radius: 1px;
        }
      `}</style>
    </div>
  )
}

interface ImageIntrinsics {
  width: number
  height: number
}

function ResetButton<Key extends string, State extends { [K in Key]?: unknown }>(props: {
  field: Key
  state: State
  setState: Dispatch<SetStateAction<State>>
  children: ReactNode
}) {
  const { field: key, setState, state, children } = props

  const handleClick = useCallback<MouseEventHandler>(
    (event) => {
      event.preventDefault()
      setState((state) => {
        const newState = {
          ...state,
        }
        delete newState[key]
        return newState
      })
    },
    [key, setState]
  )

  if (!state[key]) {
    return null
  }

  return (
    <button className="button" onClick={handleClick}>
      {children}
    </button>
  )
}

function useImageIntrinsics(src: string): ImageIntrinsics | undefined {
  const [state, setState] = useState<ImageIntrinsics | undefined>()

  useEffect(() => {
    if (src === "") {
      return
    }

    let canceled = false

    function updateImageIntrinsics() {
      const img = document.createElement("img")
      img.src = src
      img.onload = () => {
        if (canceled) {
          return
        }

        setState({
          width: img.width,
          height: img.height,
        })
      }
    }

    updateImageIntrinsics()

    return () => {
      canceled = true
    }
  }, [src])

  return state
}

interface Pos {
  top: number
  left: number
}

function addPos(a: Pos, b: Pos): Pos {
  return {
    top: a.top + b.top,
    left: a.left + b.left,
  }
}

function negatePos(pos: Pos): Pos {
  return {
    top: -pos.top,
    left: -pos.left,
  }
}

function cssAbs(css: CSSProperties | undefined): CSSProperties | undefined {
  if (!css) {
    return
  }

  if (css.top !== undefined || css.left !== undefined) {
    return {
      ...css,
      position: "absolute",
      display: "block",
    }
  }

  return css
}

export default ShowTemplate
