import { HTMLAttributes, ReactNode } from "react"
import { DatabaseValue } from "./DatabasePicker"
import { Image } from "blitz"

export function PickerCheck(props: {}) {
  return (
    <div className="check">
      ✔
      <style jsx>{`
        .check {
          color: white;
          background: blue;
          width: 1.5em;
          height: 1.5em;
          line-height: 1.5em;
          border-radius: 100%;
          text-align: center;
        }
      `}</style>
    </div>
  )
}

interface RecordIconProps extends HTMLAttributes<HTMLDivElement> {
  width: number
  icon: string | DatabaseValue["icon"] | undefined
  alt: string
}

export function RecordIcon(props: RecordIconProps) {
  const { width, icon, alt, ...htmlProps } = props

  let iconUrl: string = ""
  if (icon && typeof icon === "object") {
    switch (icon.type) {
      case "emoji":
        iconUrl = icon.emoji
        break
      case "file":
        iconUrl = icon.file.url
        break
      case "external":
        iconUrl = icon.external.url
        break
    }
  } else if (typeof icon === "string") {
    iconUrl = icon
  }

  const widthCss = typeof width === "number" ? `${width}px` : width

  return (
    <>
      {iconUrl.startsWith("http") ? (
        <img {...htmlProps} alt={alt} src={iconUrl} />
      ) : (
        <div {...htmlProps} className={iconUrl === "" ? "empty" : ""} title={alt}>
          {iconUrl}
        </div>
      )}

      <style jsx>{`
        img,
        div {
          border-radius: 2px;
          outline: 1px solid #eee;
        }

        img {
          width: ${widthCss};
        }

        div {
          font-size: ${widthCss};
          line-height: ${widthCss};
          width: ${widthCss};
          height: ${widthCss};
          display: inline-block;
        }

        .empty {
          background: #eee;
        }
      `}</style>
    </>
  )
}

interface PickerRowProps extends HTMLAttributes<HTMLDivElement> {
  body: ReactNode
  active?: boolean
  left?: ReactNode
  right?: ReactNode
}

export function PickerRow(props: PickerRowProps) {
  const { active, left, body, right, ...htmlProps } = props
  const className = `workspace-row ${props.active ? "active" : ""}`

  return (
    <article className={className} {...htmlProps}>
      <div className="icon center">{left}</div>
      <h3 className="title">{body}</h3>
      <div className="right center">{right}</div>

      <style jsx>{`
        .workspace-row {
          display: flex;
          flex: 1;
          direction: row;
          justify-content: space-between;
          align-items: center;

          padding: 8px;
          border-radius: 3px;
        }

        .center {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .workspace-row.active {
          border: 1px solid blue;
        }

        .icon {
          width: 24px;
          height: 24px;
        }

        .icon > img {
          max-width: 100%;
          max-height: 100%;
        }

        .icon > .emoji {
          line-height: 24px;
          font-size: 24px;
        }

        .title,
        .right {
          font-size: 1em;
          font-weight: normal;
          margin: 0;
          padding: 0;
        }

        .title {
          flex: 1;
          padding: 0 1em;
        }

        .right {
          width: 2em;
        }
      `}</style>
    </article>
  )
}
