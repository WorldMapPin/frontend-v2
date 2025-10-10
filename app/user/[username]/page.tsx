import type { Metadata } from "next";
import UserProfile from "./UserProfile";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username: rawUsername } = await params;
  
  // Handle @username format - remove @ if present and decode URL encoding
  const username = decodeURIComponent(rawUsername).replace(/^@/, '');
  
  return {
    title: `${username} - WorldMapPin`,
    description: `Explore ${username}'s travel pins and adventures on WorldMapPin. Discover unique destinations and stories shared by this traveler.`,
  };
}

export default async function UserPage({ params }: Props) {
  const { username: rawUsername } = await params;
  
  // Handle @username format - remove @ if present and decode URL encoding
  const username = decodeURIComponent(rawUsername).replace(/^@/, '');

  return <UserProfile username={username} />;
}
