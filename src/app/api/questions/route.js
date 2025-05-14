import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const questions = await prisma.questions.findMany({
      include: {
        options: true,
        correct_answers: true,
      },
    });

    return Response.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
