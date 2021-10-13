export function Spinner(props: { alt: string; fullWidth?: boolean }) {
  const { alt, fullWidth } = props
  const className = fullWidth ? "full-width" : "inline"
  const size = "1.1em"
  return (
    <>
      <div className={className}>
        <div className="loader">{alt}</div>
      </div>
      <style jsx>{`
        .inline {
          display: inline-flex;
          vertical-align: text-bottom;
        }

        .full-width {
          flex-grow: 1;
          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loader {
          text-indent: -9999em;
          overflow: hidden;
          width: ${size};
          height: ${size};
          border-radius: 50%;
          background: #ffffff;
          background: conic-gradient(
            rgba(164, 164, 164, 0) 0%,
            rgba(164, 164, 164, 0) 20%,
            rgba(164, 164, 164, 1) 80%
          );
          position: relative;
          animation: spin 0.7s infinite linear;
          transform: translateZ(0);
        }
        .loader:after {
          background: white;
          width: 70%;
          height: 70%;
          border-radius: 50%;
          content: "";
          margin: auto;
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            -webkit-transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  )
}
