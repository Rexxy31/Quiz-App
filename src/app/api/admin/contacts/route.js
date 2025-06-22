import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ message: 'ID and status are required.' }, { status: 400 });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 