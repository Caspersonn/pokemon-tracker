import { fetchAllSets } from '@/lib/api';
import NeededCardsPage from '@/components/NeededCardsPage';

// Force dynamic rendering (no static generation at build time)
export const dynamic = 'force-dynamic';

export default async function NeededCards() {
  const sets = await fetchAllSets();

  return <NeededCardsPage sets={sets} />;
}
