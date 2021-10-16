import Layout, { ActionRow } from "app/core/layouts/Layout"
import getMemes, { GetMemesInput } from "app/memes/queries/getMemes"
import { BlitzPage, Image, Link, Routes, useQuery } from "blitz"

const ListMemes: BlitzPage = () => {
  const query: GetMemesInput = {
    orderBy: {
      updatedAt: "desc",
    },
  }
  const [memes] = useQuery(getMemes, query)

  return (
    <>
      <ActionRow
        left={
          <Link href="/">
            <a className="button small">{"<<"} Home</a>
          </Link>
        }
      />
      <h1>Your memes</h1>
      {memes.memes.map((meme) => {
        return (
          <Link key={meme.id} href={Routes.ShowMeme({ memeId: meme.id })}>
            <a className="meme" key={meme.id}>
              <Image width={800} height={400} className="img" src={`/api/meme/${meme.id}`} />
            </a>
          </Link>
        )
      })}
      <style jsx>{`
        .meme {
          width: 100%;
          margin-bottom: 12px;
          position: relative;
        }

        .img {
          width: 100%;
        }
      `}</style>
    </>
  )
}

ListMemes.getLayout = (page) => <Layout title="Your Memes">{page}</Layout>

export default ListMemes
