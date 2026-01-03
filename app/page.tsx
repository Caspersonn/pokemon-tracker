import { fetchAllSets } from '@/lib/api';
import MainPage from '@/components/MainPage';

export default async function Home() {
  const sets = await fetchAllSets();

  return <MainPage sets={sets} />;
}
