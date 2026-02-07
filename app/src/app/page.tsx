import { getEpisodes, getUseCases, getAllTools, getAllAudiences } from "@/lib/data";
import HomeClient from "@/components/HomeClient";

export default function Home() {
  const episodes = getEpisodes();
  const useCases = getUseCases();
  const allTools = getAllTools(episodes);
  const allAudiences = getAllAudiences(useCases);

  return (
    <HomeClient
      useCases={useCases}
      allAudiences={allAudiences}
      totalEpisodes={episodes.length}
      totalTools={allTools.length}
    />
  );
}
