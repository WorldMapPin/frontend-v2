import { resolvePermlinkToCanonicalPost } from "@/lib/worldmappinApi";
import { notFound } from "next/navigation";
import PermlinkMapClient from "./PermlinkMapClient";

export const dynamic = "force-dynamic";

export default async function LegacyPermlinkMapPage({
  params,
}: {
  params: Promise<{ permlink: string }>;
}) {
  const { permlink: rawPermlink } = await params;

  let decodedPermlink: string;
  try {
    decodedPermlink = decodeURIComponent(rawPermlink);
  } catch {
    notFound();
  }

  const canonicalPost = await resolvePermlinkToCanonicalPost(decodedPermlink);

  if (!canonicalPost) {
    notFound();
  }

  return (
    <PermlinkMapClient
      permlink={decodedPermlink}
      postPath={`/@${encodeURIComponent(canonicalPost.author)}/${encodeURIComponent(canonicalPost.permlink)}`}
    />
  );
}
