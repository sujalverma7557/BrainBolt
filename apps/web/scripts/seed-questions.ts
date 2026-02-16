import { createHash } from 'crypto';
import { db } from '../lib/db';
import { questions } from '../lib/db/schema';

function hashAnswer(answer: string): string {
  return createHash('sha256').update(answer.trim().toLowerCase()).digest('hex');
}

const SEED_QUESTIONS: Array<{
  difficulty: number;
  prompt: string;
  choices: string[];
  correctIndex: number;
  tags?: string[];
}> = [
  // Difficulty 1
  { difficulty: 1, prompt: 'What is 2 + 2?', choices: ['3', '4', '5', '6'], correctIndex: 1, tags: ['math'] },
  { difficulty: 1, prompt: 'Which planet is closest to the Sun?', choices: ['Venus', 'Mercury', 'Earth', 'Mars'], correctIndex: 1, tags: ['science'] },
  { difficulty: 1, prompt: 'How many days are in a week?', choices: ['5', '6', '7', '8'], correctIndex: 2, tags: ['general'] },
  { difficulty: 1, prompt: 'What color is the sky on a clear day?', choices: ['Green', 'Red', 'Blue', 'Yellow'], correctIndex: 2, tags: ['general'] },
  { difficulty: 1, prompt: 'Which is the largest ocean?', choices: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correctIndex: 2, tags: ['geography'] },
  // Difficulty 2
  { difficulty: 2, prompt: 'What is 15% of 200?', choices: ['20', '30', '25', '35'], correctIndex: 1, tags: ['math'] },
  { difficulty: 2, prompt: 'Who wrote "Romeo and Juliet"?', choices: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], correctIndex: 1, tags: ['literature'] },
  { difficulty: 2, prompt: 'What is the capital of France?', choices: ['Lyon', 'Marseille', 'Paris', 'Nice'], correctIndex: 2, tags: ['geography'] },
  { difficulty: 2, prompt: 'How many continents are there?', choices: ['5', '6', '7', '8'], correctIndex: 2, tags: ['geography'] },
  { difficulty: 2, prompt: 'What is the chemical symbol for gold?', choices: ['Go', 'Gd', 'Au', 'Ag'], correctIndex: 2, tags: ['science'] },
  // Difficulty 3
  { difficulty: 3, prompt: 'Solve for x: 2x + 4 = 12', choices: ['x = 2', 'x = 4', 'x = 6', 'x = 8'], correctIndex: 1, tags: ['math'] },
  { difficulty: 3, prompt: 'In which year did World War II end?', choices: ['1943', '1944', '1945', '1946'], correctIndex: 2, tags: ['history'] },
  { difficulty: 3, prompt: 'What is the speed of light in vacuum (approximately)?', choices: ['299,792 km/s', '150,000 km/s', '500,000 km/s', '100,000 km/s'], correctIndex: 0, tags: ['science'] },
  { difficulty: 3, prompt: 'Which element has the atomic number 6?', choices: ['Nitrogen', 'Carbon', 'Oxygen', 'Boron'], correctIndex: 1, tags: ['science'] },
  { difficulty: 3, prompt: 'What is the derivative of x^2?', choices: ['x', '2x', '2', 'x^3/3'], correctIndex: 1, tags: ['math'] },
  // Difficulty 4
  { difficulty: 4, prompt: 'What is the integral of 1/x dx?', choices: ['x^2', 'ln|x|', '1/x^2', 'e^x'], correctIndex: 1, tags: ['math'] },
  { difficulty: 4, prompt: 'Who developed the theory of general relativity?', choices: ['Newton', 'Einstein', 'Bohr', 'Hawking'], correctIndex: 1, tags: ['science'] },
  { difficulty: 4, prompt: 'Which country is home to the Kangaroo?', choices: ['New Zealand', 'South Africa', 'Australia', 'India'], correctIndex: 2, tags: ['geography'] },
  { difficulty: 4, prompt: 'What is the smallest prime number?', choices: ['0', '1', '2', '3'], correctIndex: 2, tags: ['math'] },
  { difficulty: 4, prompt: 'In programming, what does API stand for?', choices: ['Application Program Interface', 'Advanced Programming Interface', 'Automated Program Integration', 'Application Protocol Interface'], correctIndex: 0, tags: ['tech'] },
  // Difficulty 5
  { difficulty: 5, prompt: 'What is the time complexity of binary search?', choices: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 5, prompt: 'Which protocol is used for secure HTTP?', choices: ['FTP', 'HTTPS', 'SMTP', 'HTTP'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 5, prompt: 'What does CPU stand for?', choices: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Processing Unit'], correctIndex: 0, tags: ['tech'] },
  { difficulty: 5, prompt: 'Which data structure uses LIFO?', choices: ['Queue', 'Stack', 'Array', 'Linked List'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 5, prompt: 'What is 7 * 8?', choices: ['54', '56', '58', '64'], correctIndex: 1, tags: ['math'] },
  // Difficulties 6-10 (more questions)
  { difficulty: 6, prompt: 'What is the capital of Japan?', choices: ['Seoul', 'Beijing', 'Tokyo', 'Osaka'], correctIndex: 2, tags: ['geography'] },
  { difficulty: 6, prompt: 'Which language is React.js written in?', choices: ['Java', 'Python', 'JavaScript', 'C++'], correctIndex: 2, tags: ['tech'] },
  { difficulty: 7, prompt: 'What is the largest mammal?', choices: ['Elephant', 'Blue Whale', 'Giraffe', 'Polar Bear'], correctIndex: 1, tags: ['science'] },
  { difficulty: 7, prompt: 'In which layer of the OSI model does TCP operate?', choices: ['Physical', 'Network', 'Transport', 'Application'], correctIndex: 2, tags: ['tech'] },
  { difficulty: 8, prompt: 'What is the value of Pi to 2 decimal places?', choices: ['3.14', '3.41', '3.15', '3.12'], correctIndex: 0, tags: ['math'] },
  { difficulty: 8, prompt: 'Which algorithm is used for shortest path in a graph?', choices: ['Bubble Sort', "Dijkstra's", 'Binary Search', 'Quick Sort'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 9, prompt: 'What is the atomic number of Uranium?', choices: ['90', '91', '92', '93'], correctIndex: 2, tags: ['science'] },
  { difficulty: 9, prompt: 'Who painted the Mona Lisa?', choices: ['Van Gogh', 'Picasso', 'Leonardo da Vinci', 'Rembrandt'], correctIndex: 2, tags: ['art'] },
  { difficulty: 10, prompt: 'What is the time complexity of merge sort?', choices: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 10, prompt: 'Which theorem states that no three positive integers a, b, c satisfy a^n + b^n = c^n for n > 2?', choices: ['Pythagorean', "Fermat's Last", "Euler's", "Gauss's"], correctIndex: 1, tags: ['math'] },
];

async function seed() {
  console.log('Seeding questions...');
  for (const q of SEED_QUESTIONS) {
    const correctChoice = q.choices[q.correctIndex];
    await db.insert(questions).values({
      difficulty: q.difficulty,
      prompt: q.prompt,
      choices: q.choices,
      correctAnswerHash: hashAnswer(correctChoice),
      tags: q.tags || [],
    });
  }
  console.log('Seeded', SEED_QUESTIONS.length, 'questions.');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
