import { fetchAllSets } from '@/lib/api';
import ScanPage from '@/components/ScanPage';

export const dynamic = 'force-dynamic';

export default async function ScanPageRoute() {
  const sets = await fetchAllSets();

  return <ScanPage sets={sets} />;
}
