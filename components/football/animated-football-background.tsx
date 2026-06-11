import Image from "next/image";

const floatingFlags = [
  { code: "mx", label: "Mexico", left: "3vw", top: "8vh" },
  { code: "ca", label: "Canada", left: "87vw", top: "7vh" },
  { code: "us", label: "Estados Unidos", left: "92vw", top: "72vh" },
  { code: "br", label: "Brasil", left: "47vw", top: "5vh" },
  { code: "ar", label: "Argentina", left: "4vw", top: "86vh" },
];

export function AnimatedFootballBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,197,94,0.18),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(250,204,21,0.16),transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.02),rgba(2,6,23,0.28))]" />
      {floatingFlags.map((flag, index) => (
        <span
          key={flag.code}
          className="float-token absolute hidden size-12 place-items-center overflow-hidden rounded-full border border-white/18 bg-slate-950/42 opacity-70 shadow-2xl shadow-black/30 backdrop-blur-md md:grid"
          style={{
            left: flag.left,
            top: flag.top,
            animationDelay: `${index * 0.6}s`,
          }}
        >
          <Image
            src={`https://flagcdn.com/w80/${flag.code}.png`}
            alt={flag.label}
            fill
            sizes="56px"
            className="object-cover"
          />
        </span>
      ))}
    </div>
  );
}
