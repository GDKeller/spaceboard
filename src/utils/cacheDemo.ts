import { astronautCache } from '../services/cache/browserCache';

// Demo function to show cache status in console
export async function showCacheStatus() {
  console.log('=== SpaceBoard Cache Status ===');
  
  const stats = await astronautCache.getStats();
  
  console.log(`Total entries: ${stats.totalEntries}`);
  console.log(`Total size: ${Math.round(stats.totalSize / 1024)}KB`);
  
  if (stats.entries.length > 0) {
    console.log('\nCached data:');
    stats.entries.forEach(entry => {
      const ageMinutes = Math.round(entry.age / 1000 / 60);
      const status = entry.expired ? '❌ EXPIRED' : '✅ VALID';
      console.log(`- ${entry.key}: ${Math.round(entry.size / 1024)}KB, ${ageMinutes} minutes old ${status}`);
    });
  } else {
    console.log('\nNo cached data found');
  }
  
  console.log('\nTo clear cache, run: astronautCache.clear()');
  console.log('To force refresh, click the refresh button in the app');
}

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).cacheStatus = showCacheStatus;
  (window as any).astronautCache = astronautCache;
  
  console.log('💾 Cache utilities loaded! Try:');
  console.log('  cacheStatus() - Show cache status');
  console.log('  astronautCache.clear() - Clear all cache');
}