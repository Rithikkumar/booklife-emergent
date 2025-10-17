import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserInterests {
  genres: Record<string, number>
  tags: Record<string, number>
  categories: Record<string, number>
  activityLevel: number
}

interface CommunityRecommendation {
  community_id: string
  score: number
  reason: string
  algorithm_type: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    console.log(`Generating recommendations for user: ${user.id}`)

    // Analyze user interests based on their activities
    const userInterests = await analyzeUserInterests(supabase, user.id)
    console.log('User interests analyzed:', userInterests)

    // Get all available communities
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('*')
      .eq('is_public', true)

    if (communitiesError) {
      throw communitiesError
    }

    // Get communities user is already a member of
    const { data: userMemberships } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id)

    const memberCommunityIds = new Set(userMemberships?.map(m => m.community_id) || [])

    // Generate recommendations for communities user isn't already in
    const availableCommunities = communities?.filter(c => !memberCommunityIds.has(c.id)) || []
    const recommendations = generateRecommendations(availableCommunities, userInterests)

    console.log(`Generated ${recommendations.length} recommendations`)

    // Clear existing recommendations for this user
    await supabase
      .from('community_recommendations')
      .delete()
      .eq('user_id', user.id)

    // Insert new recommendations
    if (recommendations.length > 0) {
      const { error: insertError } = await supabase
        .from('community_recommendations')
        .insert(
          recommendations.map(rec => ({
            user_id: user.id,
            community_id: rec.community_id,
            score: rec.score,
            reason: rec.reason,
            algorithm_type: rec.algorithm_type,
            computed_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          }))
        )

      if (insertError) {
        throw insertError
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        recommendations_count: recommendations.length,
        user_interests: userInterests 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error generating recommendations:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function analyzeUserInterests(supabase: any, userId: string): Promise<UserInterests> {
  const interests: UserInterests = {
    genres: {},
    tags: {},
    categories: {},
    activityLevel: 0
  }

  // Analyze user's books to understand reading preferences
  const { data: userBooks } = await supabase
    .from('user_books')
    .select('genre, tags')
    .eq('user_id', userId)

  if (userBooks) {
    userBooks.forEach((book: any) => {
      // Count genres
      if (book.genre) {
        const genre = book.genre.toLowerCase()
        interests.genres[genre] = (interests.genres[genre] || 0) + 1
      }

      // Count tags
      if (book.tags && Array.isArray(book.tags)) {
        book.tags.forEach((tag: string) => {
          const normalizedTag = tag.toLowerCase()
          interests.tags[normalizedTag] = (interests.tags[normalizedTag] || 0) + 1
        })
      }
    })
  }

  // Analyze followed books for additional interests
  const { data: followedBooks } = await supabase
    .from('followed_books')
    .select('book_title, book_author')
    .eq('user_id', userId)

  // Analyze community interactions
  const { data: interactions } = await supabase
    .from('user_community_interactions')
    .select('interaction_type, weight, metadata')
    .eq('user_id', userId)

  if (interactions) {
    interests.activityLevel = interactions.reduce((sum: number, interaction: any) => 
      sum + (interaction.weight || 1), 0
    )
  }

  // Analyze current community memberships for category preferences
  const { data: memberships } = await supabase
    .from('community_members')
    .select(`
      communities!inner(category, tags)
    `)
    .eq('user_id', userId)

  if (memberships) {
    memberships.forEach((membership: any) => {
      const community = membership.communities
      if (community.category) {
        const category = community.category.toLowerCase()
        interests.categories[category] = (interests.categories[category] || 0) + 1
      }

      if (community.tags && Array.isArray(community.tags)) {
        community.tags.forEach((tag: string) => {
          const normalizedTag = tag.toLowerCase()
          interests.tags[normalizedTag] = (interests.tags[normalizedTag] || 0) + 0.5 // Lower weight for community tags
        })
      }
    })
  }

  return interests
}

function generateRecommendations(
  communities: any[], 
  userInterests: UserInterests
): CommunityRecommendation[] {
  const recommendations: CommunityRecommendation[] = []

  communities.forEach(community => {
    let score = 0
    const reasons: string[] = []
    const algorithmTypes: string[] = []

    // Content-based scoring
    const contentScore = calculateContentScore(community, userInterests, reasons)
    score += contentScore
    if (contentScore > 0) {
      algorithmTypes.push('content_based')
    }

    // Activity-based scoring (favor active communities for active users)
    const activityScore = calculateActivityScore(community, userInterests, reasons)
    score += activityScore
    if (activityScore > 0) {
      algorithmTypes.push('activity_based')
    }

    // Popularity-based scoring (slight boost for popular communities)
    const popularityScore = calculatePopularityScore(community, reasons)
    score += popularityScore
    if (popularityScore > 0) {
      algorithmTypes.push('popularity_based')
    }

    // Only recommend if score is above threshold
    if (score > 0.1) {
      recommendations.push({
        community_id: community.id,
        score: Math.round(score * 1000) / 1000, // Round to 3 decimal places
        reason: reasons.length > 0 ? reasons.join('; ') : 'Recommended for you',
        algorithm_type: algorithmTypes.join(',')
      })
    }
  })

  // Sort by score and return top 10
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

function calculateContentScore(
  community: any, 
  userInterests: UserInterests, 
  reasons: string[]
): number {
  let score = 0
  const matchedInterests: string[] = []

  // Check genre/category matches
  if (community.category) {
    const categoryLower = community.category.toLowerCase()
    
    // Direct category match
    if (userInterests.categories[categoryLower]) {
      score += 0.3 * Math.min(userInterests.categories[categoryLower] / 5, 1)
      matchedInterests.push(community.category.toLowerCase())
    }

    // Cross-genre matching (fiction categories with book genres)
    if (categoryLower === 'fiction') {
      const fictionGenres = ['fantasy', 'romance', 'mystery', 'thriller', 'sci-fi', 'science fiction']
      for (const genre of fictionGenres) {
        if (userInterests.genres[genre]) {
          score += 0.2 * Math.min(userInterests.genres[genre] / 3, 1)
          matchedInterests.push(genre)
        }
      }
    }
  }

  // Check tag matches
  if (community.tags && Array.isArray(community.tags)) {
    community.tags.forEach((tag: string) => {
      const tagLower = tag.toLowerCase()
      
      // Direct tag match
      if (userInterests.tags[tagLower]) {
        score += 0.15 * Math.min(userInterests.tags[tagLower] / 3, 1)
        matchedInterests.push(tag)
      }

      // Semantic tag matching
      const semanticMatch = getSemanticTagMatch(tagLower, userInterests.tags)
      if (semanticMatch) {
        score += 0.1 * Math.min(semanticMatch.weight / 3, 1)
        matchedInterests.push(tag)
      }
    })
  }

  // Add reason if we found matches
  if (matchedInterests.length > 0) {
    const uniqueInterests = [...new Set(matchedInterests)].slice(0, 3)
    reasons.push(`Matches your interests in ${uniqueInterests.join(', ')}`)
  }

  return score
}

function calculateActivityScore(
  community: any, 
  userInterests: UserInterests, 
  reasons: string[]
): number {
  let score = 0

  // Match user activity level with community activity
  const communityActivity = community.activity_score || 0
  const userActivity = userInterests.activityLevel

  if (userActivity > 10 && communityActivity > 80) {
    score += 0.1
    reasons.push('High-activity community perfect for active readers')
  } else if (userActivity <= 5 && communityActivity >= 60 && communityActivity <= 80) {
    score += 0.1
    reasons.push('Welcoming community perfect for getting started')
  }

  // Boost newer users towards beginner-friendly communities
  if (userActivity <= 3) {
    const beginnerTags = ['beginner', 'welcome', 'newcomer', 'starter']
    if (community.tags && Array.isArray(community.tags)) {
      const hasBeginner = community.tags.some((tag: string) => 
        beginnerTags.some(bt => tag.toLowerCase().includes(bt))
      )
      if (hasBeginner) {
        score += 0.05
      }
    }
  }

  return score
}

function calculatePopularityScore(community: any, reasons: string[]): number {
  const memberCount = community.member_count || 0
  
  // Small boost for communities with good member counts (not too small, not too large)
  if (memberCount >= 50 && memberCount <= 5000) {
    return 0.02
  }
  
  return 0
}

function getSemanticTagMatch(tag: string, userTags: Record<string, number>) {
  const synonyms: Record<string, string[]> = {
    'fantasy': ['magic', 'dragons', 'adventure', 'epic'],
    'romance': ['love', 'relationships', 'dating'],
    'mystery': ['crime', 'detective', 'suspense'],
    'thriller': ['suspense', 'action', 'crime'],
    'sci-fi': ['science', 'future', 'technology', 'space'],
    'biography': ['memoir', 'life-story', 'autobiography'],
    'education': ['learning', 'study', 'academic', 'textbook'],
    'self-help': ['improvement', 'motivation', 'personal-growth'],
    'fiction': ['novel', 'story', 'narrative'],
    'non-fiction': ['factual', 'true', 'documentary']
  }

  for (const [userTag, weight] of Object.entries(userTags)) {
    if (synonyms[userTag] && synonyms[userTag].includes(tag)) {
      return { tag: userTag, weight }
    }
    if (synonyms[tag] && synonyms[tag].includes(userTag)) {
      return { tag: userTag, weight }
    }
  }

  return null
}