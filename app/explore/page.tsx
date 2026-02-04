import { fetchAllSets } from '@/lib/api';
import ExplorePage from '@/components/ExplorePage';

// Force dynamic rendering (no static generation at build time)
export const dynamic = 'force-dynamic';

export default async function ExplorePageRoute() {
  const sets = await fetchAllSets();

  return <ExplorePage sets={sets} />;
}
