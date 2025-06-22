import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    // Create contact submission
    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        subject,
        message,
        status: 'PENDING'
      },
    });

    return NextResponse.json({ 
      message: 'Contact form submitted successfully.',
      id: contact.id 
    }, { status: 201 });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 