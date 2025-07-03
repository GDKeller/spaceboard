import { SpaceApiService } from './api/space-api';

// Create a singleton instance of the Space API service
export const spaceApi = new SpaceApiService();

// Export types and classes for direct use if needed
export { SpaceApiService } from './api/space-api';
export { OpenNotifyClient } from './api/open-notify';
export { SpaceDevsClient } from './api/spacedevs';
export { BaseApiClient } from './api/base';