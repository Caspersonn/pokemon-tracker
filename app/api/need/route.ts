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

    const neededCards = await prisma.neededCard.findMany({
      where: { userId: user.id },
    });

    // Transform to CollectionData format
    const needCards: Record<string, Record<string, boolean>> = {};
    neededCards.forEach((card) => {
      if (!needCards[card.setId]) {
        needCards[card.setId] = {};
      }
      needCards[card.setId][card.cardId] = true;
    });

    return NextResponse.json({ needCards });
  } catch (error) {
    console.error('Error fetching needed cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch needed cards' },
      { status: 500 }
    );
  }
}
