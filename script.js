// Quiz data storage
let quizData = {
    math: [
        {
            question: "What is 2 + 2?",
            options: ["3", "4", "5", "6"],
            correct: 1
        }
    ],
    science: [
        {
            question: "What is the chemical symbol for gold?",
            options: ["Ag", "Au", "Fe", "Cu"],
            correct: 1
        }
    ],
    history: [
        {
            question: "In which year did World War I begin?",
            options: ["1912", "1914", "1916", "1918"],
            correct: 1
        }
    ],
    geography: [
        {
            question: "What is the capital of Australia?",
            options: ["Sydney", "Melbourne", "Canberra", "Perth"],
            correct: 2
        }
    ]
};
function importQuestionsForSubject(jsonFile, targetSubject) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            
            // Check if the subject exists in the imported JSON
            if (!jsonData[targetSubject]) {
                showToast(`No questions found for ${targetSubject}`, true);
                return;
            }
            
            // Validate questions for the specific subject
            const questions = jsonData[targetSubject];
            if (!Array.isArray(questions)) {
                throw new Error(`Invalid format for ${targetSubject} questions`);
            }
            
            // Validate each question
            const invalidQuestions = questions.filter(q => !questionSchema.validateQuestion(q));
            if (invalidQuestions.length > 0) {
                throw new Error(`${invalidQuestions.length} questions have invalid format`);
            }
            
            // Initialize subject array if it doesn't exist
            if (!quizData[targetSubject]) {
                quizData[targetSubject] = [];
            }
            
            // Add questions to quiz data
            quizData[targetSubject].push(...questions);
            
            // Save to localStorage
            saveQuizData();
            
            showToast(`Successfully imported ${questions.length} questions for ${targetSubject}!`);
            document.getElementById('json-form').reset();
            
        } catch (error) {
            showToast(`Error: ${error.message}`, true);
        }
    };
    
    reader.onerror = function() {
        showToast('Error reading file!', true);
    };
    
    reader.readAsText(jsonFile);
}
// Quiz state variables
let selectedAnswers = {};
let timer;
let seconds = 0;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeQuizData();
    loadQuestions();
});

// Load questions from localStorage if available
function initializeQuizData() {
    const savedData = localStorage.getItem('quizData');
    if (savedData) {
        quizData = JSON.parse(savedData);
    }
}

// Save questions to localStorage
function saveQuizData() {
    localStorage.setItem('quizData', JSON.stringify(quizData));
}

// Show selected section
function showSection(section) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Hide all sections
    document.querySelectorAll('.quiz-section, .section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    if (section === 'quiz') {
        document.getElementById('quiz-section').classList.add('active');
        loadQuestions();
    } else if (section === 'add-question') {
        document.getElementById('add-question-section').classList.add('active');
    } else if (section === 'import') {
        document.getElementById('import-section').classList.add('active');
    }
}

// Timer functions
function startTimer() {
    clearInterval(timer);
    seconds = 0;
    timer = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        document.getElementById('timer').textContent = 
            `Time: ${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Progress bar update
function updateProgress() {
    const subject = document.getElementById('subject').value;
    const totalQuestions = quizData[subject].length;
    const answeredQuestions = Object.keys(selectedAnswers).length;
    const progress = (answeredQuestions / totalQuestions) * 100;
    document.getElementById('progress').style.width = `${progress}%`;
}

// Load questions for selected subject
function loadQuestions() {
    const subject = document.getElementById('subject').value;
    const questionsContainer = document.getElementById('questions');
    questionsContainer.innerHTML = '';
    selectedAnswers = {};
    startTimer();
    updateProgress();

    if (!quizData[subject] || quizData[subject].length === 0) {
        questionsContainer.innerHTML = '<div class="no-questions">No questions available for this subject</div>';
        return;
    }

    quizData[subject].forEach((q, qIndex) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        questionDiv.innerHTML = `
            <h3>Question ${qIndex + 1}: ${q.question}</h3>
            <div class="options">
                ${q.options.map((option, oIndex) => `
                    <div class="option" 
                         onclick="selectOption(${qIndex}, ${oIndex})"
                         id="q${qIndex}o${oIndex}">
                        ${option}
                    </div>
                `).join('')}
            </div>
        `;
        questionsContainer.appendChild(questionDiv);
    });

    // Reset score display
    document.getElementById('score').innerHTML = '';
    document.getElementById('score').classList.remove('visible');
}

// Handle option selection
function selectOption(questionIndex, optionIndex) {
    const subject = document.getElementById('subject').value;
    
    // Remove previous selection for this question
    quizData[subject][questionIndex].options.forEach((_, oIndex) => {
        document.getElementById(`q${questionIndex}o${oIndex}`).className = 'option';
    });

    // Add selection to clicked option
    document.getElementById(`q${questionIndex}o${optionIndex}`).className = 'option selected';
    
    // Store the answer
    selectedAnswers[questionIndex] = optionIndex;
    updateProgress();
}

// Submit quiz and show results
function submitQuiz() {
    clearInterval(timer);
    const subject = document.getElementById('subject').value;
    let score = 0;
    let totalQuestions = quizData[subject].length;

    quizData[subject].forEach((q, qIndex) => {
        const selectedAnswer = selectedAnswers[qIndex];
        if (selectedAnswer !== undefined) {
            const optionElement = document.getElementById(`q${qIndex}o${selectedAnswer}`);
            if (selectedAnswer === q.correct) {
                optionElement.className = 'option correct';
                score++;
            } else {
                optionElement.className = 'option incorrect';
                document.getElementById(`q${qIndex}o${q.correct}`).className = 'option correct';
            }
        }
    });

    // Display score with animation
    const scoreElement = document.getElementById('score');
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const timeString = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    const percentage = ((score / totalQuestions) * 100).toFixed(1);
    
    scoreElement.innerHTML = `
        <i class="fas fa-trophy"></i>
        <div>Your Score: ${score}/${totalQuestions} (${percentage}%)</div>
        <div>Time Taken: ${timeString}</div>
    `;
    scoreElement.classList.add('visible');
}

// Add new question
function addQuestion(event) {
    event.preventDefault();

    const subject = document.getElementById('new-subject').value;
    const questionText = document.getElementById('new-question').value;
    const options = [];
    let correctAnswer = null;

    // Get all option inputs
    const optionGroups = document.querySelectorAll('.option-group');
    optionGroups.forEach((group, index) => {
        const optionText = group.querySelector('input[type="text"]').value;
        options.push(optionText);
        
        if (group.querySelector('input[type="radio"]').checked) {
            correctAnswer = index;
        }
    });

    if (correctAnswer === null) {
        showToast('Please select a correct answer', true);
        return;
    }

    // Create new question object
    const newQuestion = {
        question: questionText,
        options: options,
        correct: correctAnswer
    };

    // Add to quiz data
    if (!quizData[subject]) {
        quizData[subject] = [];
    }
    quizData[subject].push(newQuestion);

    // Save to localStorage
    saveQuizData();

    // Show success message
    showToast('Question added successfully!');

    // Reset form
    document.getElementById('question-form').reset();
}

// JSON Schema validation
const questionSchema = {
    validateQuestion: function(question) {
        return (
            question.hasOwnProperty('question') &&
            question.hasOwnProperty('options') &&
            question.hasOwnProperty('correct') &&
            Array.isArray(question.options) &&
            question.options.length === 4 &&
            typeof question.correct === 'number' &&
            question.correct >= 0 &&
            question.correct <= 3
        );
    }
};

// Handle JSON file import
function handleJSONUpload(event) {
    event.preventDefault();
    const subject = document.getElementById('json-subject').value;
    const fileInput = document.getElementById('json-file');
    
    if (fileInput.files.length > 0) {
        importQuestionsForSubject(fileInput.files[0], subject);
    }
}

// Enhanced toast notification
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show' + (isError ? ' error' : ' success');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Add this function to script.js
function clearJSONFile() {
    // Clear the file input
    const fileInput = document.getElementById('json-file');
    fileInput.value = '';
    
    // Get the selected subject
    const subject = document.getElementById('json-subject').value;
    
    // Clear questions for the selected subject
    quizData[subject] = [];
    
    // Save the updated quiz data to localStorage
    saveQuizData();
    
    // Show success message
    showToast(`Cleared all ${subject} questions and removed file`);
    
    // If we're in quiz section, reload the questions to reflect the changes
    if (document.getElementById('quiz-section').classList.contains('active')) {
        loadQuestions();
    }
}
function clearJSONFile() {
    const subject = document.getElementById('json-subject').value;
    
    if (confirm(`Are you sure you want to clear all ${subject} questions? This action cannot be undone.`)) {
        // Clear the file input
        const fileInput = document.getElementById('json-file');
        fileInput.value = '';
        
        // Clear questions for the selected subject
        quizData[subject] = [];
        
        // Save the updated quiz data to localStorage
        saveQuizData();
        
        // Show success message
        showToast(`Cleared all ${subject} questions and removed file`);
        
        // If we're in quiz section, reload the questions to reflect the changes
        if (document.getElementById('quiz-section').classList.contains('active')) {
            loadQuestions();
        }
    }
}