import type { Metadata } from "next";
import UserProfile from "./UserProfile";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  
  return {
    title: `${username} - WorldMapPin`,
    description: `Explore ${username}'s travel pins and adventures on WorldMapPin. Discover unique destinations and stories shared by this traveler.`,
  };
}

export default async function UserPage({ params }: Props) {
  const { username } = await params;

  return <UserProfile username={username} />;
}
