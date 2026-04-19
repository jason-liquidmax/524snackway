import SnackViewerClient from "./components/SnackViewerClient";

const SNACKS = [
  { path: "/models/seasalt.glb", label: "Sea Salt" },
  { path: "/models/sv.glb", label: "Sea Salt & Vinegar" },
  { path: "/models/bbq.glb", label: "BBQ" },
];

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center gap-6 p-8">
      {SNACKS.map((s) => (
        <div key={s.path} className="flex flex-col items-center gap-2">
          <div className="h-[420px] w-[300px]">
            <SnackViewerClient modelPath={s.path} />
          </div>
          <span className="text-sm">{s.label}</span>
        </div>
      ))}
    </main>
  );
}
