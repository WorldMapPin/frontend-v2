import ExploreClient from "./ExploreClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Travel Stories | WorldMapPin",
  description: "Discover the newest and trending community travel stories on WorldMapPin. See global experiences and beautiful captures shared by travelers.",
};

export default function ExplorePage() {
  return <ExploreClient />;
}
