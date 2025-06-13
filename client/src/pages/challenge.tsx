import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight, Award, Target } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'coding' | 'interactive';
  difficulty: string;
  timeLimit: number;
  xpReward: number;
  questions: Question[];
}

interface Question {
  id: string;
  type: 'multiple_choice' | 'code' | 'text';
  question: string;
  options?: string[];
  correctAnswer: number | string;
  explanation: string;
  points: number;
}

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadChallenge(id);
    }
  }, [id]);

  useEffect(() => {
    if (timeLeft > 0 && !isCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && challenge && !isCompleted) {
      handleTimeUp();
    }
  }, [timeLeft, isCompleted, challenge]);

  const loadChallenge = async (challengeId: string) => {
    // Simulate API call with real challenge data based on ID
    setTimeout(() => {
      const sampleChallenge: Challenge = {
        id: challengeId,
        title: 'Fundamentos de IA - Quiz Avançado',
        description: 'Teste seus conhecimentos sobre conceitos fundamentais de Inteligência Artificial',
        type: 'quiz',
        difficulty: 'Intermediário',
        timeLimit: 600, // 10 minutes
        xpReward: 150,
        questions: [
          {
            id: '1',
            type: 'multiple_choice',
            question: 'Qual é a principal diferença entre Machine Learning supervisionado e não supervisionado?',
            options: [
              'O supervisionado usa mais dados',
              'O supervisionado utiliza dados rotulados para treinamento',
              'O não supervisionado é mais preciso',
              'Não há diferença significativa'
            ],
            correctAnswer: 1,
            explanation: 'Machine Learning supervisionado utiliza dados rotulados (com respostas conhecidas) para treinar o modelo, enquanto o não supervisionado trabalha com dados sem rótulos.',
            points: 25
          },
          {
            id: '2',
            type: 'multiple_choice',
            question: 'O que são redes neurais artificiais?',
            options: [
              'Sistemas de hardware especializados',
              'Modelos computacionais inspirados no cérebro humano',
              'Algoritmos de busca avançados',
              'Bancos de dados inteligentes'
            ],
            correctAnswer: 1,
            explanation: 'Redes neurais artificiais são modelos computacionais inspirados na estrutura e funcionamento dos neurônios do cérebro humano.',
            points: 25
          },
          {
            id: '3',
            type: 'multiple_choice',
            question: 'Qual é o objetivo principal do Deep Learning?',
            options: [
              'Reduzir o uso de memória',
              'Acelerar o processamento',
              'Aprender representações complexas de dados',
              'Simplificar algoritmos'
            ],
            correctAnswer: 2,
            explanation: 'Deep Learning visa aprender representações hierárquicas e complexas dos dados através de múltiplas camadas de processamento.',
            points: 30
          },
          {
            id: '4',
            type: 'multiple_choice',
            question: 'O que é overfitting em Machine Learning?',
            options: [
              'Quando o modelo é muito simples',
              'Quando o modelo memoriza os dados de treino mas falha em generalizar',
              'Quando há poucos dados disponíveis',
              'Quando o processamento é muito lento'
            ],
            correctAnswer: 1,
            explanation: 'Overfitting ocorre quando um modelo aprende os dados de treinamento de forma muito específica, perdendo a capacidade de generalizar para novos dados.',
            points: 30
          }
        ]
      };
      
      setChallenge(sampleChallenge);
      setTimeLeft(sampleChallenge.timeLimit);
      setLoading(false);
    }, 1000);
  };

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (challenge && currentQuestion < challenge.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setIsCompleted(true);
    setShowResults(true);
  };

  const handleTimeUp = () => {
    setIsCompleted(true);
    setShowResults(true);
  };

  const calculateScore = () => {
    if (!challenge) return { score: 0, total: 0, percentage: 0 };
    
    let score = 0;
    let total = 0;
    
    challenge.questions.forEach(question => {
      total += question.points;
      const userAnswer = answers[question.id];
      if (userAnswer === question.correctAnswer) {
        score += question.points;
      }
    });
    
    return {
      score,
      total,
      percentage: Math.round((score / total) * 100)
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Desafio não encontrado</h2>
        <button
          onClick={() => navigate('/')}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  if (showResults) {
    const results = calculateScore();
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card p-8 rounded-lg text-center">
          <div className="mb-6">
            {results.percentage >= 80 ? (
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            )}
            
            <h1 className="text-3xl font-bold mb-2">
              {results.percentage >= 80 ? 'Parabéns!' : 'Continue tentando!'}
            </h1>
            <p className="text-muted-foreground">
              Você completou o desafio "{challenge.title}"
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{results.score}</div>
              <div className="text-sm text-muted-foreground">Pontos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{results.percentage}%</div>
              <div className="text-sm text-muted-foreground">Precisão</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {results.percentage >= 80 ? challenge.xpReward : Math.round(challenge.xpReward * 0.5)}
              </div>
              <div className="text-sm text-muted-foreground">XP Ganho</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg"
            >
              Continuar Aprendendo
            </button>
            <button
              onClick={() => window.location.reload()}
              className="border border-primary text-primary px-6 py-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>

        {/* Review Answers */}
        <div className="card p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Revisão das Respostas</h2>
          <div className="space-y-4">
            {challenge.questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">
                      {index + 1}. {question.question}
                    </h3>
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                  
                  {question.options && (
                    <div className="space-y-1 mb-3">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-2 rounded text-sm ${
                            optionIndex === question.correctAnswer
                              ? 'bg-green-100 text-green-800'
                              : optionIndex === userAnswer && !isCorrect
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-50'
                          }`}
                        >
                          {option}
                          {optionIndex === question.correctAnswer && ' ✓'}
                          {optionIndex === userAnswer && !isCorrect && ' ✗'}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground">
                    <strong>Explicação:</strong> {question.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const currentQ = challenge.questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span className={`font-mono ${timeLeft < 60 ? 'text-red-600' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-primary" />
            <span>{challenge.xpReward} XP</span>
          </div>
        </div>
      </div>

      {/* Challenge Info */}
      <div className="card p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">{challenge.title}</h1>
        <p className="text-muted-foreground mb-4">{challenge.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
            {challenge.difficulty}
          </span>
          <span className="text-sm text-muted-foreground">
            Pergunta {currentQuestion + 1} de {challenge.questions.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / challenge.questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="card p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-6">{currentQ.question}</h2>
        
        {currentQ.type === 'multiple_choice' && currentQ.options && (
          <div className="space-y-3">
            {currentQ.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  answers[currentQ.id] === index
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <input
                  type="radio"
                  name={currentQ.id}
                  value={index}
                  checked={answers[currentQ.id] === index}
                  onChange={() => handleAnswer(currentQ.id, index)}
                  className="text-primary"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="flex items-center space-x-2 px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <button
          onClick={handleNext}
          disabled={!answers[currentQ.id]}
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
        >
          <span>
            {currentQuestion === challenge.questions.length - 1 ? 'Finalizar' : 'Próxima'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}