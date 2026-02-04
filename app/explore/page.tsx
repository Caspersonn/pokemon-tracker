import { fetchAllSets } from '@/lib/api';
import ExplorePage from '@/components/ExplorePage';

export default async function ExplorePageRoute() {
  const sets = await fetchAllSets();

  return <ExplorePage sets={sets} />;
}
