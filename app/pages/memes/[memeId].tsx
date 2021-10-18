import Layout, { ActionRow } from "app/core/layouts/Layout"
import { memeImagePath } from "app/memes/memeHelpers"
import getMeme from "app/memes/queries/getMeme"
import { Image, Link, BlitzPage, useParam, useQuery, Routes, useParams, useRouter } from "blitz"

const ShowMeme: BlitzPage = () => {
  const memeId = useParam("memeId", "string") || ""

  const [meme] = useQuery(getMeme, { id: memeId })
  const { widthPx, heightPx } = meme

  return (
    <>
      <ActionRow
        left={
          <div>
            <Link href={Routes.ListMemes()}>
              <a className="button small">{"<<"} Your Memes</a>
            </Link>
          </div>
        }
        right={
          <Link
            href={Routes.ShowTemplate({
              workspaceId: meme.sourceWorkspaceId,
              blockId: meme.sourceBlockId,
              effects: meme.effects,
              topText: meme.topText,
              bottomText: meme.bottomText,
            })}
          >
            <a className="button small">Remix</a>
          </Link>
        }
      />
      {meme.topText && <h1>{meme.topText}</h1>}
      {meme.bottomText && <h1>{meme.bottomText}</h1>}
      <div className="img">
        {widthPx && heightPx ? (
          <Image width={widthPx} height={heightPx} src={memeImagePath(memeId)} />
        ) : (
          <img src={memeImagePath(memeId)} />
        )}
      </div>
      {
        <p>
          Image URL:{" "}
          <span className="copyable">
            {new URL(memeImagePath(memeId), window.location.href).toString()}
          </span>
        </p>
      }
      <style jsx>{`
        .copyable {
          user-select: all;
        }

        .actions {
          margin-top: 1em;
          display: flex;
        }

        h1 {
          margin: 0;
          margin-top: 1em;
        }

        h1 + h1 {
          margin-top: 0;
          margin-bottom: 1em;
        }

        .img {
          margin: 1em 0;
        }

        img {
          max-width: 100%;
        }
      `}</style>
    </>
  )
}

ShowMeme.getLayout = (page) => <Layout title="Da Meme">{page}</Layout>

export default ShowMeme
