import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const wantedCards = await prisma.wantedCard.findMany({
      where: { userId: user.id },
    });

    // Transform to CollectionData format
    const wantCards: Record<string, Record<string, boolean>> = {};
    wantedCards.forEach((card) => {
      if (!wantCards[card.setId]) {
        wantCards[card.setId] = {};
      }
      wantCards[card.setId][card.cardId] = true;
    });

    return NextResponse.json({ wantCards });
  } catch (error) {
    console.error('Error fetching wanted cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wanted cards' },
      { status: 500 }
    );
  }
}
