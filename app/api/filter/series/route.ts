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

    const filterSeries = await prisma.filterSeries.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      series: filterSeries.map((fs) => fs.seriesId),
    });
  } catch (error) {
    console.error('Error fetching filter series:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter series' },
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

    const { series } = await req.json();

    if (!Array.isArray(series)) {
      return NextResponse.json(
        { error: 'series must be an array' },
        { status: 400 }
      );
    }

    // Delete existing filter series
    await prisma.filterSeries.deleteMany({
      where: { userId: session.user.id },
    });

    // Create new filter series
    if (series.length > 0) {
      await prisma.filterSeries.createMany({
        data: series.map((seriesId) => ({
          userId: session.user.id,
          seriesId,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving filter series:', error);
    return NextResponse.json(
      { error: 'Failed to save filter series' },
      { status: 500 }
    );
  }
}
