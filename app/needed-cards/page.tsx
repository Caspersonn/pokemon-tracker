import { fetchAllSets } from '@/lib/api';
import NeededCardsPage from '@/components/NeededCardsPage';

export default async function NeededCards() {
  const sets = await fetchAllSets();

  return <NeededCardsPage sets={sets} />;
}
