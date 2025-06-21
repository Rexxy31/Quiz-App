import { PrismaClient } from '@prisma/client';

let prisma;

try {
  console.log('Creating PrismaClient...');
  prisma = new PrismaClient();
  console.log('PrismaClient created successfully');
} catch (error) {
  console.error('Error creating PrismaClient:', error);
  prisma = null;
}

export async function GET(request) {
  try {
    console.log('Attempting to fetch questions from database...');
    console.log('Prisma client:', prisma ? 'Available' : 'Not available');
    
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }
    
    const questions = await prisma.question.findMany({
      include: {
        correct_answers: true,
      },
    });

    console.log(`Successfully fetched ${questions.length} questions`);

    // Transform the data to match the expected format in the frontend
    const transformedQuestions = questions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      options: q.options, // This is already in the correct format from the JSON field
      correct_answers: q.correct_answers,
    }));

    return Response.json(transformedQuestions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return new Response('Internal Server Error', { status: 500 });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}
