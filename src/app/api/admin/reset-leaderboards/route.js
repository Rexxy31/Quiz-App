import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function DELETE(req) {
  const session = await auth();

  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.testResult.deleteMany({});
    return NextResponse.json({ message: 'Leaderboards have been successfully reset.' }, { status: 200 });
  } catch (error) {
    console.error('Error resetting leaderboards:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
} 