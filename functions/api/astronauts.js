export async function onRequest(context) {
  const { env } = context;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch current astronauts in space
    const [openNotifyRes, spaceLaunchRes] = await Promise.all([
      fetch('http://api.open-notify.org/astros.json'),
      fetch('https://ll.thespacedevs.com/2.2.0/astronaut/?limit=50&offset=0&status=1&ordering=name')
    ]);

    if (!openNotifyRes.ok || !spaceLaunchRes.ok) {
      throw new Error('Failed to fetch astronaut data');
    }

    const openNotifyData = await openNotifyRes.json();
    const spaceLaunchData = await spaceLaunchRes.json();

    // Merge data
    const enrichedData = openNotifyData.people.map(astronaut => {
      const spaceDevAstronaut = spaceLaunchData.results.find(
        a => a.name.includes(astronaut.name) || astronaut.name.includes(a.name.split(' ').pop())
      );

      return {
        ...astronaut,
        id: spaceDevAstronaut?.id || Math.random().toString(36).substr(2, 9),
        profile_image: spaceDevAstronaut?.profile_image || null,
        profile_image_thumbnail: spaceDevAstronaut?.profile_image_thumbnail || null,
        agency: spaceDevAstronaut?.agency?.name || 'Unknown',
        nationality: spaceDevAstronaut?.nationality || 'Unknown',
        date_of_birth: spaceDevAstronaut?.date_of_birth || null,
        bio: spaceDevAstronaut?.bio || null,
        flights_count: spaceDevAstronaut?.flights_count || 0,
        spacewalks_count: spaceDevAstronaut?.spacewalks_count || 0,
        last_flight: spaceDevAstronaut?.last_flight || null,
      };
    });

    return new Response(JSON.stringify({
      data: enrichedData,
      timestamp: new Date().toISOString(),
      source: 'cloudflare-functions'
    }), {
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch astronaut data',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}