const BaseService = require('../core/BaseService');

class AgeAdaptationService extends BaseService {
  constructor() {
    super('AgeAdaptationService');
    
    this.ageGroups = {
      child: { min: 7, max: 12, label: 'Child' },
      teen: { min: 13, max: 18, label: 'Teen' },
      adult: { min: 19, max: 100, label: 'Adult' }
    };

    // Age-appropriate language patterns
    this.languagePatterns = {
      child: {
        vocabulary: 'simple',
        sentenceLength: 'short',
        tone: 'encouraging and playful',
        pronouns: 'you',
        encouragementStyle: 'enthusiastic with rewards'
      },
      teen: {
        vocabulary: 'moderate',
        sentenceLength: 'medium',
        tone: 'supportive and relatable',
        pronouns: 'you',
        encouragementStyle: 'peer-like and goal-oriented'
      },
      adult: {
        vocabulary: 'advanced',
        sentenceLength: 'varied',
        tone: 'professional and respectful',
        pronouns: 'you',
        encouragementStyle: 'achievement-focused and strategic'
      }
    };

    // Age-specific companion personalities
    this.companionAdaptations = {
      child: {
        encouraging: {
          name: 'Buddy',
          avatar: '🐻',
          traits: ['super friendly', 'patient', 'playful'],
          catchphrases: ['Great job!', 'You\'re doing awesome!', 'Keep going, superstar!']
        },
        analytical: {
          name: 'Professor Owl',
          avatar: '🦉',
          traits: ['wise', 'helpful', 'clear'],
          catchphrases: ['Let\'s figure this out together!', 'That\'s a great question!', 'You\'re thinking like a scientist!']
        },
        friendly: {
          name: 'Sunny',
          avatar: '🌟',
          traits: ['cheerful', 'fun', 'energetic'],
          catchphrases: ['This is going to be fun!', 'You\'ve got this!', 'Amazing work!']
        }
      },
      teen: {
        encouraging: {
          name: 'Alex',
          avatar: '😊',
          traits: ['supportive', 'understanding', 'cool'],
          catchphrases: ['You\'re crushing it!', 'No worries, we\'ve got this!', 'That\'s the spirit!']
        },
        analytical: {
          name: 'Jordan',
          avatar: '🧠',
          traits: ['smart', 'logical', 'straightforward'],
          catchphrases: ['Let\'s break this down', 'Here\'s the strategy', 'Think of it this way']
        },
        friendly: {
          name: 'Casey',
          avatar: '😄',
          traits: ['chill', 'relatable', 'encouraging'],
          catchphrases: ['That\'s totally normal!', 'We\'re in this together!', 'You\'re doing better than you think!']
        }
      },
      adult: {
        encouraging: {
          name: 'Alex',
          avatar: '😊',
          traits: ['supportive', 'professional', 'motivational'],
          catchphrases: ['Excellent progress', 'You\'re demonstrating strong commitment', 'This approach is working well']
        },
        analytical: {
          name: 'Morgan',
          avatar: '🧠',
          traits: ['systematic', 'detail-oriented', 'strategic'],
          catchphrases: ['Let\'s analyze this systematically', 'Consider this perspective', 'Based on your progress']
        },
        friendly: {
          name: 'Sam',
          avatar: '😄',
          traits: ['personable', 'experienced', 'approachable'],
          catchphrases: ['I understand the challenge', 'Many learners find this helpful', 'You\'re making solid progress']
        }
      }
    };

    // Age-appropriate exercise types and complexity
    this.exerciseAdaptations = {
      child: {
        types: ['visual puzzles', 'games', 'drawing activities', 'story problems', 'hands-on experiments'],
        complexity: 'basic',
        duration: 15, // minutes
        breakFrequency: 10, // every 10 minutes
        rewardSystem: 'stars and badges',
        instructions: 'step-by-step with pictures'
      },
      teen: {
        types: ['problem-solving challenges', 'group projects', 'real-world applications', 'creative assignments', 'research tasks'],
        complexity: 'intermediate',
        duration: 25,
        breakFrequency: 20,
        rewardSystem: 'achievement points and levels',
        instructions: 'clear objectives with examples'
      },
      adult: {
        types: ['case studies', 'analytical exercises', 'professional simulations', 'research projects', 'skill applications'],
        complexity: 'advanced',
        duration: 45,
        breakFrequency: 30,
        rewardSystem: 'progress tracking and certifications',
        instructions: 'comprehensive guidelines with resources'
      }
    };
  }

  determineAgeGroup(age) {
    if (age >= 7 && age <= 12) return 'child';
    if (age >= 13 && age <= 18) return 'teen';
    if (age >= 19) return 'adult';
    return 'adult'; // default
  }

  getCompanionForAge(ageGroup, personalityType) {
    return this.companionAdaptations[ageGroup]?.[personalityType] || 
           this.companionAdaptations.adult[personalityType];
  }

  getLanguageStyleForAge(ageGroup) {
    return this.languagePatterns[ageGroup] || this.languagePatterns.adult;
  }

  getExerciseAdaptationForAge(ageGroup) {
    return this.exerciseAdaptations[ageGroup] || this.exerciseAdaptations.adult;
  }

  adaptPromptForAge(basePrompt, ageGroup, subject, companion) {
    const languageStyle = this.getLanguageStyleForAge(ageGroup);
    const companionData = companion || this.getCompanionForAge(ageGroup, 'encouraging');
    
    let ageSpecificInstructions = '';
    
    switch (ageGroup) {
      case 'child':
        ageSpecificInstructions = `
        You are ${companionData.name}, a friendly study companion for children aged 7-12.
        - Use simple, clear language that a child can understand
        - Keep sentences short and encouraging
        - Use playful analogies and examples from daily life
        - Be very patient and positive
        - Include fun elements and make learning feel like a game
        - Use phrases like: ${companionData.catchphrases.join(', ')}
        - Break complex ideas into tiny, manageable steps
        - Celebrate small wins enthusiastically
        `;
        break;
        
      case 'teen':
        ageSpecificInstructions = `
        You are ${companionData.name}, a cool study companion for teenagers aged 13-18.
        - Use relatable language that connects with teens
        - Be supportive but not condescending
        - Reference real-world applications and future goals
        - Acknowledge that learning can be challenging
        - Use encouraging phrases like: ${companionData.catchphrases.join(', ')}
        - Connect lessons to their interests and aspirations
        - Be understanding about stress and pressure
        `;
        break;
        
      case 'adult':
        ageSpecificInstructions = `
        You are ${companionData.name}, a professional study companion for adult learners.
        - Use respectful, professional language
        - Focus on practical applications and career benefits
        - Acknowledge their time constraints and responsibilities
        - Provide strategic learning approaches
        - Use motivational phrases like: ${companionData.catchphrases.join(', ')}
        - Emphasize efficiency and goal achievement
        - Respect their experience and prior knowledge
        `;
        break;
    }

    return `${basePrompt}\n\n${ageSpecificInstructions}\n\nSubject: ${subject}`;
  }

  generateAgeAppropriateExercises(subject, ageGroup, difficulty) {
    const adaptations = this.getExerciseAdaptationForAge(ageGroup);
    const exercises = [];

    switch (ageGroup) {
      case 'child':
        exercises.push(...this.generateChildExercises(subject, difficulty));
        break;
      case 'teen':
        exercises.push(...this.generateTeenExercises(subject, difficulty));
        break;
      case 'adult':
        exercises.push(...this.generateAdultExercises(subject, difficulty));
        break;
    }

    return {
      exercises,
      duration: adaptations.duration,
      breakFrequency: adaptations.breakFrequency,
      rewardSystem: adaptations.rewardSystem,
      instructions: adaptations.instructions
    };
  }

  generateChildExercises(subject, difficulty) {
    const exercises = [];
    
    switch (subject.toLowerCase()) {
      case 'mathematics':
      case 'math':
        exercises.push(
          'Count and color: Draw 5 apples and color them red, then add 3 more apples. How many apples do you have?',
          'Shape hunt: Find 3 things in your room that are circles and 3 things that are squares',
          'Number story: If you have 8 cookies and eat 2, how many are left? Draw the story!'
        );
        break;
      case 'science':
        exercises.push(
          'Weather watch: Look outside and draw what you see in the sky today',
          'Sink or float: Predict which items will float in water, then test them!',
          'Plant observation: Find a plant and draw its leaves, stem, and any flowers'
        );
        break;
      case 'reading':
      case 'language':
        exercises.push(
          'Word detective: Find 5 words that start with the same letter as your name',
          'Story creation: Draw 3 pictures and tell a story about them',
          'Rhyme time: Think of 3 words that rhyme with "cat"'
        );
        break;
      default:
        exercises.push(
          'Discovery activity: Draw what you already know about this topic',
          'Question time: Write 3 questions you want to learn about',
          'Fun facts: Find one cool fact to share with a friend'
        );
    }
    
    return exercises;
  }

  generateTeenExercises(subject, difficulty) {
    const exercises = [];
    
    switch (subject.toLowerCase()) {
      case 'mathematics':
      case 'math':
        exercises.push(
          'Real-world problem: Calculate how much money you\'d save in a year if you saved $5 per week',
          'Sports statistics: Find batting averages or shooting percentages for your favorite player',
          'Budget challenge: Plan a $100 budget for a weekend trip with friends'
        );
        break;
      case 'science':
        exercises.push(
          'Tech investigation: Research how your smartphone battery works',
          'Environmental challenge: Calculate your carbon footprint for one day',
          'Health connection: Explain why athletes need different nutrition than regular people'
        );
        break;
      case 'history':
        exercises.push(
          'Timeline challenge: Create a timeline of major events in your lifetime',
          'Compare and contrast: How is social media similar to historical communication methods?',
          'Debate prep: Choose a historical event and argue both sides'
        );
        break;
      default:
        exercises.push(
          'Career connection: How does this subject relate to jobs you\'re interested in?',
          'Current events: Find a news article related to this topic',
          'Peer teaching: Explain one concept to a friend or family member'
        );
    }
    
    return exercises;
  }

  generateAdultExercises(subject, difficulty) {
    const exercises = [];
    
    switch (subject.toLowerCase()) {
      case 'mathematics':
      case 'math':
        exercises.push(
          'Financial analysis: Calculate the ROI of a professional development course',
          'Data interpretation: Analyze a business report and identify key trends',
          'Problem-solving application: Apply mathematical concepts to a workplace scenario'
        );
        break;
      case 'business':
        exercises.push(
          'Case study analysis: Examine a successful company\'s strategic decisions',
          'Market research: Identify opportunities in your industry',
          'Strategic planning: Develop a 5-year career advancement plan'
        );
        break;
      case 'technology':
        exercises.push(
          'Implementation strategy: Plan how to integrate new technology in your workplace',
          'Efficiency analysis: Identify processes that could be automated',
          'Skill gap assessment: Evaluate your current skills vs. industry requirements'
        );
        break;
      default:
        exercises.push(
          'Professional application: How can you apply this knowledge in your career?',
          'Efficiency optimization: Find ways to learn this topic more effectively',
          'Knowledge synthesis: Connect this subject to your existing expertise'
        );
    }
    
    return exercises;
  }

  getAgeAppropriateTips(ageGroup, subject) {
    const tips = {
      child: [
        'Take breaks to play and move around - it helps your brain learn better!',
        'Ask lots of questions - being curious makes you smarter!',
        'Draw pictures or use toys to help understand new ideas',
        'Celebrate every small success - you\'re doing great!'
      ],
      teen: [
        'Connect what you\'re learning to your goals and interests',
        'Study with friends or form study groups for motivation',
        'Use technology and apps that make learning interactive',
        'Don\'t stress about perfection - focus on progress and understanding'
      ],
      adult: [
        'Schedule dedicated learning time that fits your routine',
        'Apply new knowledge immediately in practical situations',
        'Join professional communities related to your learning topic',
        'Track your progress and celebrate milestone achievements'
      ]
    };

    return tips[ageGroup] || tips.adult;
  }

  getMotivationalMessageForAge(ageGroup, achievement) {
    const messages = {
      child: [
        `Wow! You're like a learning superhero! 🦸‍♀️`,
        `Amazing work, young scholar! Your brain is growing stronger!`,
        `You're doing fantastic! Keep up the awesome learning!`,
        `Incredible job! You should be super proud of yourself!`
      ],
      teen: [
        `That's impressive progress! You're really getting the hang of this!`,
        `Great work! This kind of dedication will take you far!`,
        `Nice job staying focused! Your future self will thank you!`,
        `Excellent effort! You're building skills that really matter!`
      ],
      adult: [
        `Outstanding progress! Your commitment to learning is admirable.`,
        `Excellent work! This investment in yourself will pay dividends.`,
        `Strong performance! You're demonstrating real professional growth.`,
        `Impressive dedication! Your learning strategy is clearly effective.`
      ]
    };

    const ageMessages = messages[ageGroup] || messages.adult;
    return ageMessages[Math.floor(Math.random() * ageMessages.length)];
  }

  adaptSessionDurationForAge(ageGroup, requestedDuration) {
    const maxDurations = {
      child: 20,   // Max 20 minutes
      teen: 60,    // Max 1 hour
      adult: 120   // Max 2 hours
    };

    const maxDuration = maxDurations[ageGroup] || maxDurations.adult;
    return Math.min(requestedDuration, maxDuration);
  }

  getBreakRecommendationForAge(ageGroup) {
    const recommendations = {
      child: {
        frequency: 10, // every 10 minutes
        duration: 5,   // 5 minute breaks
        activities: [
          'Do some jumping jacks or dance to your favorite song',
          'Get a drink of water and a healthy snack',
          'Look out the window and name 3 things you see',
          'Do some stretches or yoga poses'
        ]
      },
      teen: {
        frequency: 20, // every 20 minutes
        duration: 5,   // 5 minute breaks
        activities: [
          'Take a quick walk or do some stretches',
          'Listen to one favorite song',
          'Do some deep breathing exercises',
          'Grab a healthy snack and hydrate'
        ]
      },
      adult: {
        frequency: 30, // every 30 minutes
        duration: 10,  // 10 minute breaks
        activities: [
          'Take a brief walk or do desk exercises',
          'Practice mindfulness or meditation',
          'Step outside for fresh air',
          'Do some light stretching or movement'
        ]
      }
    };

    return recommendations[ageGroup] || recommendations.adult;
  }
}

module.exports = AgeAdaptationService;