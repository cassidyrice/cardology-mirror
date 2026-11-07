/**
 * The last picture, text beside it (docs/design/DIRECTION.md §6): the explainer
 * film with its poster, controls and captions, and the page's one invitation
 * back to the birthday field.
 */
export function Closing() {
  return (
    <>
      <div className="closing-film" data-rise style={{ "--rise-i": 0 } as React.CSSProperties}>
        <video
          controls
          playsInline
          preload="none"
          poster="/video/explainer-poster.webp"
          width={1280}
          height={720}
          aria-label="Card Blueprints explainer video"
        >
          <source src="/video/explainer-16x9.mp4" type="video/mp4" />
          <track kind="captions" src="/video/explainer.en.vtt" srcLang="en" label="English" default />
        </video>
      </div>
      <div className="closing-text">
        <h2 id="home-start-title" data-rise style={{ "--rise-i": 1 } as React.CSSProperties}>
          Follow the itch.
        </h2>
        <p data-rise style={{ "--rise-i": 2 } as React.CSSProperties}>
          Two minutes on what a birth card is and what it is not. Then do yours. It takes ten seconds and costs nothing.
        </p>
        <p data-rise style={{ "--rise-i": 3 } as React.CSSProperties}>
          <a href="#home-birthdate" className="closing-button">Find your card free</a>
        </p>
      </div>
    </>
  );
}
