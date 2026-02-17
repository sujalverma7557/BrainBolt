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

  // More Difficulty 1
  { difficulty: 1, prompt: 'What is 3 + 5?', choices: ['6', '7', '8', '9'], correctIndex: 2, tags: ['math'] },
  { difficulty: 1, prompt: 'How many legs does a spider have?', choices: ['6', '8', '10', '12'], correctIndex: 1, tags: ['science'] },
  { difficulty: 1, prompt: 'What is the first month of the year?', choices: ['February', 'January', 'March', 'April'], correctIndex: 1, tags: ['general'] },
  { difficulty: 1, prompt: 'Which animal says "moo"?', choices: ['Pig', 'Cow', 'Sheep', 'Horse'], correctIndex: 1, tags: ['general'] },
  { difficulty: 1, prompt: 'What is 10 - 4?', choices: ['4', '5', '6', '7'], correctIndex: 2, tags: ['math'] },
  { difficulty: 1, prompt: 'Which shape has three sides?', choices: ['Square', 'Triangle', 'Circle', 'Rectangle'], correctIndex: 1, tags: ['math'] },
  { difficulty: 1, prompt: 'What do bees make?', choices: ['Milk', 'Honey', 'Butter', 'Cheese'], correctIndex: 1, tags: ['science'] },
  { difficulty: 1, prompt: 'How many hours are in a day?', choices: ['12', '24', '48', '36'], correctIndex: 1, tags: ['general'] },
  { difficulty: 1, prompt: 'Which is a fruit?', choices: ['Carrot', 'Apple', 'Broccoli', 'Potato'], correctIndex: 1, tags: ['general'] },
  { difficulty: 1, prompt: 'What is the opposite of hot?', choices: ['Warm', 'Cold', 'Mild', 'Cool'], correctIndex: 1, tags: ['general'] },

  // More Difficulty 2
  { difficulty: 2, prompt: 'What is the capital of Germany?', choices: ['Munich', 'Berlin', 'Hamburg', 'Frankfurt'], correctIndex: 1, tags: ['geography'] },
  { difficulty: 2, prompt: 'How many sides does a hexagon have?', choices: ['5', '6', '7', '8'], correctIndex: 1, tags: ['math'] },
  { difficulty: 2, prompt: 'Which planet is known as the Red Planet?', choices: ['Venus', 'Jupiter', 'Mars', 'Saturn'], correctIndex: 2, tags: ['science'] },
  { difficulty: 2, prompt: 'What is 12 × 3?', choices: ['34', '35', '36', '37'], correctIndex: 2, tags: ['math'] },
  { difficulty: 2, prompt: 'Who wrote "Hamlet"?', choices: ['Charles Dickens', 'William Shakespeare', 'Oscar Wilde', 'George Orwell'], correctIndex: 1, tags: ['literature'] },
  { difficulty: 2, prompt: 'What is the chemical symbol for water?', choices: ['H2O', 'CO2', 'O2', 'NaCl'], correctIndex: 0, tags: ['science'] },
  { difficulty: 2, prompt: 'Which ocean is the largest?', choices: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correctIndex: 2, tags: ['geography'] },
  { difficulty: 2, prompt: 'How many legs does an insect have?', choices: ['4', '6', '8', '10'], correctIndex: 1, tags: ['science'] },
  { difficulty: 2, prompt: 'What is the square root of 64?', choices: ['6', '7', '8', '9'], correctIndex: 2, tags: ['math'] },
  { difficulty: 2, prompt: 'Which country has the Eiffel Tower?', choices: ['Italy', 'Spain', 'France', 'Germany'], correctIndex: 2, tags: ['geography'] },

  // More Difficulty 3
  { difficulty: 3, prompt: 'What is the capital of Australia?', choices: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], correctIndex: 2, tags: ['geography'] },
  { difficulty: 3, prompt: 'Solve for x: 3x - 6 = 9', choices: ['x = 3', 'x = 4', 'x = 5', 'x = 6'], correctIndex: 2, tags: ['math'] },
  { difficulty: 3, prompt: 'Which gas do plants absorb from the air?', choices: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], correctIndex: 2, tags: ['science'] },
  { difficulty: 3, prompt: 'In which century did the French Revolution begin?', choices: ['16th', '17th', '18th', '19th'], correctIndex: 2, tags: ['history'] },
  { difficulty: 3, prompt: 'What is the largest organ of the human body?', choices: ['Heart', 'Liver', 'Skin', 'Brain'], correctIndex: 2, tags: ['science'] },
  { difficulty: 3, prompt: 'What is 2^5?', choices: ['16', '32', '64', '128'], correctIndex: 1, tags: ['math'] },
  { difficulty: 3, prompt: 'Which country invented paper?', choices: ['Japan', 'India', 'China', 'Egypt'], correctIndex: 2, tags: ['history'] },
  { difficulty: 3, prompt: 'What is the boiling point of water in Celsius?', choices: ['90°C', '100°C', '110°C', '120°C'], correctIndex: 1, tags: ['science'] },
  { difficulty: 3, prompt: 'How many bones are in the adult human body?', choices: ['186', '206', '226', '246'], correctIndex: 1, tags: ['science'] },
  { difficulty: 3, prompt: 'What is the derivative of sin(x)?', choices: ['-cos(x)', 'cos(x)', '-sin(x)', 'tan(x)'], correctIndex: 1, tags: ['math'] },

  // More Difficulty 4
  { difficulty: 4, prompt: 'What is the capital of Brazil?', choices: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], correctIndex: 2, tags: ['geography'] },
  { difficulty: 4, prompt: 'Which programming paradigm does React follow?', choices: ['Imperative', 'Declarative', 'Procedural', 'Object-only'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 4, prompt: 'What is the factorial of 5?', choices: ['100', '110', '120', '130'], correctIndex: 2, tags: ['math'] },
  { difficulty: 4, prompt: 'Who discovered penicillin?', choices: ['Marie Curie', 'Alexander Fleming', 'Louis Pasteur', 'Robert Koch'], correctIndex: 1, tags: ['science'] },
  { difficulty: 4, prompt: 'What does HTTP stand for?', choices: ['HyperText Transfer Protocol', 'High Transfer Text Protocol', 'Hyper Transfer Text Protocol', 'High Text Transfer Protocol'], correctIndex: 0, tags: ['tech'] },
  { difficulty: 4, prompt: 'Which planet has the most moons?', choices: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], correctIndex: 1, tags: ['science'] },
  { difficulty: 4, prompt: 'What is log₁₀(100)?', choices: ['1', '2', '10', '100'], correctIndex: 1, tags: ['math'] },
  { difficulty: 4, prompt: 'In which year did the Titanic sink?', choices: ['1910', '1911', '1912', '1913'], correctIndex: 2, tags: ['history'] },
  { difficulty: 4, prompt: 'What is a REST API?', choices: ['A type of database', 'An architectural style for web services', 'A programming language', 'An operating system'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 4, prompt: 'Which gas is most abundant in Earth\'s atmosphere?', choices: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Argon'], correctIndex: 2, tags: ['science'] },

  // More Difficulty 5
  { difficulty: 5, prompt: 'What is the time complexity of inserting at the end of a dynamic array (amortized)?', choices: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctIndex: 2, tags: ['tech'] },
  { difficulty: 5, prompt: 'Which HTML tag is used for the largest heading?', choices: ['<h2>', '<head>', '<h1>', '<heading>'], correctIndex: 2, tags: ['tech'] },
  { difficulty: 5, prompt: 'What is 2^10?', choices: ['512', '1024', '2048', '4096'], correctIndex: 1, tags: ['math'] },
  { difficulty: 5, prompt: 'Which sorting algorithm has O(n²) worst case?', choices: ['Merge sort', 'Quick sort', 'Bubble sort', 'Heap sort'], correctIndex: 2, tags: ['tech'] },
  { difficulty: 5, prompt: 'What is the main purpose of DNS?', choices: ['Encrypt data', 'Translate domain names to IP addresses', 'Store files', 'Send email'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 5, prompt: 'Which country has the most population?', choices: ['India', 'China', 'USA', 'Indonesia'], correctIndex: 0, tags: ['geography'] },
  { difficulty: 5, prompt: 'What does SQL stand for?', choices: ['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'System Query Language'], correctIndex: 0, tags: ['tech'] },
  { difficulty: 5, prompt: 'What is the sum of angles in a triangle?', choices: ['90°', '180°', '270°', '360°'], correctIndex: 1, tags: ['math'] },
  { difficulty: 5, prompt: 'Which protocol does email use for sending?', choices: ['POP3', 'IMAP', 'SMTP', 'FTP'], correctIndex: 2, tags: ['tech'] },
  { difficulty: 5, prompt: 'What is the smallest country in the world?', choices: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correctIndex: 1, tags: ['geography'] },

  // More Difficulty 6
  { difficulty: 6, prompt: 'What is the capital of Egypt?', choices: ['Alexandria', 'Cairo', 'Giza', 'Luxor'], correctIndex: 1, tags: ['geography'] },
  { difficulty: 6, prompt: 'Which framework uses a virtual DOM?', choices: ['jQuery', 'React', 'AngularJS 1.x', 'Backbone'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 6, prompt: 'What is the chemical symbol for silver?', choices: ['Si', 'Sv', 'Ag', 'Au'], correctIndex: 2, tags: ['science'] },
  { difficulty: 6, prompt: 'How many bits are in a byte?', choices: ['4', '8', '16', '32'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 6, prompt: 'Which river is the longest in the world?', choices: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correctIndex: 1, tags: ['geography'] },
  { difficulty: 6, prompt: 'What is the default port for HTTPS?', choices: ['80', '443', '8080', '8443'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 6, prompt: 'Who wrote "1984"?', choices: ['Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'H.G. Wells'], correctIndex: 1, tags: ['literature'] },
  { difficulty: 6, prompt: 'What is the atomic number of oxygen?', choices: ['6', '7', '8', '9'], correctIndex: 2, tags: ['science'] },
  { difficulty: 6, prompt: 'Which data structure is used in BFS?', choices: ['Stack', 'Queue', 'Array', 'Heap'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 6, prompt: 'What is the speed of sound in air (approx)?', choices: ['330 m/s', '343 m/s', '350 m/s', '400 m/s'], correctIndex: 1, tags: ['science'] },

  // More Difficulty 7
  { difficulty: 7, prompt: 'What is the capital of Russia?', choices: ['St. Petersburg', 'Moscow', 'Kazan', 'Sochi'], correctIndex: 1, tags: ['geography'] },
  { difficulty: 7, prompt: 'Which design pattern ensures a class has only one instance?', choices: ['Factory', 'Singleton', 'Observer', 'Decorator'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 7, prompt: 'What is the time complexity of hash table lookup (average)?', choices: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'], correctIndex: 2, tags: ['tech'] },
  { difficulty: 7, prompt: 'Who formulated the laws of motion?', choices: ['Galileo', 'Newton', 'Kepler', 'Copernicus'], correctIndex: 1, tags: ['science'] },
  { difficulty: 7, prompt: 'What is the largest desert in the world?', choices: ['Sahara', 'Arabian', 'Antarctic', 'Gobi'], correctIndex: 2, tags: ['geography'] },
  { difficulty: 7, prompt: 'Which HTTP method is idempotent?', choices: ['POST', 'PUT', 'PATCH', 'DELETE'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 7, prompt: 'What is the value of e (Euler\'s number) to 2 decimal places?', choices: ['2.71', '2.72', '2.73', '2.74'], correctIndex: 0, tags: ['math'] },
  { difficulty: 7, prompt: 'In which year did the Berlin Wall fall?', choices: ['1987', '1988', '1989', '1990'], correctIndex: 2, tags: ['history'] },
  { difficulty: 7, prompt: 'What does ACID stand for in databases?', choices: ['Atomicity, Consistency, Isolation, Durability', 'Access, Consistency, Integrity, Data', 'Atomic, Consistent, Independent, Durable', 'None of these'], correctIndex: 0, tags: ['tech'] },
  { difficulty: 7, prompt: 'Which element has the symbol K?', choices: ['Calcium', 'Potassium', 'Phosphorus', 'Krypton'], correctIndex: 1, tags: ['science'] },

  // More Difficulty 8
  { difficulty: 8, prompt: 'What is the capital of South Korea?', choices: ['Busan', 'Seoul', 'Incheon', 'Daegu'], correctIndex: 1, tags: ['geography'] },
  { difficulty: 8, prompt: 'What is the time complexity of building a heap from n elements?', choices: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctIndex: 0, tags: ['tech'] },
  { difficulty: 8, prompt: 'Which algorithm finds strongly connected components?', choices: ['Kruskal', 'Kosaraju', 'Prim', 'Bellman-Ford'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 8, prompt: 'What is the charge of an electron?', choices: ['Positive', 'Negative', 'Neutral', 'Variable'], correctIndex: 1, tags: ['science'] },
  { difficulty: 8, prompt: 'Who developed the first programmable computer (Z3)?', choices: ['Alan Turing', 'Konrad Zuse', 'John von Neumann', 'Charles Babbage'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 8, prompt: 'What is the derivative of e^x?', choices: ['xe^(x-1)', 'e^x', 'ln(x)', '1/x'], correctIndex: 1, tags: ['math'] },
  { difficulty: 8, prompt: 'Which sorting is stable?', choices: ['Quick sort', 'Heap sort', 'Merge sort', 'Shell sort'], correctIndex: 2, tags: ['tech'] },
  { difficulty: 8, prompt: 'What is the atomic mass of carbon-12 (approx)?', choices: ['10', '11', '12', '13'], correctIndex: 2, tags: ['science'] },
  { difficulty: 8, prompt: 'In Big-O, what is the complexity of matrix multiplication (naive)?', choices: ['O(n²)', 'O(n².37)', 'O(n³)', 'O(n log n)'], correctIndex: 2, tags: ['tech'] },
  { difficulty: 8, prompt: 'Which theorem relates sides of a right triangle?', choices: ['Fermat', 'Pythagorean', 'Euler', 'Bayes'], correctIndex: 1, tags: ['math'] },

  // More Difficulty 9
  { difficulty: 9, prompt: 'What is the capital of Canada?', choices: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], correctIndex: 2, tags: ['geography'] },
  { difficulty: 9, prompt: 'What is the time complexity of the fastest general sorting algorithm?', choices: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 9, prompt: 'Who proved the incompleteness theorems?', choices: ['Russell', 'Gödel', 'Hilbert', 'Turing'], correctIndex: 1, tags: ['math'] },
  { difficulty: 9, prompt: 'Which particle is responsible for the strong force?', choices: ['Photon', 'Gluon', 'W boson', 'Higgs'], correctIndex: 1, tags: ['science'] },
  { difficulty: 9, prompt: 'What is the halting problem?', choices: ['A problem that can always be solved', 'Undecidable', 'NP-complete', 'P-complete'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 9, prompt: 'Which number is transcendental?', choices: ['√2', 'π', '0.5', '1/3'], correctIndex: 1, tags: ['math'] },
  { difficulty: 9, prompt: 'Who discovered radioactivity?', choices: ['Marie Curie', 'Henri Becquerel', 'Ernest Rutherford', 'Niels Bohr'], correctIndex: 1, tags: ['science'] },
  { difficulty: 9, prompt: 'What is the order of a full binary tree with 31 nodes (height)?', choices: ['3', '4', '5', '6'], correctIndex: 2, tags: ['tech'] },
  { difficulty: 9, prompt: 'Which country has the most time zones?', choices: ['USA', 'Russia', 'France', 'UK'], correctIndex: 2, tags: ['geography'] },
  { difficulty: 9, prompt: 'What does NP stand for in NP-complete?', choices: ['Non-Polynomial', 'Nondeterministic Polynomial', 'Number Problem', 'Natural Proof'], correctIndex: 1, tags: ['tech'] },

  // More Difficulty 10
  { difficulty: 10, prompt: 'What is the capital of New Zealand?', choices: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton'], correctIndex: 1, tags: ['geography'] },
  { difficulty: 10, prompt: 'Which problem is not in NP?', choices: ['SAT', 'Halting problem', 'Graph coloring', 'Traveling salesman'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 10, prompt: 'What is the Shannon entropy of a fair coin flip?', choices: ['0', '0.5', '1 bit', '2 bits'], correctIndex: 2, tags: ['tech'] },
  { difficulty: 10, prompt: 'Who proposed the uncertainty principle?', choices: ['Bohr', 'Heisenberg', 'Schrödinger', 'Planck'], correctIndex: 1, tags: ['science'] },
  { difficulty: 10, prompt: 'What is the Kolmogorov complexity of a string?', choices: ['Length', 'Shortest description', 'Entropy', 'Compression ratio'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 10, prompt: 'Which axiom is independent of ZF set theory?', choices: ['Axiom of Extensionality', 'Axiom of Choice', 'Axiom of Pairing', 'Axiom of Union'], correctIndex: 1, tags: ['math'] },
  { difficulty: 10, prompt: 'What is the time complexity of Strassen\'s matrix multiplication?', choices: ['O(n²)', 'O(n^2.81)', 'O(n³)', 'O(n log n)'], correctIndex: 1, tags: ['tech'] },
  { difficulty: 10, prompt: 'Who proved Fermat\'s Last Theorem?', choices: ['Euler', 'Gauss', 'Andrew Wiles', 'Riemann'], correctIndex: 2, tags: ['math'] },
  { difficulty: 10, prompt: 'Which complexity class contains factoring?', choices: ['P', 'NP', 'BQP', 'NP-intermediate'], correctIndex: 2, tags: ['tech'] },
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
