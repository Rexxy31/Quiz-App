import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Helper function to calculate streak (same as in learn-progress)
function calculateStreak(lastActivityDate, currentStreak) {
  if (!lastActivityDate) return 0;
  
  const today = new Date();
  const lastActivity = new Date(lastActivityDate);
  
  // Reset time to compare only dates
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lastActivityDateOnly = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
  
  const diffTime = todayDate.getTime() - lastActivityDateOnly.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Same day, maintain current streak
    return currentStreak;
  } else if (diffDays === 1) {
    // Yesterday, increment streak
    return currentStreak + 1;
  } else {
    // More than 1 day gap, reset streak
    return 1;
  }
}

export async function POST(req) {
  try {
    const { userId, score } = await req.json();

    if (!userId || typeof score !== 'number') {
      return NextResponse.json({ message: 'User ID and score are required.' }, { status: 400 });
    }

    // Create test result
    await prisma.testResult.create({
      data: {
        userId,
        score,
      },
    });

    // Update streak for the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { learnProgress: true },
    });

    if (user && user.learnProgress) {
      const existingProgress = user.learnProgress;
      const lastActivityDate = existingProgress.lastActivityDate;
      const currentStreak = existingProgress.currentStreak || 0;
      const longestStreak = existingProgress.longestStreak || 0;
      
      const newStreak = calculateStreak(lastActivityDate, currentStreak);
      const newLongestStreak = Math.max(longestStreak, newStreak);

      await prisma.learnProgress.update({
        where: { userId },
        data: {
          lastActivityDate: new Date(),
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
        },
      });
    } else if (user) {
      // Create learn progress if it doesn't exist
      await prisma.learnProgress.create({
        data: {
          userId,
          answeredIds: [],
          correctIds: [],
          lastActivityDate: new Date(),
          currentStreak: 1,
          longestStreak: 1,
        },
      });
    }

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