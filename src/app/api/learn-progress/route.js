import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '../../../lib/prisma';

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
    return new Response(JSON.stringify({ answeredIds: [] }), { status: 200 });
  }

  console.log('GET /api/learn-progress - Returning answeredIds:', user.learnProgress.answeredIds);
  return new Response(JSON.stringify({ answeredIds: user.learnProgress.answeredIds }), { status: 200 });
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
  });
  
  console.log('POST /api/learn-progress - User found:', !!user);
  
  if (!user) {
    console.log('POST /api/learn-progress - User not found');
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }

  const { answeredIds } = await req.json();
  console.log('POST /api/learn-progress - Received answeredIds:', answeredIds);
  
  if (!Array.isArray(answeredIds)) {
    console.log('POST /api/learn-progress - Invalid answeredIds');
    return new Response(JSON.stringify({ error: 'Invalid answeredIds' }), { status: 400 });
  }

  const progress = await prisma.learnProgress.upsert({
    where: { userId: user.id },
    update: { answeredIds },
    create: { userId: user.id, answeredIds },
  });

  console.log('POST /api/learn-progress - Progress saved:', progress);
  return new Response(JSON.stringify({ success: true }), { status: 200 });
} 