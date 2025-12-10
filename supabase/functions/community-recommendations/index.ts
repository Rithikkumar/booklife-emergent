import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserActivity {
  books: Array<{ title: string; author: string; }>;
  favorites: Array<{ book_title: string; book_author: string; }>;
  posts: Array<{ content: string; }>;
  likes: Array<{ post_id: string; }>;
  saved: Array<{ post_id: string; }>;
  following: Array<{ following_id: string; }>;
}

interface Community {
  id: string;
  name: string;
  description: string;
  tags: string[];
  category: string;
  member_count: number;
  activity_score: number;
}

interface Recommendation {
  community_id: string;
  score: number;
  reason: string;
  algorithm_type: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Set auth for the request
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log(`Generating recommendations for user: ${user.id}`);

    // Fetch user activity data
    const userActivity = await fetchUserActivity(supabase, user.id);
    console.log('User activity fetched:', userActivity);

    // Get all communities
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('*');

    if (communitiesError) {
      throw communitiesError;
    }

    console.log(`Found ${communities?.length || 0} communities to analyze`);

    // Generate recommendations using different algorithms
    const recommendations: Recommendation[] = [];

    // Content-based recommendations
    const contentRecs = generateContentBasedRecommendations(userActivity, communities || []);
    recommendations.push(...contentRecs);

    // Collaborative filtering recommendations
    const collabRecs = await generateCollaborativeRecommendations(supabase, user.id, communities || []);
    recommendations.push(...collabRecs);

    // Activity-based recommendations
    const activityRecs = generateActivityBasedRecommendations(userActivity, communities || []);
    recommendations.push(...activityRecs);

    // Social recommendations
    const socialRecs = await generateSocialRecommendations(supabase, user.id, communities || []);
    recommendations.push(...socialRecs);

    console.log(`Generated ${recommendations.length} total recommendations`);

    // Remove duplicates and rank by score
    const uniqueRecs = aggregateRecommendations(recommendations);
    console.log(`Final unique recommendations: ${uniqueRecs.length}`);

    // Cache recommendations
    await cacheRecommendations(supabase, user.id, uniqueRecs);

    return new Response(JSON.stringify({ 
      recommendations: uniqueRecs.slice(0, 10), // Top 10 recommendations
      user_activity_summary: {
        books_count: userActivity.books.length,
        favorites_count: userActivity.favorites.length,
        posts_count: userActivity.posts.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchUserActivity(supabase: any, userId: string): Promise<UserActivity> {
  const [
    { data: books },
    { data: favorites },
    { data: posts },
    { data: likes },
    { data: saved },
    { data: following }
  ] = await Promise.all([
    supabase.from('user_books').select('title, author').eq('user_id', userId),
    supabase.from('favorite_books').select('book_title, book_author').eq('user_id', userId),
    supabase.from('posts').select('content').eq('user_id', userId),
    supabase.from('post_likes').select('post_id').eq('user_id', userId),
    supabase.from('saved_posts').select('post_id').eq('user_id', userId),
    supabase.from('followers').select('following_id').eq('follower_id', userId)
  ]);

  return {
    books: books || [],
    favorites: favorites || [],
    posts: posts || [],
    likes: likes || [],
    saved: saved || [],
    following: following || []
  };
}

function generateContentBasedRecommendations(userActivity: UserActivity, communities: Community[]): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Extract user interests from books and favorites
  const userTags = new Set<string>();
  const userAuthors = new Set<string>();
  
  userActivity.books.forEach(book => {
    // Extract potential tags from book titles and authors
    const words = `${book.title} ${book.author}`.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) userTags.add(word);
    });
    userAuthors.add(book.author.toLowerCase());
  });

  userActivity.favorites.forEach(book => {
    const words = `${book.book_title} ${book.book_author}`.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) userTags.add(word);
    });
    userAuthors.add(book.book_author.toLowerCase());
  });

  // Score communities based on tag overlap
  communities.forEach(community => {
    let score = 0;
    let matchedTags: string[] = [];
    
    community.tags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      if (userTags.has(tagLower)) {
        score += 0.3;
        matchedTags.push(tag);
      }
      
      // Check if any user authors match community focus
      userAuthors.forEach(author => {
        if (tagLower.includes(author) || author.includes(tagLower)) {
          score += 0.4;
          matchedTags.push(`author: ${author}`);
        }
      });
    });

    // Boost score based on community activity
    score += (community.activity_score / 100) * 0.2;
    
    if (score > 0.1) {
      recommendations.push({
        community_id: community.id,
        score,
        reason: `Matches your interests in ${matchedTags.slice(0, 3).join(', ')}`,
        algorithm_type: 'content_based'
      });
    }
  });

  return recommendations;
}

async function generateCollaborativeRecommendations(supabase: any, userId: string, communities: Community[]): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  
  try {
    // Find users with similar book collections
    const { data: similarUsers } = await supabase.rpc('find_similar_users', { target_user_id: userId });
    
    if (similarUsers?.length) {
      // Get communities joined by similar users
      const { data: similarUserCommunities } = await supabase
        .from('community_members')
        .select('community_id, user_id')
        .in('user_id', similarUsers.map((u: any) => u.user_id));

      // Score communities based on how many similar users joined them
      const communityScores = new Map<string, number>();
      
      similarUserCommunities?.forEach((membership: any) => {
        const current = communityScores.get(membership.community_id) || 0;
        communityScores.set(membership.community_id, current + 0.3);
      });

      communityScores.forEach((score, communityId) => {
        const community = communities.find(c => c.id === communityId);
        if (community) {
          recommendations.push({
            community_id: communityId,
            score,
            reason: `Popular among users with similar book tastes`,
            algorithm_type: 'collaborative'
          });
        }
      });
    }
  } catch (error) {
    console.log('Collaborative filtering not available yet:', error);
  }

  return recommendations;
}

function generateActivityBasedRecommendations(userActivity: UserActivity, communities: Community[]): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Score based on user engagement level
  const engagementScore = (userActivity.posts.length * 0.3) + 
                         (userActivity.likes.length * 0.1) + 
                         (userActivity.saved.length * 0.2);
  
  // Recommend highly active communities for engaged users
  if (engagementScore > 5) {
    communities
      .filter(c => c.activity_score > 80)
      .forEach(community => {
        recommendations.push({
          community_id: community.id,
          score: 0.4 + (community.activity_score / 100) * 0.3,
          reason: `High-activity community perfect for engaged readers`,
          algorithm_type: 'activity_based'
        });
      });
  }
  
  // Recommend smaller communities for new users
  if (engagementScore < 2) {
    communities
      .filter(c => c.member_count < 1000)
      .forEach(community => {
        recommendations.push({
          community_id: community.id,
          score: 0.3,
          reason: `Welcoming community perfect for getting started`,
          algorithm_type: 'activity_based'
        });
      });
  }

  return recommendations;
}

async function generateSocialRecommendations(supabase: any, userId: string, communities: Community[]): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  
  try {
    // Find communities joined by users that this user follows
    const { data: followeeCommunities } = await supabase
      .from('community_members')
      .select('community_id, user_id')
      .in('user_id', (await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId)
      ).data?.map((f: any) => f.following_id) || []);

    const communityScores = new Map<string, number>();
    
    followeeCommunities?.forEach((membership: any) => {
      const current = communityScores.get(membership.community_id) || 0;
      communityScores.set(membership.community_id, current + 0.4);
    });

    communityScores.forEach((score, communityId) => {
      const community = communities.find(c => c.id === communityId);
      if (community) {
        recommendations.push({
          community_id: communityId,
          score,
          reason: `Joined by people you follow`,
          algorithm_type: 'social'
        });
      }
    });
  } catch (error) {
    console.log('Social recommendations not available:', error);
  }

  return recommendations;
}

function aggregateRecommendations(recommendations: Recommendation[]): Recommendation[] {
  const communityMap = new Map<string, Recommendation>();
  
  recommendations.forEach(rec => {
    const existing = communityMap.get(rec.community_id);
    if (existing) {
      // Combine scores and reasons
      existing.score = Math.max(existing.score, rec.score) + (rec.score * 0.2);
      existing.reason = existing.reason.includes(rec.reason) ? existing.reason : `${existing.reason}; ${rec.reason}`;
      if (!existing.algorithm_type.includes(rec.algorithm_type)) {
        existing.algorithm_type += `,${rec.algorithm_type}`;
      }
    } else {
      communityMap.set(rec.community_id, { ...rec });
    }
  });
  
  return Array.from(communityMap.values())
    .sort((a, b) => b.score - a.score);
}

async function cacheRecommendations(supabase: any, userId: string, recommendations: Recommendation[]): Promise<void> {
  try {
    // Clear existing recommendations for this user
    await supabase
      .from('community_recommendations')
      .delete()
      .eq('user_id', userId);

    // Insert new recommendations
    const cacheData = recommendations.map(rec => ({
      user_id: userId,
      community_id: rec.community_id,
      score: rec.score,
      reason: rec.reason,
      algorithm_type: rec.algorithm_type
    }));

    if (cacheData.length > 0) {
      await supabase
        .from('community_recommendations')
        .insert(cacheData);
    }

    console.log(`Cached ${cacheData.length} recommendations for user ${userId}`);
  } catch (error) {
    console.error('Error caching recommendations:', error);
  }
}