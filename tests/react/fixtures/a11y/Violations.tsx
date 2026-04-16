export function Violations() {
  return (
    <div>
      {/* missing-alt */}
      <img src="photo.jpg" />

      {/* button-no-label */}
      <button></button>

      {/* click-no-role */}
      <div onClick={() => {}}>click me</div>

      {/* input-no-label */}
      <input type="text" />

      {/* anchor-no-href */}
      <a>link</a>

      {/* anchor-empty-text */}
      <a href="/home"></a>
    </div>
  );
}
