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

    const wishlistSets = await prisma.wishlistSet.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      sets: wishlistSets.map((ws) => ws.setId),
    });
  } catch (error) {
    console.error('Error fetching wishlist sets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist sets' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sets } = await req.json();

    if (!Array.isArray(sets)) {
      return NextResponse.json(
        { error: 'sets must be an array' },
        { status: 400 }
      );
    }

    // Delete existing wishlist sets
    await prisma.wishlistSet.deleteMany({
      where: { userId: session.user.id },
    });

    // Create new wishlist sets
    if (sets.length > 0) {
      await prisma.wishlistSet.createMany({
        data: sets.map((setId) => ({
          userId: session.user.id,
          setId,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving wishlist sets:', error);
    return NextResponse.json(
      { error: 'Failed to save wishlist sets' },
      { status: 500 }
    );
  }
}
