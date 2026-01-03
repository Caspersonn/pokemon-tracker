import { fetchSetCards, fetchAllSets } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import CardGrid from '@/components/CardGrid';

interface SetPageProps {
  params: Promise<{ setId: string }>;
}

export default async function SetPage({ params }: SetPageProps) {
  const { setId } = await params;
  const cards = await fetchSetCards(setId);

  // Get set info from cards
  const setInfo = cards[0]?.set;

  if (!cards || cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Set not found
          </h1>
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to all sets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Back to all sets
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {setInfo?.name || 'Card Set'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {cards.length} cards in this set
              </p>
            </div>

            <Link
              href={`/set/${setId}/checklist`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
            >
              View Checklist
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CardGrid cards={cards} setId={setId} />
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  const sets = await fetchAllSets();
  return sets.map((set) => ({
    setId: set.id,
  }));
}
