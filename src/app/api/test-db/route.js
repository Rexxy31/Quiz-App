import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Test a simple query
    const questionCount = await prisma.question.count();
    
    console.log(`Database connection successful. Found ${questionCount} questions.`);
    
    return Response.json({ 
      success: true, 
      message: 'Database connection working',
      questionCount 
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 