"use client";

import dynamic from "next/dynamic";

const SnackViewer = dynamic(() => import("./SnackViewer"), { ssr: false });

export default function SnackViewerClient({ modelPath }: { modelPath: string }) {
  return <SnackViewer modelPath={modelPath} />;
}
