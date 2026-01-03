import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { setId, cardId } = await req.json();

    if (!setId || !cardId) {
      return NextResponse.json(
        { error: 'setId and cardId are required' },
        { status: 400 }
      );
    }

    // Check if card is already collected
    const existingCard = await prisma.collectedCard.findUnique({
      where: {
        userId_setId_cardId: {
          userId: session.user.id,
          setId,
          cardId,
        },
      },
    });

    if (existingCard) {
      // Remove from collection
      await prisma.collectedCard.delete({
        where: { id: existingCard.id },
      });

      return NextResponse.json({ collected: false });
    } else {
      // Add to collection
      await prisma.collectedCard.create({
        data: {
          userId: session.user.id,
          setId,
          cardId,
        },
      });

      return NextResponse.json({ collected: true });
    }
  } catch (error) {
    console.error('Error toggling card:', error);
    return NextResponse.json(
      { error: 'Failed to toggle card' },
      { status: 500 }
    );
  }
}
