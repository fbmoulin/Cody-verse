const axios = require('axios');

class IntegrationDebugger {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.clientURL = 'http://localhost:3000';
    this.results = [];
  }

  async runTest(testName, testFunction) {
    try {
      console.log(`\n🧪 Testing: ${testName}`);
      const result = await testFunction();
      this.results.push({ test: testName, status: 'PASS', data: result });
      console.log(`✅ ${testName}: PASSED`);
      return result;
    } catch (error) {
      this.results.push({ test: testName, status: 'FAIL', error: error.message });
      console.log(`❌ ${testName}: FAILED - ${error.message}`);
      return null;
    }
  }

  async testHealthEndpoint() {
    const response = await axios.get(`${this.baseURL}/health`);
    if (response.data.overall !== 'healthy') {
      throw new Error('System not healthy');
    }
    return response.data;
  }

  async testDatabaseConnection() {
    const response = await axios.get(`${this.baseURL}/api/courses`);
    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new Error('Database connection failed');
    }
    return { courseCount: response.data.data.length, courses: response.data.data };
  }

  async testGamificationSystem() {
    const response = await axios.get(`${this.baseURL}/api/gamification/dashboard/1`);
    if (!response.data.success) {
      throw new Error('Gamification system failed');
    }
    return response.data.data;
  }

  async testCodyAIAssistant() {
    const response = await axios.post(`${this.baseURL}/api/cody/interact`, {
      userId: "1",
      message: "Test message",
      interactionType: "help",
      context: { currentLesson: "test" }
    });
    if (!response.data.success) {
      throw new Error('Cody AI failed');
    }
    return response.data.data;
  }

  async testLessonsAPI() {
    const response = await axios.get(`${this.baseURL}/api/courses/1/lessons`);
    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new Error('Lessons API failed');
    }
    return { lessonCount: response.data.data.length, lessons: response.data.data };
  }

  async testAgeAdaptation() {
    const response = await axios.get(`${this.baseURL}/api/age-adaptation/profile`);
    if (!response.data.success) {
      throw new Error('Age adaptation failed');
    }
    return response.data.data;
  }

  async testReactFrontend() {
    const response = await axios.get(`${this.clientURL}/`);
    if (!response.data.includes('CodyVerse')) {
      throw new Error('React frontend not loading');
    }
    return { status: 'Frontend loading correctly' };
  }

  async testAPIProxy() {
    const response = await axios.get(`${this.clientURL}/api/courses`);
    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new Error('API proxy not working');
    }
    return { proxyStatus: 'Working', courseCount: response.data.data.length };
  }

  async testThemeSystem() {
    const response = await axios.get(`${this.clientURL}/src/index.css`);
    const themes = ['cyberpunk', 'ocean', 'forest', 'neon'];
    const missingThemes = themes.filter(theme => !response.data.includes(`[data-theme="${theme}"]`));
    if (missingThemes.length > 0) {
      throw new Error(`Missing themes: ${missingThemes.join(', ')}`);
    }
    return { availableThemes: themes.length + 1 }; // +1 for default
  }

  async testDatabaseTables() {
    try {
      // Test each major table exists and has data
      const testQueries = [
        { name: 'Users', endpoint: '/api/gamification/dashboard/1' },
        { name: 'Courses', endpoint: '/api/courses' },
        { name: 'Lessons', endpoint: '/api/courses/1/lessons' }
      ];

      const results = {};
      for (const query of testQueries) {
        const response = await axios.get(`${this.baseURL}${query.endpoint}`);
        results[query.name] = response.data.success ? 'OK' : 'FAILED';
      }
      return results;
    } catch (error) {
      throw new Error(`Database table test failed: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting CodyVerse Integration Debug Tests\n');
    console.log('=' .repeat(50));

    // Backend Tests
    await this.runTest('Backend Health Check', () => this.testHealthEndpoint());
    await this.runTest('Database Connection', () => this.testDatabaseConnection());
    await this.runTest('Database Tables', () => this.testDatabaseTables());
    await this.runTest('Gamification System', () => this.testGamificationSystem());
    await this.runTest('Cody AI Assistant', () => this.testCodyAIAssistant());
    await this.runTest('Lessons API', () => this.testLessonsAPI());
    await this.runTest('Age Adaptation', () => this.testAgeAdaptation());

    // Frontend Tests
    await this.runTest('React Frontend', () => this.testReactFrontend());
    await this.runTest('API Proxy', () => this.testAPIProxy());
    await this.runTest('Theme System', () => this.testThemeSystem());

    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 INTEGRATION TEST REPORT');
    console.log('=' .repeat(50));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    console.log(`\n📈 Summary: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.test}: ${r.error}`));
    }

    console.log('\n✅ Passed Tests:');
    this.results
      .filter(r => r.status === 'PASS')
      .forEach(r => console.log(`   - ${r.test}`));

    console.log('\n🔧 Integration Status:');
    console.log('   - Backend API: ' + (this.results.find(r => r.test === 'Backend Health Check')?.status || 'UNKNOWN'));
    console.log('   - Database: ' + (this.results.find(r => r.test === 'Database Connection')?.status || 'UNKNOWN'));
    console.log('   - Gamification: ' + (this.results.find(r => r.test === 'Gamification System')?.status || 'UNKNOWN'));
    console.log('   - AI Assistant: ' + (this.results.find(r => r.test === 'Cody AI Assistant')?.status || 'UNKNOWN'));
    console.log('   - React Frontend: ' + (this.results.find(r => r.test === 'React Frontend')?.status || 'UNKNOWN'));
    console.log('   - API Proxy: ' + (this.results.find(r => r.test === 'API Proxy')?.status || 'UNKNOWN'));
    console.log('   - Theme System: ' + (this.results.find(r => r.test === 'Theme System')?.status || 'UNKNOWN'));

    if (passed === total) {
      console.log('\n🎉 ALL INTEGRATIONS WORKING CORRECTLY!');
      console.log('🌐 Frontend: http://localhost:3000');
      console.log('🔧 Backend API: http://localhost:5000/api');
      console.log('💚 Health Check: http://localhost:5000/health');
    } else {
      console.log('\n⚠️  Some integrations need attention. Check failed tests above.');
    }

    console.log('\n' + '=' .repeat(50));
  }
}

// Run the tests
const tester = new IntegrationDebugger();
tester.runAllTests().catch(console.error);