import 'dotenv/config';

/**
 * Fetch Google Place Reviews using Google Places API
 * @param {string} placeId - The Google Place ID for your clinic
 * @returns {Promise<Object>} Reviews data including snippets and place info
 */
export async function fetchGoogleReviews(placeId) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  Google Places API key not configured');
    return {
      success: false,
      error: 'API key not configured',
      snippets: []
    };
  }

  try {
    // Use the Place Details API to get reviews
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,user_ratings_total,url&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      return {
        success: false,
        error: data.error_message || data.status,
        snippets: []
      };
    }

    const place = data.result;
    const reviews = place.reviews || [];
    
    // Transform Google reviews to match our format
    const snippets = reviews.map(review => ({
      author: review.author_name,
      rating: review.rating,
      text: review.text,
      time: review.time,
      profilePhotoUrl: review.profile_photo_url
    }));

    return {
      success: true,
      placeUrl: place.url,
      placeName: place.name,
      overallRating: place.rating,
      totalReviews: place.user_ratings_total,
      snippets: snippets
    };
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    return {
      success: false,
      error: error.message,
      snippets: []
    };
  }
}

/**
 * Get cached reviews with refresh capability
 * This helps avoid hitting API rate limits
 */
let cachedReviews = null;
let lastFetchTime = null;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export async function getCachedGoogleReviews(placeId) {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (cachedReviews && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('✅ Returning cached Google reviews');
    return cachedReviews;
  }
  
  // Fetch fresh data
  console.log('🔄 Fetching fresh Google reviews...');
  const reviews = await fetchGoogleReviews(placeId);
  
  if (reviews.success) {
    cachedReviews = reviews;
    lastFetchTime = now;
  }
  
  return reviews;
}

