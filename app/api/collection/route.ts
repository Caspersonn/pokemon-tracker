import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collectedCards = await prisma.collectedCard.findMany({
      where: { userId: session.user.id },
    });

    // Transform to the format expected by the frontend
    const collection: Record<string, Record<string, boolean>> = {};

    collectedCards.forEach((card) => {
      if (!collection[card.setId]) {
        collection[card.setId] = {};
      }
      collection[card.setId][card.cardId] = true;
    });

    return NextResponse.json({ collection });
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}
