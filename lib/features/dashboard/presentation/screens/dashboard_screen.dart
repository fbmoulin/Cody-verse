import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../shared/widgets/mcp_card.dart';
import '../../../../shared/widgets/loading_widget.dart';
import '../../../../shared/widgets/error_widget.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../learning/presentation/providers/learning_provider.dart';
import '../../../gamification/presentation/providers/gamification_provider.dart';
import '../providers/dashboard_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider);
    final dashboardState = ref.watch(dashboardProvider);
    final recentLessons = ref.watch(recentLessonsProvider);
    final userProgress = ref.watch(userProgressProvider);

    if (user == null) {
      return const Scaffold(
        body: MCPLoadingWidget(message: 'Loading user data...'),
      );
    }

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardProvider);
          ref.invalidate(recentLessonsProvider);
          ref.invalidate(userProgressProvider);
        },
        child: CustomScrollView(
          slivers: [
            // App Bar
            SliverAppBar(
              expandedHeight: 120,
              floating: true,
              pinned: true,
              flexibleSpace: FlexibleSpaceBar(
                title: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome back,',
                      style: context.textTheme.bodySmall?.copyWith(
                        color: context.colorScheme.onPrimaryContainer,
                      ),
                    ),
                    Text(
                      user.displayName,
                      style: context.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: context.colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ],
                ),
                titlePadding: const EdgeInsets.only(left: 16, bottom: 16),
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        context.colorScheme.primaryContainer,
                        context.colorScheme.primary,
                      ],
                    ),
                  ),
                ),
              ),
              actions: [
                IconButton(
                  onPressed: () => context.go('/profile'),
                  icon: CircleAvatar(
                    radius: 16,
                    backgroundImage: user.photoURL != null
                        ? NetworkImage(user.photoURL!)
                        : null,
                    child: user.photoURL == null
                        ? const Icon(Icons.person, size: 16)
                        : null,
                  ),
                ),
                const SizedBox(width: 8),
              ],
            ),

            // Content
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // User Stats Section
                  FadeInUp(
                    duration: const Duration(milliseconds: 600),
                    child: _buildUserStats(context, user),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Streak Card
                  FadeInUp(
                    duration: const Duration(milliseconds: 600),
                    delay: const Duration(milliseconds: 200),
                    child: _buildStreakCard(context, user),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Quick Actions
                  FadeInUp(
                    duration: const Duration(milliseconds: 600),
                    delay: const Duration(milliseconds: 400),
                    child: _buildQuickActions(context),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Continue Learning Section
                  FadeInUp(
                    duration: const Duration(milliseconds: 600),
                    delay: const Duration(milliseconds: 600),
                    child: _buildContinueLearning(context, ref, recentLessons),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Progress Overview
                  FadeInUp(
                    duration: const Duration(milliseconds: 600),
                    delay: const Duration(milliseconds: 800),
                    child: _buildProgressOverview(context, ref, userProgress),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Recent Achievements
                  FadeInUp(
                    duration: const Duration(milliseconds: 600),
                    delay: const Duration(milliseconds: 1000),
                    child: _buildRecentAchievements(context, ref),
                  ),
                  
                  const SizedBox(height: 100), // Bottom padding for navigation
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUserStats(BuildContext context, user) {
    return Row(
      children: [
        Expanded(
          child: MCPStatCard(
            title: 'Level',
            value: user.level.toString(),
            icon: Icons.star,
            iconColor: Colors.amber,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: MCPStatCard(
            title: 'Total XP',
            value: user.xp.toString(),
            icon: Icons.bolt,
            iconColor: Colors.orange,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: MCPStatCard(
            title: 'Streak',
            value: '${user.streak} days',
            icon: Icons.local_fire_department,
            iconColor: Colors.red,
          ),
        ),
      ],
    );
  }

  Widget _buildStreakCard(BuildContext context, user) {
    final streakDays = user.streak;
    final isOnStreak = user.isOnStreak;
    
    return MCPGradientCard(
      gradientColors: isOnStreak
          ? [Colors.orange.shade400, Colors.red.shade400]
          : [context.colorScheme.surfaceVariant, context.colorScheme.surface],
      child: Row(
        children: [
          Icon(
            Icons.local_fire_department,
            size: 40,
            color: isOnStreak ? Colors.white : context.colorScheme.onSurfaceVariant,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isOnStreak ? '$streakDays Day Streak!' : 'Start Your Streak!',
                  style: context.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: isOnStreak ? Colors.white : context.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isOnStreak
                      ? 'Keep it up! Complete a lesson today.'
                      : 'Complete a lesson to start your streak.',
                  style: context.textTheme.bodyMedium?.copyWith(
                    color: isOnStreak
                        ? Colors.white.withOpacity(0.9)
                        : context.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: context.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _QuickActionCard(
                title: 'Start Learning',
                subtitle: 'Explore new concepts',
                icon: Icons.school,
                color: Colors.blue,
                onTap: () => context.go('/learning'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickActionCard(
                title: 'Practice Lab',
                subtitle: 'Hands-on coding',
                icon: Icons.science,
                color: Colors.green,
                onTap: () => context.go('/lab'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickActionCard(
                title: 'Community',
                subtitle: 'Connect & share',
                icon: Icons.people,
                color: Colors.purple,
                onTap: () => context.go('/community'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildContinueLearning(BuildContext context, WidgetRef ref, AsyncValue recentLessons) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Continue Learning',
              style: context.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton(
              onPressed: () => context.go('/learning'),
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        recentLessons.when(
          data: (lessons) {
            if (lessons.isEmpty) {
              return MCPCard(
                child: Column(
                  children: [
                    Icon(
                      Icons.school_outlined,
                      size: 48,
                      color: context.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'No recent lessons',
                      style: context.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Start your learning journey today!',
                      style: context.textTheme.bodyMedium?.copyWith(
                        color: context.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () => context.go('/learning'),
                      child: const Text('Browse Lessons'),
                    ),
                  ],
                ),
              );
            }
            
            return SizedBox(
              height: 160,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: lessons.length,
                itemBuilder: (context, index) {
                  final lesson = lessons[index];
                  return Container(
                    width: 300,
                    margin: const EdgeInsets.only(right: 12),
                    child: MCPCard(
                      onTap: () => context.go('/learning/lesson/${lesson.id}'),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: context.colorScheme.primaryContainer,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  lesson.category,
                                  style: context.textTheme.labelSmall?.copyWith(
                                    color: context.colorScheme.onPrimaryContainer,
                                  ),
                                ),
                              ),
                              const Spacer(),
                              Text(
                                lesson.formattedDuration,
                                style: context.textTheme.bodySmall?.copyWith(
                                  color: context.colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            lesson.title,
                            style: context.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            lesson.description,
                            style: context.textTheme.bodySmall?.copyWith(
                              color: context.colorScheme.onSurfaceVariant,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const Spacer(),
                          Row(
                            children: [
                              Icon(
                                Icons.bolt,
                                size: 16,
                                color: Colors.orange,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${lesson.xpReward} XP',
                                style: context.textTheme.bodySmall?.copyWith(
                                  color: Colors.orange,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const Spacer(),
                              Icon(
                                Icons.arrow_forward_ios,
                                size: 16,
                                color: context.colorScheme.onSurfaceVariant,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            );
          },
          loading: () => const SizedBox(
            height: 160,
            child: MCPLoadingWidget(),
          ),
          error: (error, stack) => MCPErrorWidget(
            message: 'Failed to load recent lessons',
            onRetry: () => ref.invalidate(recentLessonsProvider),
          ),
        ),
      ],
    );
  }

  Widget _buildProgressOverview(BuildContext context, WidgetRef ref, AsyncValue userProgress) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Your Progress',
          style: context.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        userProgress.when(
          data: (progress) {
            return Column(
              children: [
                MCPProgressCard(
                  title: 'Overall Progress',
                  subtitle: '${progress['completedLessons']} of ${progress['totalLessons']} lessons completed',
                  progress: (progress['completedLessons'] / progress['totalLessons']).clamp(0.0, 1.0),
                  icon: Icons.school,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: MCPProgressCard(
                        title: 'MCP Basics',
                        subtitle: '${progress['mcpProgress']}% complete',
                        progress: progress['mcpProgress'] / 100,
                        progressColor: Colors.blue,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: MCPProgressCard(
                        title: 'AI Concepts',
                        subtitle: '${progress['aiProgress']}% complete',
                        progress: progress['aiProgress'] / 100,
                        progressColor: Colors.green,
                      ),
                    ),
                  ],
                ),
              ],
            );
          },
          loading: () => const MCPSkeletonCard(),
          error: (error, stack) => MCPErrorWidget(
            message: 'Failed to load progress data',
            onRetry: () => ref.invalidate(userProgressProvider),
          ),
        ),
      ],
    );
  }

  Widget _buildRecentAchievements(BuildContext context, WidgetRef ref) {
    final recentAchievements = ref.watch(recentAchievementsProvider);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Achievements',
              style: context.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton(
              onPressed: () => context.go('/profile'),
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        recentAchievements.when(
          data: (achievements) {
            if (achievements.isEmpty) {
              return MCPCard(
                child: Column(
                  children: [
                    Icon(
                      Icons.emoji_events_outlined,
                      size: 48,
                      color: context.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'No achievements yet',
                      style: context.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Complete lessons to unlock achievements!',
                      style: context.textTheme.bodyMedium?.copyWith(
                        color: context.colorScheme.onSurfaceVariant,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              );
            }
            
            return Column(
              children: achievements.take(3).map((achievement) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: MCPAchievementCard(
                    title: achievement.title,
                    description: achievement.description,
                    icon: Icons.emoji_events,
                    isUnlocked: achievement.isUnlocked,
                    rarity: achievement.rarityText,
                    onTap: () => context.go('/profile'),
                  ),
                );
              }).toList(),
            );
          },
          loading: () => Column(
            children: List.generate(3, (index) => const Padding(
              padding: EdgeInsets.only(bottom: 8),
              child: MCPSkeletonCard(height: 80),
            )),
          ),
          error: (error, stack) => MCPErrorWidget(
            message: 'Failed to load achievements',
            onRetry: () => ref.invalidate(recentAchievementsProvider),
          ),
        ),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return MCPCard(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: color,
              size: 24,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: context.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: context.textTheme.bodySmall?.copyWith(
              color: context.colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
