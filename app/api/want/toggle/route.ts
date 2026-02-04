import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { setId, cardId } = body;

    if (!setId || !cardId) {
      return NextResponse.json(
        { error: 'setId and cardId are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if card is already wanted
    const existing = await prisma.wantedCard.findUnique({
      where: {
        userId_setId_cardId: {
          userId: user.id,
          setId,
          cardId,
        },
      },
    });

    let wanted: boolean;

    if (existing) {
      // Remove from wanted
      await prisma.wantedCard.delete({
        where: { id: existing.id },
      });
      wanted = false;
    } else {
      // Add to wanted
      await prisma.wantedCard.create({
        data: {
          userId: user.id,
          setId,
          cardId,
        },
      });
      wanted = true;
    }

    return NextResponse.json({ wanted });
  } catch (error) {
    console.error('Error toggling want card:', error);
    return NextResponse.json(
      { error: 'Failed to toggle want card' },
      { status: 500 }
    );
  }
}
