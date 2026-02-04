import { fetchSetCards } from '@/lib/api';
import Link from 'next/link';
import ChecklistGrid from '@/components/ChecklistGrid';

interface ChecklistPageProps {
  params: Promise<{ setId: string }>;
}

// Force dynamic rendering (no static generation at build time)
export const dynamic = 'force-dynamic';

export default async function ChecklistPage({ params }: ChecklistPageProps) {
  const { setId } = await params;
  const cards = await fetchSetCards(setId);

  const setInfo = cards[0]?.set;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/set/${setId}`}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Back to set
          </Link>

          <div className="mt-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Checklist: {setInfo?.name || 'Card Set'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Cards you still need to collect
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ChecklistGrid cards={cards} setId={setId} />
      </main>
    </div>
  );
}
