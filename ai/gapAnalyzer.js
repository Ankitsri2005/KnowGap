/**
 * AI Gap Analysis Engine
 * Analyzes student test performance and identifies learning gaps
 */

/**
 * Performance level thresholds
 */
const PERFORMANCE_LEVELS = {
  EXCELLENT: { min: 85, label: 'Excellent', color: '#10b981', emoji: '🏆' },
  GOOD: { min: 70, label: 'Good', color: '#3b82f6', emoji: '👍' },
  AVERAGE: { min: 50, label: 'Average', color: '#f59e0b', emoji: '📊' },
  BELOW_AVERAGE: { min: 35, label: 'Below Average', color: '#f97316', emoji: '⚠️' },
  POOR: { min: 0, label: 'Needs Improvement', color: '#ef4444', emoji: '🚨' }
};

/**
 * Gap severity classification
 */
const GAP_SEVERITY = {
  CRITICAL: { threshold: 40, label: 'Critical Gap', priority: 1, color: '#ef4444' },
  SIGNIFICANT: { threshold: 60, label: 'Significant Gap', priority: 2, color: '#f97316' },
  MODERATE: { threshold: 75, label: 'Moderate Gap', priority: 3, color: '#f59e0b' },
  MINOR: { threshold: 100, label: 'Minor Gap', priority: 4, color: '#3b82f6' }
};

/**
 * Study recommendations by performance
 */
const STUDY_STRATEGIES = {
  CRITICAL: [
    'Start from the very basics of this topic',
    'Watch video tutorials before attempting problems',
    'Practice at least 20 questions daily on this topic',
    'Seek teacher guidance immediately',
    'Use flashcards for memorizing key concepts'
  ],
  SIGNIFICANT: [
    'Review core concepts and definitions',
    'Work through example problems step-by-step',
    'Practice 10-15 questions per day',
    'Join a study group for collaborative learning',
    'Re-read textbook chapters related to this topic'
  ],
  MODERATE: [
    'Review weak areas within the topic',
    'Practice mixed question sets',
    'Take mini-quizzes to self-assess',
    'Focus on understanding "why" not just "what"'
  ],
  MINOR: [
    'Optional review for reinforcement',
    'Practice a few extra questions weekly',
    'Focus on more advanced problems'
  ]
};

/**
 * Main AI analysis function
 * @param {Array} answers - Array of {question, studentAnswer, isCorrect, topic, difficulty}
 * @param {Object} subject - Subject information
 * @returns {Object} Complete gap analysis report
 */
function analyzeGaps(answers, subject) {
  if (!answers || answers.length === 0) {
    return { error: 'No answers to analyze' };
  }

  // 1. Calculate overall performance
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const overallScore = Math.round((correctAnswers / totalQuestions) * 100);

  // 2. Group answers by topic
  const topicMap = {};
  answers.forEach(answer => {
    const topicId = answer.topicId;
    const topicName = answer.topicName;
    if (!topicMap[topicId]) {
      topicMap[topicId] = {
        id: topicId,
        name: topicName,
        total: 0,
        correct: 0,
        wrong: [],
        difficulties: { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, hard: { total: 0, correct: 0 } }
      };
    }
    topicMap[topicId].total++;
    if (answer.isCorrect) {
      topicMap[topicId].correct++;
    } else {
      topicMap[topicId].wrong.push(answer.questionText);
    }
    const diff = answer.difficulty || 'medium';
    topicMap[topicId].difficulties[diff].total++;
    if (answer.isCorrect) topicMap[topicId].difficulties[diff].correct++;
  });

  // 3. Calculate topic scores and classify gaps
  const topicScores = [];
  const criticalGaps = [];
  const significantGaps = [];
  const moderateGaps = [];
  const goodTopics = [];

  Object.values(topicMap).forEach(topic => {
    const score = topic.total > 0 ? Math.round((topic.correct / topic.total) * 100) : 0;
    const gapSeverity = classifyGap(score);
    
    // Difficulty breakdown
    const diffBreakdown = {};
    ['easy', 'medium', 'hard'].forEach(d => {
      const dt = topic.difficulties[d];
      diffBreakdown[d] = dt.total > 0 
        ? { score: Math.round((dt.correct / dt.total) * 100), total: dt.total, correct: dt.correct }
        : null;
    });

    const topicResult = {
      id: topic.id,
      name: topic.name,
      score,
      total: topic.total,
      correct: topic.correct,
      wrong: topic.total - topic.correct,
      gapSeverity: gapSeverity.label,
      gapColor: gapSeverity.color,
      priority: gapSeverity.priority,
      difficultyBreakdown: diffBreakdown,
      recommendations: generateRecommendations(topic.name, score, gapSeverity),
      studyHours: estimateStudyHours(score, topic.total),
      mastered: score >= 80
    };

    topicScores.push(topicResult);

    if (score < 40) criticalGaps.push(topicResult);
    else if (score < 60) significantGaps.push(topicResult);
    else if (score < 75) moderateGaps.push(topicResult);
    else goodTopics.push(topicResult);
  });

  // Sort by priority (worst first)
  topicScores.sort((a, b) => a.score - b.score);

  // 4. Determine overall performance level
  const performanceLevel = getPerformanceLevel(overallScore);

  // 5. Generate AI insights
  const insights = generateInsights(overallScore, criticalGaps, significantGaps, moderateGaps, goodTopics, totalQuestions);

  // 6. Generate personalized study plan
  const studyPlan = generateStudyPlan(topicScores, overallScore);

  // 7. Generate gap summary text
  const gapSummary = generateGapSummary(overallScore, criticalGaps, significantGaps, subject.name);

  // 8. Priority topics to study
  const priorityTopics = [...criticalGaps, ...significantGaps, ...moderateGaps]
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map(t => ({
      name: t.name,
      score: t.score,
      urgency: t.gapSeverity,
      color: t.gapColor,
      studyHours: t.studyHours
    }));

  return {
    overallScore,
    totalQuestions,
    correctAnswers,
    wrongAnswers: totalQuestions - correctAnswers,
    performanceLevel: performanceLevel.label,
    performanceColor: performanceLevel.color,
    performanceEmoji: performanceLevel.emoji,
    topicScores,
    criticalGaps,
    significantGaps,
    moderateGaps,
    goodTopics,
    gapSummary,
    insights,
    studyPlan,
    priorityTopics,
    analysisVersion: '2.0',
    confidence: calculateConfidence(totalQuestions)
  };
}

function classifyGap(score) {
  if (score < 40) return GAP_SEVERITY.CRITICAL;
  if (score < 60) return GAP_SEVERITY.SIGNIFICANT;
  if (score < 75) return GAP_SEVERITY.MODERATE;
  return GAP_SEVERITY.MINOR;
}

function getPerformanceLevel(score) {
  if (score >= 85) return PERFORMANCE_LEVELS.EXCELLENT;
  if (score >= 70) return PERFORMANCE_LEVELS.GOOD;
  if (score >= 50) return PERFORMANCE_LEVELS.AVERAGE;
  if (score >= 35) return PERFORMANCE_LEVELS.BELOW_AVERAGE;
  return PERFORMANCE_LEVELS.POOR;
}

function generateRecommendations(topicName, score, gapSeverity) {
  const strategies = score < 40 ? STUDY_STRATEGIES.CRITICAL
    : score < 60 ? STUDY_STRATEGIES.SIGNIFICANT
    : score < 75 ? STUDY_STRATEGIES.MODERATE
    : STUDY_STRATEGIES.MINOR;

  return strategies.map(s => s.replace('this topic', `"${topicName}"`));
}

function estimateStudyHours(score, questionCount) {
  if (score >= 80) return 0;
  const gapRatio = (100 - score) / 100;
  const base = questionCount * 0.3;
  return Math.ceil(base * gapRatio * (score < 40 ? 3 : score < 60 ? 2 : 1));
}

function generateInsights(overallScore, critical, significant, moderate, good, total) {
  const insights = [];

  if (critical.length > 0) {
    insights.push({
      type: 'critical',
      icon: '🚨',
      title: 'Critical Learning Gaps Detected',
      message: `You have critical gaps in ${critical.map(t => t.name).join(', ')}. Immediate attention required.`
    });
  }

  if (significant.length > 0) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Significant Gaps Found',
      message: `${significant.map(t => t.name).join(', ')} need focused practice sessions.`
    });
  }

  if (good.length > 0) {
    insights.push({
      type: 'success',
      icon: '✅',
      title: 'Strong Areas Identified',
      message: `You show good understanding of ${good.map(t => t.name).join(', ')}. Keep it up!`
    });
  }

  if (overallScore >= 70) {
    insights.push({
      type: 'info',
      icon: '📈',
      title: 'Above Average Performance',
      message: 'You are performing above the class average. Focus on critical gaps to excel.'
    });
  } else if (overallScore < 40) {
    insights.push({
      type: 'critical',
      icon: '📚',
      title: 'Foundational Review Needed',
      message: 'Consider revisiting the subject fundamentals before advancing to complex topics.'
    });
  }

  // Difficulty pattern insight
  insights.push({
    type: 'info',
    icon: '🔍',
    title: 'AI Diagnostic Complete',
    message: `Analyzed ${total} questions across multiple topics. Your personalized study plan is ready below.`
  });

  return insights;
}

function generateStudyPlan(topicScores, overallScore) {
  const weakTopics = topicScores.filter(t => t.score < 75).sort((a, b) => a.score - b.score);
  if (weakTopics.length === 0) return { message: 'Great! Focus on advanced problems.', weeks: [] };

  const weeks = [];
  const topicsPerWeek = Math.ceil(weakTopics.length / 4);

  for (let week = 0; week < Math.min(4, Math.ceil(weakTopics.length / topicsPerWeek)); week++) {
    const weekTopics = weakTopics.slice(week * topicsPerWeek, (week + 1) * topicsPerWeek);
    weeks.push({
      week: week + 1,
      focus: weekTopics.map(t => t.name).join(' & '),
      topics: weekTopics,
      dailyGoal: `${Math.ceil(weekTopics.reduce((s, t) => s + t.studyHours, 0) / 7)} hours/day`,
      activities: week === 0 ? ['Review basics', 'Watch tutorials', 'Practice problems'] 
                 : week === 1 ? ['Concept deep-dive', 'Solve exercises', 'Self-quiz']
                 : week === 2 ? ['Mixed practice', 'Mock tests', 'Peer discussion']
                 : ['Advanced problems', 'Full revision', 'Final mock test']
    });
  }

  return { weeks, totalEstimatedHours: weakTopics.reduce((s, t) => s + t.studyHours, 0) };
}

function generateGapSummary(score, criticalGaps, significantGaps, subjectName) {
  if (score >= 85) {
    return `Excellent performance in ${subjectName}! You demonstrate strong mastery across topics. Focus on the minor gaps identified to achieve near-perfect understanding.`;
  } else if (score >= 70) {
    return `Good understanding of ${subjectName}. ${significantGaps.length > 0 ? `However, you need to strengthen: ${significantGaps.map(t => t.name).join(', ')}.` : 'Keep up the consistent practice!'}`;
  } else if (score >= 50) {
    const gapTopics = [...criticalGaps, ...significantGaps].map(t => t.name).join(', ');
    return `Average performance in ${subjectName}. AI analysis reveals gaps in: ${gapTopics || 'multiple topics'}. A structured study plan has been generated for you.`;
  } else {
    const allGaps = [...criticalGaps, ...significantGaps].map(t => t.name).join(', ');
    return `Significant learning gaps detected in ${subjectName}. Critical areas requiring immediate attention: ${allGaps || 'most topics'}. Please follow the personalized study plan and consult with your teacher.`;
  }
}

function calculateConfidence(questionCount) {
  if (questionCount >= 25) return 'High (95%)';
  if (questionCount >= 15) return 'Moderate (82%)';
  if (questionCount >= 10) return 'Moderate (75%)';
  return 'Low (60%)';
}

module.exports = { analyzeGaps };
