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

    // Check if card is already needed
    const existing = await prisma.neededCard.findUnique({
      where: {
        userId_setId_cardId: {
          userId: user.id,
          setId,
          cardId,
        },
      },
    });

    let needed: boolean;

    if (existing) {
      // Remove from needed
      await prisma.neededCard.delete({
        where: { id: existing.id },
      });
      needed = false;
    } else {
      // Add to needed
      await prisma.neededCard.create({
        data: {
          userId: user.id,
          setId,
          cardId,
        },
      });
      needed = true;
    }

    return NextResponse.json({ needed });
  } catch (error) {
    console.error('Error toggling need card:', error);
    return NextResponse.json(
      { error: 'Failed to toggle need card' },
      { status: 500 }
    );
  }
}
