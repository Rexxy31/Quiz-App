const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Function to clean text and remove invalid UTF-8 characters
function cleanText(text) {
  if (!text) return '';
  // Remove null bytes and other invalid characters
  return text.replace(/\0/g, '').trim();
}

async function main() {
  // IMPORTANT: Make sure this path is correct.
  // This is the path you provided from your attached file.
  const filePath = path.join('c:', 'Users', 'there', 'Pictures', 'output_questions.json');

  console.log(`Reading data from: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: The file was not found at the specified path.`);
    console.error(`Please make sure the file exists or update the 'filePath' variable in this script.`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  // The JSON file seems to be an array of question objects.
  const questionsData = JSON.parse(fileContent);
  
  console.log(`Found ${questionsData.length} questions to import.`);

  let importedCount = 0;
  let skippedCount = 0;
  
  for (const qData of questionsData) {
    // Basic validation
    if (!qData.question || !qData.options || !qData.correct_answer) {
        console.warn('Skipping malformed question object:', qData);
        skippedCount++;
        continue;
    }
    
    try {
      // Clean the question text
      const cleanQuestionText = cleanText(qData.question);
      
      // Clean the options
      const cleanOptions = qData.options.map(opt => ({
        option: cleanText(opt.option),
        text: cleanText(opt.text)
      }));
      
      // Clean the correct answer
      const cleanCorrectAnswer = cleanText(qData.correct_answer);
      
      await prisma.question.create({
        data: {
          question_text: cleanQuestionText,
          options: cleanOptions, // Storing the options array as a JSON object
          correct_answers: {
            create: {
              correct_option: cleanCorrectAnswer,
            },
          },
        },
      });
      importedCount++;
      
      if (importedCount % 50 === 0) {
        console.log(`Imported ${importedCount} questions so far...`);
      }
    } catch (error) {
      console.error(`Error importing question:`, error.message);
      console.error(`Question data:`, qData);
      skippedCount++;
    }
  }

  console.log(`\nSeeding finished.`);
  console.log(`Successfully imported: ${importedCount} questions`);
  console.log(`Skipped: ${skippedCount} questions`);
}

main()
  .catch((e) => {
    console.error("\nAn error occurred during seeding:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 