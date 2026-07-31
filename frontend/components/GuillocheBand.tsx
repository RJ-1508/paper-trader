export default function GuillocheBand() {
  return (
    <div className="border-y border-hairline">
      <div
        className="h-14 overflow-hidden opacity-50"
        style={{
          backgroundImage: "url(/deco/guilloche-band.svg)",
          backgroundSize: "1200px 56px",
          backgroundRepeat: "repeat-x",
        }}
      />
    </div>
  );
}
