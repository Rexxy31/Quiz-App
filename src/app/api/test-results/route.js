import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { userId, score } = await req.json();

    if (!userId || typeof score !== 'number') {
      return NextResponse.json({ message: 'User ID and score are required.' }, { status: 400 });
    }

    await prisma.testResult.create({
      data: {
        userId,
        score,
      },
    });

    return NextResponse.json({ message: 'Test result saved successfully.' }, { status: 201 });
  } catch (error) {
    console.error('Error saving test result:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
    try {
      const results = await prisma.testResult.findMany({
        orderBy: {
          score: 'desc',
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        take: 10, // Top 10 scores
      });
  
      return NextResponse.json(results, { status: 200 });
    } catch (error) {
      console.error('Error fetching test results:', error);
      return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    } finally {
      await prisma.$disconnect();
    }
  } 