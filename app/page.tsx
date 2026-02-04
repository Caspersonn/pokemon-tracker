import { fetchAllSets } from '@/lib/api';
import MainPage from '@/components/MainPage';

// Force dynamic rendering (no static generation at build time)
export const dynamic = 'force-dynamic';

export default async function Home() {
  const sets = await fetchAllSets();

  return <MainPage sets={sets} />;
}
