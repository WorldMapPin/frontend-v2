import DynamicPageClient from "./DynamicPageClient";
import { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string[] }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const slugArray = resolvedParams.slug;
  const decodedFirst = decodeURIComponent(slugArray?.[0] || "");
  const startsWithAt = decodedFirst.startsWith("@");

  if (!startsWithAt) {
    return { title: "Not Found | WorldMapPin" };
  }

  const segmentCount = slugArray?.length || 0;

  // Profile Route
  if (segmentCount === 1) {
    const username = decodedFirst.replace("@", "");
    return {
      title: `@${username} | WorldMapPin`,
      description: `Explore travel posts, coverage map, and adventures by @${username} on WorldMapPin.`,
    };
  }

  // Post Route
  if (segmentCount >= 2) {
    const author = decodedFirst.replace("@", "");
    const permlink = decodeURIComponent(slugArray?.[1] || "");

    try {
      const res = await fetch("https://api.hive.blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "bridge.get_post",
          params: { author, permlink, observer: "" },
          id: 1,
        }),
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (res.ok) {
        const data = await res.json();
        const post = data.result;

        if (post && post.title) {
          // Extract plain text from markdown for description
          const plainTextBody = post.body
            .replace(/[#_*\[\]`!?]/g, "")
            .replace(/\n=/g, " ")
            .replace(/\n\s*\n/g, " ")
            .replace(/https?:\/\/[^\s]+/g, ""); // Remove stray URLs
          
          const description =
            plainTextBody.length > 160
              ? plainTextBody.substring(0, 156).trim() + "..."
              : plainTextBody.trim();

          // Extract image for OpenGraph 
          let ogImage = "";
          try {
            const metadata = JSON.parse(post.json_metadata || "{}");
            const imageArray = metadata.image || metadata.images;
            if (Array.isArray(imageArray) && imageArray.length > 0) {
               ogImage = imageArray[0];
            }
          } catch (e) {
             // Ignored
          }

          return {
            title: `${post.title} | WorldMapPin`,
            description: description || `Read the travel story by @${author} on WorldMapPin.`,
            openGraph: ogImage ? {
              images: [{ url: ogImage }],
            } : undefined,
            twitter: ogImage ? {
              card: 'summary_large_image',
              images: [ogImage],
            } : undefined,
          };
        }
      }
    } catch (e) {
      console.error("Error fetching metadata for post:", e);
    }

    return {
      title: `Post by @${author} | WorldMapPin`,
      description: `Read the travel story by @${author} on WorldMapPin.`,
    };
  }

  return { title: "WorldMapPin" };
}

export default function Page() {
  return <DynamicPageClient />;
}
