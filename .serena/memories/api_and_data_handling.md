# API and Data Handling

## Current API Usage
The project fetches astronaut data from the Open Notify API:
- **Endpoint**: http://api.open-notify.org/astros.json
- **Method**: GET
- **Response Format**: JSON

### Response Structure:
```typescript
{
  people: Array<{
    name: string;
    craft: string;
  }>;
  number: number;
  message: string;
}
```

## Data Fetching Pattern
Currently using the Fetch API with useEffect hook:

```typescript
useEffect(() => {
  fetch('http://api.open-notify.org/astros.json')
    .then(response => response.json())
    .then(data => setAstronauts(data.people))
    .catch(error => console.error('Error fetching astronaut data:', error));
}, []);
```

## Type Definitions
```typescript
interface AstronautData {
  name: string;
  craft: string;
}
```

## Error Handling
- Basic error catching with console.error
- No user-facing error states currently implemented

## Potential Improvements
- Add loading states
- Add error UI states
- Consider moving API calls to a service layer
- Add retry logic for failed requests
- Consider caching strategies