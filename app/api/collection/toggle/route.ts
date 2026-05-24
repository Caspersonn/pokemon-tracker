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

    const { setId, cardId, action, amount: setAmount } = await req.json();

    if (!setId || !cardId) {
      return NextResponse.json(
        { error: 'setId and cardId are required' },
        { status: 400 }
      );
    }

    const where = {
      userId_setId_cardId: {
        userId: session.user.id,
        setId,
        cardId,
      },
    };

    const existingCard = await prisma.collectedCard.findUnique({ where });

    if (action === 'increment') {
      if (existingCard) {
        const updated = await prisma.collectedCard.update({
          where: { id: existingCard.id },
          data: { amount: existingCard.amount + 1 },
        });
        return NextResponse.json({ collected: true, amount: updated.amount });
      } else {
        await prisma.collectedCard.create({
          data: { userId: session.user.id, setId, cardId, amount: 1 },
        });
        return NextResponse.json({ collected: true, amount: 1 });
      }
    }

    if (action === 'decrement') {
      if (!existingCard) {
        return NextResponse.json({ collected: false, amount: 0 });
      }
      if (existingCard.amount <= 1) {
        await prisma.collectedCard.delete({ where: { id: existingCard.id } });
        return NextResponse.json({ collected: false, amount: 0 });
      }
      const updated = await prisma.collectedCard.update({
        where: { id: existingCard.id },
        data: { amount: existingCard.amount - 1 },
      });
      return NextResponse.json({ collected: true, amount: updated.amount });
    }

    if (action === 'set') {
      const targetAmount = typeof setAmount === 'number' ? setAmount : 0;
      if (targetAmount <= 0) {
        if (existingCard) {
          await prisma.collectedCard.delete({ where: { id: existingCard.id } });
        }
        return NextResponse.json({ collected: false, amount: 0 });
      }
      if (existingCard) {
        const updated = await prisma.collectedCard.update({
          where: { id: existingCard.id },
          data: { amount: targetAmount },
        });
        return NextResponse.json({ collected: true, amount: updated.amount });
      } else {
        await prisma.collectedCard.create({
          data: { userId: session.user.id, setId, cardId, amount: targetAmount },
        });
        return NextResponse.json({ collected: true, amount: targetAmount });
      }
    }

    // Default: legacy toggle behavior
    if (existingCard) {
      await prisma.collectedCard.delete({ where: { id: existingCard.id } });
      return NextResponse.json({ collected: false, amount: 0 });
    } else {
      await prisma.collectedCard.create({
        data: { userId: session.user.id, setId, cardId, amount: 1 },
      });
      return NextResponse.json({ collected: true, amount: 1 });
    }
  } catch (error) {
    console.error('Error toggling card:', error);
    return NextResponse.json(
      { error: 'Failed to toggle card' },
      { status: 500 }
    );
  }
}
