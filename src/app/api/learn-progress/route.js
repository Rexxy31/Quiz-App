import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '../../../lib/prisma';

// Helper function to calculate streak
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

export async function GET(req) {
  const session = await getServerSession(authOptions);
  console.log('GET /api/learn-progress - Session:', session?.user?.email);
  
  if (!session || !session.user?.email) {
    console.log('GET /api/learn-progress - Unauthorized');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { learnProgress: true },
  });

  console.log('GET /api/learn-progress - User found:', !!user, 'LearnProgress:', !!user?.learnProgress);

  if (!user || !user.learnProgress) {
    console.log('GET /api/learn-progress - Returning empty array');
    return new Response(JSON.stringify({ 
      answeredIds: [], 
      correctIds: [],
      currentStreak: 0,
      longestStreak: 0
    }), { status: 200 });
  }

  console.log('GET /api/learn-progress - Returning answeredIds:', user.learnProgress.answeredIds, 'correctIds:', user.learnProgress.correctIds);
  return new Response(JSON.stringify({ 
    answeredIds: user.learnProgress.answeredIds, 
    correctIds: user.learnProgress.correctIds || [],
    currentStreak: user.learnProgress.currentStreak || 0,
    longestStreak: user.learnProgress.longestStreak || 0
  }), { status: 200 });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  console.log('POST /api/learn-progress - Session:', session?.user?.email);
  
  if (!session || !session.user?.email) {
    console.log('POST /api/learn-progress - Unauthorized');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { learnProgress: true },
  });
  
  console.log('POST /api/learn-progress - User found:', !!user);
  
  if (!user) {
    console.log('POST /api/learn-progress - User not found');
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }

  const { answeredIds, correctIds } = await req.json();
  console.log('POST /api/learn-progress - Received answeredIds:', answeredIds, 'correctIds:', correctIds);
  
  if (!Array.isArray(answeredIds) || (correctIds && !Array.isArray(correctIds))) {
    console.log('POST /api/learn-progress - Invalid answeredIds or correctIds');
    return new Response(JSON.stringify({ error: 'Invalid answeredIds or correctIds' }), { status: 400 });
  }

  // Calculate new streak
  const existingProgress = user.learnProgress;
  const lastActivityDate = existingProgress?.lastActivityDate;
  const currentStreak = existingProgress?.currentStreak || 0;
  const longestStreak = existingProgress?.longestStreak || 0;
  
  const newStreak = calculateStreak(lastActivityDate, currentStreak);
  const newLongestStreak = Math.max(longestStreak, newStreak);

  const progress = await prisma.learnProgress.upsert({
    where: { userId: user.id },
    update: { 
      answeredIds, 
      correctIds: correctIds || [],
      lastActivityDate: new Date(),
      currentStreak: newStreak,
      longestStreak: newLongestStreak
    },
    create: { 
      userId: user.id, 
      answeredIds, 
      correctIds: correctIds || [],
      lastActivityDate: new Date(),
      currentStreak: 1,
      longestStreak: 1
    },
  });

  console.log('POST /api/learn-progress - Progress saved:', progress);
  return new Response(JSON.stringify({ 
    success: true,
    currentStreak: newStreak,
    longestStreak: newLongestStreak
  }), { status: 200 });
} 