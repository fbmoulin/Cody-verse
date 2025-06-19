const gamificationService = require('../services/gamificationService');
const { db } = require('../server/database');
const { 
  badges, userBadges, userWallet, coinTransactions, 
  userStreaks, userGoals, leaderboards, storeItems,
  userPurchases, gamificationNotifications
} = require('../shared/schema');
const { eq, and, desc, asc, sum, count, gte, lte } = require('drizzle-orm');
const validationService = require('../services/validationService');
const logger = require('../server/logger');
const BaseController = require('../core/BaseController');

class GamificationController extends BaseController {
  constructor() {
    this.gamificationService = gamificationService;
  }

  // Get user's complete gamification dashboard
  async getDashboard(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const { userId } = req.params;
      
      // Validate user ID
      const idValidation = validationService.validateField('userId', userId);
      if (!idValidation.isValid) {
        throw new Error('ID de usuário inválido');
      }

      const dashboard = await this.gamificationService.getUserDashboard(idValidation.sanitizedValue);
      
      if (!dashboard) {
        return this.createErrorResponse('Usuário não encontrado', 404);
      }

      // Sanitize sensitive data before sending
      const sanitizedDashboard = {
        ...dashboard,
        user: dashboard.user ? {
          id: dashboard.user.id,
          name: dashboard.user.name,
          level: dashboard.user.level,
          totalXP: dashboard.user.totalXP
        } : null
      };

      return this.createResponse(sanitizedDashboard, 'Dashboard carregado com sucesso');
    });
  }

  // Get user's badges
  async getUserBadges(req, res) {
    try {
      const userId = req.params.userId || req.user?.id;
      const { category, rarity } = req.query;

      let query = db.select({
        badge: badges,
        earnedAt: userBadges.earnedAt,
        progress: userBadges.progress,
        isVisible: userBadges.isVisible
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId));

      if (category) {
        query = query.where(eq(badges.category, category));
      }
      if (rarity) {
        query = query.where(eq(badges.rarity, rarity));
      }

      const userBadgesList = await query.orderBy(desc(userBadges.earnedAt));

      // Also get available badges not yet earned
      const allBadges = await db.select().from(badges).where(eq(badges.isActive, true));
      const earnedBadgeIds = new Set(userBadgesList.map(ub => ub.badge.id));
      
      const availableBadges = allBadges.filter(badge => !earnedBadgeIds.has(badge.id));

      res.json({
        success: true,
        data: {
          earnedBadges: userBadgesList,
          availableBadges: availableBadges,
          stats: {
            totalEarned: userBadgesList.length,
            totalAvailable: allBadges.length,
            byCategory: this.groupBadgesByCategory(userBadgesList),
            byRarity: this.groupBadgesByRarity(userBadgesList)
          }
        }
      });

    } catch (error) {
      console.error('Error getting user badges:', error);
      res.status(500).json({ 
        error: 'Failed to get badges',
        message: error.message 
      });
    }
  }

  // Get user's wallet and transaction history
  async getWallet(req, res) {
    try {
      const userId = req.params.userId || req.user?.id;
      const { limit = 20, offset = 0 } = req.query;

      // Get wallet info
      const wallet = await db.select()
        .from(userWallet)
        .where(eq(userWallet.userId, userId))
        .limit(1);

      // Get recent transactions
      const transactions = await db.select()
        .from(coinTransactions)
        .where(eq(coinTransactions.userId, userId))
        .orderBy(desc(coinTransactions.createdAt))
        .limit(parseInt(limit))
        .offset(parseInt(offset));

      // Get earning stats
      const earningStats = await db.select({
        totalEarned: sum(coinTransactions.amount)
      })
      .from(coinTransactions)
      .where(and(
        eq(coinTransactions.userId, userId),
        eq(coinTransactions.transactionType, 'earned')
      ));

      const spendingStats = await db.select({
        totalSpent: sum(coinTransactions.amount)
      })
      .from(coinTransactions)
      .where(and(
        eq(coinTransactions.userId, userId),
        eq(coinTransactions.transactionType, 'spent')
      ));

      res.json({
        success: true,
        data: {
          wallet: wallet[0] || { coins: 0, gems: 0, totalCoinsEarned: 0, totalCoinsSpent: 0 },
          recentTransactions: transactions,
          stats: {
            totalEarned: earningStats[0]?.totalEarned || 0,
            totalSpent: Math.abs(spendingStats[0]?.totalSpent || 0),
            transactionCount: transactions.length
          }
        }
      });

    } catch (error) {
      console.error('Error getting wallet:', error);
      res.status(500).json({ 
        error: 'Failed to get wallet',
        message: error.message 
      });
    }
  }

  // Get user's streaks
  async getStreaks(req, res) {
    try {
      const userId = req.params.userId || req.user?.id;

      const streaks = await db.select()
        .from(userStreaks)
        .where(eq(userStreaks.userId, userId));

      // Calculate streak health and recommendations
      const streakAnalysis = streaks.map(streak => {
        const daysSinceLastActivity = Math.floor(
          (Date.now() - new Date(streak.lastActivityDate)) / (1000 * 60 * 60 * 24)
        );
        
        let status = 'active';
        let risk = 'low';
        
        if (daysSinceLastActivity > 1) {
          status = 'broken';
          risk = 'high';
        } else if (daysSinceLastActivity === 1) {
          status = 'at_risk';
          risk = 'medium';
        }

        return {
          ...streak,
          daysSinceLastActivity,
          status,
          risk,
          canUseFreeze: streak.freezesAvailable > 0 && status === 'at_risk'
        };
      });

      res.json({
        success: true,
        data: {
          streaks: streakAnalysis,
          summary: {
            totalActiveStreaks: streakAnalysis.filter(s => s.status === 'active').length,
            atRiskStreaks: streakAnalysis.filter(s => s.status === 'at_risk').length,
            longestStreak: Math.max(...streakAnalysis.map(s => s.longestStreak), 0),
            totalFreezesAvailable: streakAnalysis.reduce((sum, s) => sum + s.freezesAvailable, 0)
          }
        }
      });

    } catch (error) {
      console.error('Error getting streaks:', error);
      res.status(500).json({ 
        error: 'Failed to get streaks',
        message: error.message 
      });
    }
  }

  // Get user's goals
  async getGoals(req, res) {
    try {
      const userId = req.params.userId || req.user?.id;
      const { type = 'daily' } = req.query;

      let dateFilter = new Date();
      dateFilter.setHours(0, 0, 0, 0);

      if (type === 'weekly') {
        const dayOfWeek = dateFilter.getDay();
        dateFilter.setDate(dateFilter.getDate() - dayOfWeek);
      } else if (type === 'monthly') {
        dateFilter.setDate(1);
      }

      const goals = await db.select()
        .from(userGoals)
        .where(and(
          eq(userGoals.userId, userId),
          eq(userGoals.goalType, type),
          gte(userGoals.goalDate, dateFilter)
        ))
        .orderBy(asc(userGoals.goalCategory));

      // Create goals if they don't exist for today
      if (goals.length === 0 && type === 'daily') {
        await this.gamificationService.createDailyGoals(userId);
        const newGoals = await db.select()
          .from(userGoals)
          .where(and(
            eq(userGoals.userId, userId),
            eq(userGoals.goalType, 'daily'),
            gte(userGoals.goalDate, dateFilter)
          ));
        
        return res.json({
          success: true,
          data: {
            goals: newGoals,
            summary: this.calculateGoalsSummary(newGoals)
          }
        });
      }

      res.json({
        success: true,
        data: {
          goals,
          summary: this.calculateGoalsSummary(goals)
        }
      });

    } catch (error) {
      console.error('Error getting goals:', error);
      res.status(500).json({ 
        error: 'Failed to get goals',
        message: error.message 
      });
    }
  }

  // Get leaderboards
  async getLeaderboards(req, res) {
    try {
      const { type = 'weekly_xp', timeframe = 'weekly', limit = 100 } = req.query;
      const userId = req.params.userId || req.user?.id;

      // Get current period dates
      const now = new Date();
      let periodStart = new Date();
      let periodEnd = new Date();

      switch (timeframe) {
        case 'daily':
          periodStart.setHours(0, 0, 0, 0);
          periodEnd.setHours(23, 59, 59, 999);
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          periodStart.setDate(now.getDate() - dayOfWeek);
          periodStart.setHours(0, 0, 0, 0);
          periodEnd.setDate(periodStart.getDate() + 6);
          periodEnd.setHours(23, 59, 59, 999);
          break;
        case 'monthly':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'all_time':
          periodStart = new Date('2020-01-01');
          periodEnd = new Date('2030-12-31');
          break;
      }

      const leaderboard = await db.select()
        .from(leaderboards)
        .where(and(
          eq(leaderboards.leaderboardType, type),
          eq(leaderboards.timeframe, timeframe),
          gte(leaderboards.periodStart, periodStart),
          lte(leaderboards.periodEnd, periodEnd)
        ))
        .orderBy(asc(leaderboards.rank))
        .limit(parseInt(limit));

      // Find user's position
      const userPosition = leaderboard.find(entry => entry.userId === parseInt(userId));
      const userRank = userPosition?.rank || null;

      res.json({
        success: true,
        data: {
          leaderboard,
          userPosition: userPosition,
          userRank,
          period: {
            start: periodStart,
            end: periodEnd,
            type: timeframe
          },
          stats: {
            totalParticipants: leaderboard.length,
            topScore: leaderboard[0]?.score || 0,
            averageScore: leaderboard.length > 0 
              ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.score, 0) / leaderboard.length)
              : 0
          }
        }
      });

    } catch (error) {
      console.error('Error getting leaderboards:', error);
      res.status(500).json({ 
        error: 'Failed to get leaderboards',
        message: error.message 
      });
    }
  }

  // Get store items
  async getStore(req, res) {
    try {
      const { category, itemType, sortBy = 'price' } = req.query;
      const userId = req.params.userId || req.user?.id;

      let query = db.select().from(storeItems).where(eq(storeItems.isActive, true));

      if (category) {
        query = query.where(eq(storeItems.category, category));
      }
      if (itemType) {
        query = query.where(eq(storeItems.itemType, itemType));
      }

      const orderColumn = sortBy === 'name' ? storeItems.name : storeItems.price;
      const items = await query.orderBy(asc(orderColumn));

      // Get user's wallet to show affordability
      const wallet = await db.select()
        .from(userWallet)
        .where(eq(userWallet.userId, userId))
        .limit(1);

      const userCoins = wallet[0]?.coins || 0;
      const userGems = wallet[0]?.gems || 0;

      // Get user's purchases to show owned items
      const purchases = await db.select()
        .from(userPurchases)
        .where(and(
          eq(userPurchases.userId, userId),
          eq(userPurchases.isActive, true)
        ));

      const ownedItemIds = new Set(purchases.map(p => p.itemId));

      const enhancedItems = items.map(item => ({
        ...item,
        canAfford: item.currency === 'coins' ? userCoins >= item.price : userGems >= item.price,
        isOwned: ownedItemIds.has(item.id),
        quantityOwned: purchases.filter(p => p.itemId === item.id).reduce((sum, p) => sum + p.quantity, 0)
      }));

      res.json({
        success: true,
        data: {
          items: enhancedItems,
          categories: [...new Set(items.map(item => item.category))],
          userWallet: { coins: userCoins, gems: userGems },
          stats: {
            totalItems: items.length,
            affordableItems: enhancedItems.filter(item => item.canAfford).length,
            ownedItems: enhancedItems.filter(item => item.isOwned).length
          }
        }
      });

    } catch (error) {
      console.error('Error getting store:', error);
      res.status(500).json({ 
        error: 'Failed to get store',
        message: error.message 
      });
    }
  }

  // Purchase store item
  async purchaseItem(req, res) {
    try {
      const userId = req.params.userId || req.user?.id;
      const { itemId, quantity = 1 } = req.body;

      // Get item details
      const item = await db.select()
        .from(storeItems)
        .where(and(
          eq(storeItems.id, itemId),
          eq(storeItems.isActive, true)
        ))
        .limit(1);

      if (item.length === 0) {
        return res.status(404).json({ error: 'Item not found or not available' });
      }

      const storeItem = item[0];
      const totalPrice = storeItem.price * quantity;

      // Check user's wallet
      const wallet = await db.select()
        .from(userWallet)
        .where(eq(userWallet.userId, userId))
        .limit(1);

      if (wallet.length === 0) {
        return res.status(400).json({ error: 'User wallet not found' });
      }

      const userWalletData = wallet[0];
      const availableCurrency = storeItem.currency === 'coins' ? userWalletData.coins : userWalletData.gems;

      if (availableCurrency < totalPrice) {
        return res.status(400).json({ 
          error: 'Insufficient funds',
          required: totalPrice,
          available: availableCurrency,
          currency: storeItem.currency
        });
      }

      // Check purchase limits
      if (storeItem.limitPerUser) {
        const existingPurchases = await db.select({ total: sum(userPurchases.quantity) })
          .from(userPurchases)
          .where(and(
            eq(userPurchases.userId, userId),
            eq(userPurchases.itemId, itemId),
            eq(userPurchases.isActive, true)
          ));

        const currentQuantity = existingPurchases[0]?.total || 0;
        if (currentQuantity + quantity > storeItem.limitPerUser) {
          return res.status(400).json({ 
            error: 'Purchase limit exceeded',
            limit: storeItem.limitPerUser,
            current: currentQuantity
          });
        }
      }

      // Process purchase
      const purchase = await db.insert(userPurchases).values({
        userId,
        itemId,
        quantity,
        totalPrice,
        currency: storeItem.currency,
        purchaseDate: new Date()
      }).returning();

      // Deduct currency from wallet
      const updateData = storeItem.currency === 'coins'
        ? { 
            coins: userWalletData.coins - totalPrice,
            totalCoinsSpent: userWalletData.totalCoinsSpent + totalPrice
          }
        : { gems: userWalletData.gems - totalPrice };

      await db.update(userWallet)
        .set(updateData)
        .where(eq(userWallet.userId, userId));

      // Record transaction
      await db.insert(coinTransactions).values({
        userId,
        transactionType: 'spent',
        amount: -totalPrice,
        reason: `Purchased ${storeItem.name}`,
        source: 'store_purchase',
        metadata: { itemId, quantity, itemName: storeItem.name }
      });

      // Create notification
      await this.gamificationService.createNotification(
        userId,
        'store_purchase',
        'Purchase Successful! 🛍️',
        `You've purchased ${quantity}x ${storeItem.name} for ${totalPrice} ${storeItem.currency}`,
        '💰',
        { itemId, itemName: storeItem.name, quantity, totalPrice }
      );

      res.json({
        success: true,
        data: {
          purchase: purchase[0],
          item: storeItem,
          remainingBalance: storeItem.currency === 'coins' 
            ? userWalletData.coins - totalPrice 
            : userWalletData.gems - totalPrice
        }
      });

    } catch (error) {
      console.error('Error purchasing item:', error);
      res.status(500).json({ 
        error: 'Failed to purchase item',
        message: error.message 
      });
    }
  }

  // Get notifications
  async getNotifications(req, res) {
    try {
      const userId = req.params.userId || req.user?.id;
      const { limit = 20, unreadOnly = false } = req.query;

      let query = db.select()
        .from(gamificationNotifications)
        .where(eq(gamificationNotifications.userId, userId));

      if (unreadOnly === 'true') {
        query = query.where(eq(gamificationNotifications.isRead, false));
      }

      const notifications = await query
        .orderBy(desc(gamificationNotifications.createdAt))
        .limit(parseInt(limit));

      const unreadCount = await db.select({ count: count() })
        .from(gamificationNotifications)
        .where(and(
          eq(gamificationNotifications.userId, userId),
          eq(gamificationNotifications.isRead, false)
        ));

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount: unreadCount[0]?.count || 0
        }
      });

    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ 
        error: 'Failed to get notifications',
        message: error.message 
      });
    }
  }

  // Mark notification as read
  async markNotificationRead(req, res) {
    try {
      const userId = req.params.userId || req.user?.id;
      const { notificationId } = req.params;

      await db.update(gamificationNotifications)
        .set({ 
          isRead: true,
          readAt: new Date()
        })
        .where(and(
          eq(gamificationNotifications.id, notificationId),
          eq(gamificationNotifications.userId, userId)
        ));

      res.json({ success: true });

    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ 
        error: 'Failed to mark notification as read',
        message: error.message 
      });
    }
  }

  // Process lesson completion with gamification
  async processLessonCompletion(req, res) {
    try {
      const userId = req.params.userId || req.user?.id;
      const { lessonId, timeSpent, score = 100 } = req.body;

      const results = await this.gamificationService.processLessonCompletion(
        userId, 
        lessonId, 
        timeSpent, 
        score
      );

      if (!results) {
        return res.status(500).json({ error: 'Failed to process lesson completion' });
      }

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Error processing lesson completion:', error);
      res.status(500).json({ 
        error: 'Failed to process lesson completion',
        message: error.message 
      });
    }
  }

  // Helper methods
  groupBadgesByCategory(badges) {
    const groups = {};
    badges.forEach(({ badge }) => {
      if (!groups[badge.category]) {
        groups[badge.category] = 0;
      }
      groups[badge.category]++;
    });
    return groups;
  }

  groupBadgesByRarity(badges) {
    const groups = {};
    badges.forEach(({ badge }) => {
      if (!groups[badge.rarity]) {
        groups[badge.rarity] = 0;
      }
      groups[badge.rarity]++;
    });
    return groups;
  }

  calculateGoalsSummary(goals) {
    const completed = goals.filter(g => g.isCompleted).length;
    const totalProgress = goals.reduce((sum, g) => {
      return sum + Math.min(100, (g.currentProgress / g.targetValue) * 100);
    }, 0);

    return {
      totalGoals: goals.length,
      completedGoals: completed,
      averageProgress: goals.length > 0 ? Math.round(totalProgress / goals.length) : 0,
      completionRate: goals.length > 0 ? Math.round((completed / goals.length) * 100) : 0
    };
  }
}

module.exports = new GamificationController();