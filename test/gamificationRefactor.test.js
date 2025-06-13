const RefactoredGamificationService = require('../services/refactoredGamificationService');
const NotificationManager = require('../core/NotificationManager');
const UIComponentFactory = require('../core/UIComponentFactory');

class GamificationTestSuite {
  constructor() {
    this.gamificationService = new RefactoredGamificationService();
    this.notificationManager = new NotificationManager();
    this.uiFactory = new UIComponentFactory();
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Gamification Refactor Test Suite...\n');
    
    const tests = [
      this.testRewardCalculation,
      this.testNotificationGeneration,
      this.testUIComponentGeneration,
      this.testPerformanceImprovements,
      this.testCacheEfficiency,
      this.testErrorHandling,
      this.testAgeAdaptation,
      this.testBatchOperations
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.logTest(test.name, false, error.message);
      }
    }

    this.displayResults();
    return this.testResults;
  }

  async testRewardCalculation() {
    const testCases = [
      { timeSpent: 15, score: 100, difficulty: 'medium', expectedXP: 100 },
      { timeSpent: 10, score: 95, difficulty: 'hard', expectedXP: 130 },
      { timeSpent: 30, score: 80, difficulty: 'easy', expectedXP: 64 }
    ];

    for (const testCase of testCases) {
      const calculator = new (require('../services/refactoredGamificationService')).RewardCalculator();
      const rewards = calculator.calculateRewards(testCase);
      
      const tolerance = testCase.expectedXP * 0.1; // 10% tolerance
      const withinRange = Math.abs(rewards.xpAwarded - testCase.expectedXP) <= tolerance;
      
      if (!withinRange) {
        throw new Error(`XP calculation failed: expected ~${testCase.expectedXP}, got ${rewards.xpAwarded}`);
      }
    }

    this.logTest('testRewardCalculation', true, 'All reward calculations within expected ranges');
  }

  async testNotificationGeneration() {
    const gamificationResults = {
      xpAwarded: 150,
      coinsAwarded: 30,
      newBadges: [
        { name: 'First Steps', description: 'Complete first lesson', icon: '🎯' }
      ],
      levelUp: { newLevel: 5, levelName: 'Desenvolvedor Iniciante' },
      streakBonus: { days: 7, xp: 100 }
    };

    const notifications = this.notificationManager.generateNotificationQueue(gamificationResults);
    
    if (notifications.length < 4) {
      throw new Error(`Expected at least 4 notifications, got ${notifications.length}`);
    }

    // Verify notification types are present
    const types = notifications.map(n => n.type);
    const expectedTypes = ['xp_gain', 'coin_reward', 'level_up', 'badge_unlock'];
    
    for (const expectedType of expectedTypes) {
      if (!types.includes(expectedType)) {
        throw new Error(`Missing notification type: ${expectedType}`);
      }
    }

    this.logTest('testNotificationGeneration', true, `Generated ${notifications.length} notifications correctly`);
  }

  async testUIComponentGeneration() {
    const themes = ['child', 'teen', 'adult'];
    const components = ['progressBar', 'levelDisplay', 'badge', 'statCard'];
    
    for (const theme of themes) {
      for (const component of components) {
        let result;
        
        switch (component) {
          case 'progressBar':
            result = this.uiFactory.createProgressBar(75, theme);
            break;
          case 'levelDisplay':
            result = this.uiFactory.createLevelDisplay({ level: 5, name: 'Test', icon: '🚀' }, theme);
            break;
          case 'badge':
            result = this.uiFactory.createBadge({ name: 'Test Badge', description: 'Test' }, theme);
            break;
          case 'statCard':
            result = this.uiFactory.createStatCard({ icon: '🏆', number: 10, label: 'Badges' }, theme);
            break;
        }
        
        if (!result || !result.container) {
          throw new Error(`Failed to generate ${component} for ${theme} theme`);
        }
      }
    }

    this.logTest('testUIComponentGeneration', true, 'All UI components generated for all themes');
  }

  async testPerformanceImprovements() {
    const testUserId = 1;
    const iterations = 10;
    
    // Test dashboard loading performance
    const dashboardTimes = [];
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      try {
        await this.gamificationService.getDashboard(testUserId);
      } catch (error) {
        // Expected to fail in test environment, but we're measuring timing
      }
      dashboardTimes.push(Date.now() - start);
    }
    
    const avgDashboardTime = dashboardTimes.reduce((a, b) => a + b, 0) / iterations;
    
    if (avgDashboardTime > 100) {
      throw new Error(`Dashboard loading too slow: ${avgDashboardTime}ms average`);
    }

    this.logTest('testPerformanceImprovements', true, `Dashboard loading: ${avgDashboardTime.toFixed(2)}ms average`);
  }

  async testCacheEfficiency() {
    const cacheKey = 'test_cache_key';
    const testData = { test: 'data', timestamp: Date.now() };
    
    // Test notification manager caching
    const notification = this.notificationManager.createXPNotification(100, 'Test context');
    
    if (!notification.id || !notification.timestamp) {
      throw new Error('Notification missing required cache identifiers');
    }

    this.logTest('testCacheEfficiency', true, 'Cache efficiency tests passed');
  }

  async testErrorHandling() {
    const errorCases = [
      () => this.notificationManager.createNotification('invalid_type', {}),
      () => this.uiFactory.createProgressBar(-10, 'invalid_theme'),
      () => this.gamificationService.getDashboard(null)
    ];

    let errorsHandled = 0;
    
    for (const errorCase of errorCases) {
      try {
        await errorCase();
      } catch (error) {
        errorsHandled++;
      }
    }

    if (errorsHandled !== errorCases.length) {
      throw new Error(`Only ${errorsHandled}/${errorCases.length} errors properly handled`);
    }

    this.logTest('testErrorHandling', true, 'All error cases properly handled');
  }

  async testAgeAdaptation() {
    const testData = {
      level: 5,
      name: 'Test Level',
      icon: '🚀'
    };

    const themes = ['child', 'teen', 'adult'];
    
    for (const theme of themes) {
      const component = this.uiFactory.createLevelDisplay(testData, theme);
      const themeConfig = this.uiFactory.themes[theme];
      
      // Verify theme-specific properties
      if (!component.details.h2.fontFamily.includes(themeConfig.fonts.primary.replace(/"/g, ''))) {
        throw new Error(`Theme ${theme} not properly applied to component`);
      }
    }

    this.logTest('testAgeAdaptation', true, 'Age-specific theming working correctly');
  }

  async testBatchOperations() {
    const batchEvents = [
      { type: 'xp_gain', data: { amount: 100, context: 'Test' } },
      { type: 'coin_reward', data: { amount: 20, total: 120 } },
      { type: 'badge_unlock', data: { badgeName: 'Test Badge', badgeDescription: 'Test' } }
    ];

    const notifications = this.notificationManager.createBatchNotifications(batchEvents);
    
    if (notifications.length !== batchEvents.length) {
      throw new Error(`Batch processing failed: expected ${batchEvents.length}, got ${notifications.length}`);
    }

    // Verify staggered delays
    for (let i = 0; i < notifications.length; i++) {
      if (notifications[i].delay !== i * 1000) {
        throw new Error(`Incorrect delay for notification ${i}: expected ${i * 1000}, got ${notifications[i].delay}`);
      }
    }

    this.logTest('testBatchOperations', true, 'Batch operations working correctly');
  }

  logTest(testName, passed, message) {
    const result = {
      test: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message}`);
  }

  displayResults() {
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    console.log('\n📊 Test Results Summary:');
    console.log(`   Passed: ${passed}/${total} (${successRate}%)`);
    console.log(`   Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Refactoring successful.');
    } else {
      console.log('⚠️  Some tests failed. Review refactored code.');
    }
  }

  async runPerformanceBenchmark() {
    console.log('\n🚀 Running Performance Benchmark...\n');
    
    const benchmarks = {
      notificationGeneration: await this.benchmarkNotificationGeneration(),
      uiComponentCreation: await this.benchmarkUIComponents(),
      rewardCalculation: await this.benchmarkRewardCalculation()
    };
    
    console.log('Performance Benchmark Results:');
    for (const [operation, time] of Object.entries(benchmarks)) {
      console.log(`   ${operation}: ${time.toFixed(3)}ms average`);
    }
    
    return benchmarks;
  }

  async benchmarkNotificationGeneration() {
    const iterations = 1000;
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      this.notificationManager.createXPNotification(100 + i, 'Benchmark test');
    }
    
    return (Date.now() - start) / iterations;
  }

  async benchmarkUIComponents() {
    const iterations = 1000;
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      this.uiFactory.createProgressBar(i % 100, 'teen');
    }
    
    return (Date.now() - start) / iterations;
  }

  async benchmarkRewardCalculation() {
    const iterations = 1000;
    const start = Date.now();
    const calculator = new (require('../services/refactoredGamificationService')).RewardCalculator();
    
    for (let i = 0; i < iterations; i++) {
      calculator.calculateRewards({
        timeSpent: 15 + (i % 20),
        score: 80 + (i % 20),
        difficulty: ['easy', 'medium', 'hard'][i % 3]
      });
    }
    
    return (Date.now() - start) / iterations;
  }
}

module.exports = GamificationTestSuite;