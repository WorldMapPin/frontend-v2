import { resolvePermlinkToCanonicalPost } from "@/lib/worldmappinApi";
import { notFound, permanentRedirect } from "next/navigation";

export default async function LegacyPermlinkRedirectPage({
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

  permanentRedirect(
    `/@${encodeURIComponent(canonicalPost.author)}/${encodeURIComponent(canonicalPost.permlink)}`,
  );
}
