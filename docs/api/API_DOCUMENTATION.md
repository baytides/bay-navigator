# Bay Navigator API Documentation

## For Mobile App Development

This document outlines the API endpoints needed for the mobile app to interact with the Bay Navigator platform.

---

## Current Architecture

### Data Source

Currently, program data is stored as **static YAML files** in `_data/programs/`:

- `arts-culture.yml`
- `education.yml`
- `food.yml`
- `health-wellness.yml`
- `housing-utilities.yml`
- `recreation.yml`
- `transportation.yml`
- `other.yml`

Jekyll processes these files and generates static HTML pages.

### For Mobile App

The mobile app needs a **REST API** to fetch this data dynamically. We'll need to create Azure Functions to serve this data.

---

## Recommended API Endpoints

### Base URL

```
Production: https://baynavigator.org/api
Development: http://localhost:7071/api
```

---

## Endpoints

### 1. Get All Programs

**GET** `/programs`

Retrieves all programs across all categories.

**Query Parameters:**

- `search` (string, optional) - Filter by keyword in name or description
- `eligibility` (string[], optional) - Filter by eligibility (comma-separated)
- `category` (string[], optional) - Filter by category (comma-separated)
- `area` (string[], optional) - Filter by area (comma-separated)
- `limit` (number, optional) - Limit results (default: 100)
- `offset` (number, optional) - Pagination offset (default: 0)

**Response:**

```json
{
  "total": 245,
  "count": 100,
  "offset": 0,
  "programs": [
    {
      "id": "sfmta-muni-lifeline",
      "name": "Muni Lifeline Pass",
      "category": "transportation",
      "description": "Discounted monthly transit passes for low-income San Francisco residents.",
      "eligibility": ["low-income"],
      "areas": ["San Francisco"],
      "website": "https://www.sfmta.com/getting-around/muni/fares/lifeline-pass",
      "cost": "$5/month",
      "lastUpdated": "2024-12-15"
    }
  ]
}
```

**Example Request:**

```bash
curl "https://baynavigator.org/api/programs?eligibility=low-income&area=San%20Francisco&limit=20"
```

---

### 2. Get Single Program

**GET** `/programs/{id}`

Retrieves details for a specific program.

**Path Parameters:**

- `id` (string, required) - Program identifier

**Response:**

```json
{
  "id": "sfmta-muni-lifeline",
  "name": "Muni Lifeline Pass",
  "category": "transportation",
  "description": "Discounted monthly transit passes for low-income San Francisco residents.",
  "eligibility": ["low-income"],
  "areas": ["San Francisco"],
  "website": "https://www.sfmta.com/getting-around/muni/fares/lifeline-pass",
  "cost": "$5/month",
  "requirements": [
    "Income at or below 200% of Federal Poverty Level",
    "Valid ID showing San Francisco residency"
  ],
  "howToApply": "Apply online or in person at SFMTA Customer Service Center",
  "lastUpdated": "2024-12-15",
  "relatedPrograms": ["bart-clipper-start", "caltrain-go-pass"]
}
```

**Example Request:**

```bash
curl "https://baynavigator.org/api/programs/sfmta-muni-lifeline"
```

**Error Response:**

```json
{
  "error": "Not Found",
  "message": "Program with id 'invalid-id' does not exist",
  "statusCode": 404
}
```

---

### 3. Get Categories

**GET** `/categories`

Retrieves all program categories.

**Response:**

```json
{
  "categories": [
    {
      "id": "arts-culture",
      "name": "Arts & Culture",
      "programCount": 42,
      "icon": "🎨"
    },
    {
      "id": "transportation",
      "name": "Transportation",
      "programCount": 38,
      "icon": "🚌"
    }
  ]
}
```

---

### 4. Get Eligibility Types

**GET** `/eligibility`

Retrieves all eligibility types.

**Response:**

```json
{
  "eligibility": [
    {
      "id": "low-income",
      "name": "SNAP/EBT/Medi-Cal",
      "description": "For public benefit recipients",
      "programCount": 156,
      "icon": "💳"
    },
    {
      "id": "seniors",
      "name": "Seniors (65+)",
      "description": "For adults age 65 and older",
      "programCount": 89,
      "icon": "👵"
    }
  ]
}
```

---

### 5. Get Areas

**GET** `/areas`

Retrieves all service areas.

**Response:**

```json
{
  "areas": [
    {
      "id": "san-francisco",
      "name": "San Francisco",
      "type": "county",
      "programCount": 124
    },
    {
      "id": "bay-area",
      "name": "Bay Area",
      "type": "region",
      "programCount": 67
    },
    {
      "id": "statewide",
      "name": "Statewide",
      "type": "state",
      "programCount": 43
    }
  ]
}
```

---

### 6. Search Programs

**POST** `/programs/search`

Advanced search with complex filtering.

**Request Body:**

```json
{
  "query": "transit pass",
  "filters": {
    "eligibility": ["low-income", "seniors"],
    "category": ["transportation"],
    "area": ["San Francisco", "Bay Area"],
    "costRange": {
      "min": 0,
      "max": 50
    }
  },
  "sort": {
    "field": "name",
    "order": "asc"
  },
  "pagination": {
    "limit": 20,
    "offset": 0
  }
}
```

**Response:**
Same as GET `/programs` but with search relevance scores:

```json
{
  "total": 12,
  "count": 12,
  "offset": 0,
  "programs": [
    {
      "id": "sfmta-muni-lifeline",
      "name": "Muni Lifeline Pass",
      "relevanceScore": 0.95,
      ...
    }
  ]
}
```

---

### 7. Get User Favorites (Future)

**GET** `/users/{userId}/favorites`

Retrieves saved programs for a user.

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "userId": "user-123",
  "favorites": [
    {
      "programId": "sfmta-muni-lifeline",
      "savedAt": "2024-12-15T10:30:00Z"
    }
  ]
}
```

---

### 8. Add to Favorites (Future)

**POST** `/users/{userId}/favorites`

Saves a program to user's favorites.

**Request Body:**

```json
{
  "programId": "sfmta-muni-lifeline"
}
```

**Response:**

```json
{
  "success": true,
  "programId": "sfmta-muni-lifeline",
  "savedAt": "2024-12-15T10:30:00Z"
}
```

---

### 9. Health Check

**GET** `/health`

Checks API health status.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-12-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "cache": "healthy"
  }
}
```

---

## Data Models

### Program Object

```typescript
interface Program {
  id: string; // Unique identifier (kebab-case)
  name: string; // Program name
  category: CategoryId; // Category identifier
  description: string; // Brief description
  eligibility: EligibilityId[]; // Who can use it
  areas: AreaId[]; // Where it's available
  website: string; // Official website URL
  cost?: string; // Cost information
  requirements?: string[]; // Eligibility requirements
  howToApply?: string; // Application instructions
  phone?: string; // Contact phone
  email?: string; // Contact email
  lastUpdated: string; // ISO 8601 date
  relatedPrograms?: string[]; // Related program IDs
}
```

### Category Object

```typescript
interface Category {
  id: string; // Category identifier
  name: string; // Display name
  programCount: number;
  icon?: string; // Emoji or icon identifier
}
```

### Eligibility Object

```typescript
interface Eligibility {
  id: string; // Eligibility identifier
  name: string; // Display name
  description: string;
  programCount: number;
  icon?: string;
}
```

### Area Object

```typescript
interface Area {
  id: string; // Area identifier
  name: string; // Display name
  type: 'county' | 'region' | 'state' | 'nationwide';
  programCount: number;
}
```

---

## Implementation Plan

### Phase 1: Static JSON API (Quick Start)

Use GitHub Actions to convert YAML to JSON and deploy as static files.

**Advantages:**

- ✅ No server costs
- ✅ Fast implementation (1-2 days)
- ✅ Globally cached via CDN
- ✅ No authentication needed

**Structure:**

```
/api/
  programs.json           # All programs
  categories.json         # All categories
  eligibility.json        # All eligibility types
  areas.json             # All areas
  programs/
    {id}.json            # Individual program files
```

**GitHub Action:**

```yaml
name: Generate API
on:
  push:
    paths:
      - '_data/programs/**'
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Generate JSON API
        run: |
          node scripts/generate-api.js
      - name: Deploy
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: api
          target-folder: api
```

---

### Phase 2: Azure Functions API (Advanced)

Create serverless API with dynamic filtering and search.

**Advantages:**

- ✅ Dynamic filtering
- ✅ Advanced search
- ✅ User authentication support
- ✅ Usage analytics

**Azure Function Structure:**

```
azure-functions/
  GetPrograms/
    index.ts         # GET /api/programs
  GetProgram/
    index.ts         # GET /api/programs/{id}
  GetCategories/
    index.ts         # GET /api/categories
  SearchPrograms/
    index.ts         # POST /api/programs/search
```

**Example Azure Function (TypeScript):**

```typescript
// azure-functions/GetPrograms/index.ts
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import programs from '../data/programs.json';

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const { search, eligibility, category, area, limit = 100, offset = 0 } = req.query;

  let filtered = programs;

  // Filter by search term
  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Filter by eligibility
  if (eligibility) {
    const eligArray = eligibility.split(',');
    filtered = filtered.filter((p) => p.eligibility.some((e) => eligArray.includes(e)));
  }

  // Filter by category
  if (category) {
    const catArray = category.split(',');
    filtered = filtered.filter((p) => catArray.includes(p.category));
  }

  // Filter by area
  if (area) {
    const areaArray = area.split(',');
    filtered = filtered.filter((p) => p.areas.some((a) => areaArray.includes(a)));
  }

  // Pagination
  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  context.res = {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: {
      total,
      count: paginated.length,
      offset,
      programs: paginated,
    },
  };
};

export default httpTrigger;
```

---

## Mobile App Integration

### React Native API Service

```typescript
// mobile-apps/src/services/api.ts
const API_BASE = 'https://baynavigator.org/api';

export interface ProgramFilters {
  search?: string;
  eligibility?: string[];
  category?: string[];
  area?: string[];
  limit?: number;
  offset?: number;
}

export class BayNavigatorAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async getPrograms(filters?: ProgramFilters): Promise<ProgramsResponse> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.eligibility) params.append('eligibility', filters.eligibility.join(','));
    if (filters?.category) params.append('category', filters.category.join(','));
    if (filters?.area) params.append('area', filters.area.join(','));
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await fetch(`${this.baseUrl}/programs?${params}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getProgram(id: string): Promise<Program> {
    const response = await fetch(`${this.baseUrl}/programs/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Program not found');
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getCategories(): Promise<CategoriesResponse> {
    const response = await fetch(`${this.baseUrl}/categories`);
    return response.json();
  }

  async getEligibilityTypes(): Promise<EligibilityResponse> {
    const response = await fetch(`${this.baseUrl}/eligibility`);
    return response.json();
  }

  async getAreas(): Promise<AreasResponse> {
    const response = await fetch(`${this.baseUrl}/areas`);
    return response.json();
  }
}

// Singleton instance
export const api = new BayNavigatorAPI();
```

### Usage in React Native

```typescript
// mobile-apps/src/screens/ProgramsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import { api } from '../services/api';

export function ProgramsScreen() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrograms();
  }, []);

  async function loadPrograms() {
    try {
      const response = await api.getPrograms({
        eligibility: ['low-income'],
        area: ['San Francisco'],
        limit: 50
      });
      setPrograms(response.programs);
    } catch (error) {
      console.error('Failed to load programs:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <FlatList
        data={programs}
        renderItem={({ item }) => (
          <ProgramCard program={item} />
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}
```

---

## Rate Limiting & Caching

### Recommended Limits

- **Anonymous users:** 100 requests/hour
- **Authenticated users:** 500 requests/hour
- **Mobile app:** 1000 requests/hour (with API key)

### Caching Strategy

```typescript
// Client-side caching
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class CachedAPI extends BayNavigatorAPI {
  private cache = new Map();

  async getPrograms(filters?: ProgramFilters) {
    const cacheKey = JSON.stringify(filters);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const data = await super.getPrograms(filters);
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Bad Request",
  "message": "Invalid eligibility filter value",
  "statusCode": 400,
  "details": {
    "field": "eligibility",
    "invalidValue": "invalid-option",
    "validValues": ["low-income", "seniors", "youth", ...]
  }
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid auth token)
- `404` - Not Found (program doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (maintenance)

---

## Security

### CORS Configuration

```json
{
  "cors": {
    "allowedOrigins": [
      "https://baynavigator.org",
      "https://*.azurestaticapps.net",
      "capacitor://localhost",
      "http://localhost:*"
    ],
    "allowedMethods": ["GET", "POST", "OPTIONS"],
    "allowedHeaders": ["Content-Type", "Authorization"],
    "maxAge": 86400
  }
}
```

### API Key Authentication (Optional)

```typescript
// Request header
headers: {
  'X-API-Key': 'your-api-key-here'
}
```

---

## Testing

### Example Test Cases

```typescript
describe('Programs API', () => {
  it('should return all programs', async () => {
    const response = await api.getPrograms();
    expect(response.programs).toHaveLength(245);
  });

  it('should filter by eligibility', async () => {
    const response = await api.getPrograms({
      eligibility: ['low-income'],
    });
    expect(response.programs.every((p) => p.eligibility.includes('low-income'))).toBe(true);
  });

  it('should paginate results', async () => {
    const page1 = await api.getPrograms({ limit: 10, offset: 0 });
    const page2 = await api.getPrograms({ limit: 10, offset: 10 });
    expect(page1.programs[0].id).not.toBe(page2.programs[0].id);
  });
});
```

---

## Next Steps

1. **Choose Implementation:** Static JSON (quick) or Azure Functions (advanced)
2. **Generate TypeScript Types:** Create shared types package
3. **Build API:** Implement chosen approach
4. **Test Thoroughly:** Unit tests + integration tests
5. **Deploy:** Set up CI/CD pipeline
6. **Document:** API changelog and versioning strategy
7. **Monitor:** Set up logging and analytics

---

## AI Chat API - Meet Carl

Bay Navigator includes **Carl**, an AI-powered assistant named after Karl the Fog (spelled with a C for Chat!). Carl helps users find programs and services in the Bay Area. The AI API is self-hosted on Azure VM using Ollama with Llama 3.1 8B.

### Base URL

```
Production: https://ai.baytides.org/api
```

### Authentication

All AI API requests require an API key passed in the `X-API-Key` header.

```bash
curl https://ai.baytides.org/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '...'
```

**To obtain an API key:** Contact the Bay Navigator team.

---

### Chat Completion

**POST** `/chat`

Send a message to the AI assistant and receive a response.

**Request Body:**

```json
{
  "model": "qwen2.5:3b-instruct",
  "messages": [
    {
      "role": "system",
      "content": "You are Bay Navigator Assistant..."
    },
    {
      "role": "user",
      "content": "I need help paying my electric bill"
    }
  ],
  "stream": false,
  "options": {
    "temperature": 0.7,
    "num_predict": 500
  }
}
```

**Parameters:**

| Field                 | Type    | Required | Description                             |
| --------------------- | ------- | -------- | --------------------------------------- |
| `model`               | string  | Yes      | Model to use. Use `qwen2.5:3b-instruct` |
| `messages`            | array   | Yes      | Conversation history                    |
| `stream`              | boolean | No       | Stream response (default: false)        |
| `options.temperature` | number  | No       | Creativity (0-1, default: 0.7)          |
| `options.num_predict` | number  | No       | Max tokens to generate                  |

**Message Roles:**

- `system`: System prompt with context about Bay Navigator
- `user`: User's message
- `assistant`: Previous AI responses (for conversation history)

**Response:**

```json
{
  "model": "qwen2.5:3b-instruct",
  "created_at": "2026-01-19T09:30:00.000Z",
  "message": {
    "role": "assistant",
    "content": "For help with your electric bill, you have several options:\n\n1. **CARE Program** - Get a 20% discount on your PG&E bill if you're income-eligible. Apply at pge.com/care\n\n2. **LIHEAP** - One-time payment assistance for heating/cooling. Contact your county social services.\n\n3. **REACH** - Emergency bill assistance through PG&E for customers facing hardship.\n\nYou can also call 211 for help finding local utility assistance programs."
  },
  "done": true,
  "total_duration": 5000000000,
  "eval_count": 150
}
```

---

### Recommended System Prompt

Include this system prompt for consistent, helpful responses from Carl:

```javascript
const SYSTEM_PROMPT = `You are Carl, a friendly AI assistant for Bay Navigator. You're named after Karl the Fog - that famous fog that rolls over the Golden Gate Bridge. But you spell it with a C because you're the Chat version! You help people in the San Francisco Bay Area find social services, benefits programs, and community resources.

Your Role:
- Help users find relevant programs and services
- Be warm, supportive, and non-judgmental
- Keep responses concise (2-4 sentences)
- Prioritize safety in crisis situations

Key Programs:
- CalFresh (food stamps): Apply at BenefitsCal.com
- Medi-Cal (health insurance): Apply at BenefitsCal.com
- Section 8 (housing vouchers): Contact local housing authority
- CARE Program: 20% PG&E discount for low-income
- CalWORKs: Cash aid for families with children
- 211 Bay Area: Call 211 for help finding any service

Crisis Resources (provide immediately when relevant):
- Emergency: 911
- Suicide/Crisis: 988 (call or text)
- Domestic Violence: 1-800-799-7233
- Homelessness: Call 211
- Crisis Text Line: Text HOME to 741741

Counties: San Francisco, Alameda, Contra Costa, San Mateo, Santa Clara, Marin, Napa, Solano, Sonoma

When in doubt, suggest calling 211 or visiting baynavigator.org for more help.

Fun facts about yourself:
- Your name: You're Carl, named after Karl the Fog (spelled with C for Chat!)
- Karl the Fog is SF's famous fog that rolls over the Golden Gate Bridge
- You were created by the Bay Navigator team
- You run on a privacy-respecting self-hosted AI system`;
```

---

### Flutter Integration

```dart
// lib/services/chat_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ChatService {
  static const String _baseUrl = 'https://ai.baytides.org/api';
  static const String _apiKey = String.fromEnvironment('OLLAMA_API_KEY');

  final List<Map<String, String>> _conversationHistory = [];

  static const String _systemPrompt = '''
You are Carl, a friendly AI assistant for Bay Navigator...
''';

  Future<String> sendMessage(String message) async {
    // Add user message to history
    _conversationHistory.add({'role': 'user', 'content': message});

    // Build messages array
    final messages = [
      {'role': 'system', 'content': _systemPrompt},
      ..._conversationHistory.take(6), // Keep last 6 messages
    ];

    final response = await http.post(
      Uri.parse('$_baseUrl/chat'),
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': _apiKey,
      },
      body: jsonEncode({
        'model': 'qwen2.5:3b-instruct',
        'messages': messages,
        'stream': false,
        'options': {
          'temperature': 0.7,
          'num_predict': 500,
        },
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to get response: ${response.statusCode}');
    }

    final data = jsonDecode(response.body);
    final assistantMessage = data['message']['content'] as String;

    // Add assistant response to history
    _conversationHistory.add({'role': 'assistant', 'content': assistantMessage});

    return assistantMessage;
  }

  void clearHistory() {
    _conversationHistory.clear();
  }
}
```

---

### Swift Integration

```swift
// ChatService.swift
import Foundation

class ChatService: ObservableObject {
    private let baseURL = "https://ai.baytides.org/api"
    private let apiKey: String

    @Published var conversationHistory: [[String: String]] = []

    private let systemPrompt = """
    You are Carl, a friendly AI assistant for Bay Navigator...
    """

    init() {
        self.apiKey = Bundle.main.infoDictionary?["OLLAMA_API_KEY"] as? String ?? ""
    }

    func sendMessage(_ message: String) async throws -> String {
        // Add user message to history
        conversationHistory.append(["role": "user", "content": message])

        // Build messages array
        var messages: [[String: String]] = [
            ["role": "system", "content": systemPrompt]
        ]
        messages.append(contentsOf: conversationHistory.suffix(6))

        let requestBody: [String: Any] = [
            "model": "qwen2.5:3b-instruct",
            "messages": messages,
            "stream": false,
            "options": [
                "temperature": 0.7,
                "num_predict": 500
            ]
        ]

        var request = URLRequest(url: URL(string: "\(baseURL)/chat")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "X-API-Key")
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw ChatError.requestFailed
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let messageObj = json?["message"] as? [String: Any]
        let content = messageObj?["content"] as? String ?? ""

        // Add assistant response to history
        conversationHistory.append(["role": "assistant", "content": content])

        return content
    }

    func clearHistory() {
        conversationHistory.removeAll()
    }
}

enum ChatError: Error {
    case requestFailed
}
```

---

### Rate Limiting

The AI API has the following rate limits:

| Tier       | Requests per minute | Requests per day |
| ---------- | ------------------- | ---------------- |
| Standard   | 10                  | 500              |
| Mobile App | 30                  | 2000             |

If you exceed rate limits, you'll receive a `429 Too Many Requests` response.

---

### Error Responses

```json
{
  "error": "Invalid or missing API key. Include X-API-Key header."
}
```

| Status Code | Description                |
| ----------- | -------------------------- |
| 200         | Success                    |
| 401         | Missing or invalid API key |
| 429         | Rate limit exceeded        |
| 500         | Server error               |
| 503         | Model unavailable          |

---

### Best Practices

1. **Include conversation history** - Send the last 4-6 messages for context
2. **Handle errors gracefully** - Show a friendly message if the API fails
3. **Implement crisis detection** - Check for crisis keywords and show crisis resources immediately
4. **Cache responses** - Don't call the API for identical questions
5. **Set reasonable timeouts** - AI responses can take 5-15 seconds

---

**Last Updated:** 2026-01-19
**Version:** 1.1.0
**Maintained By:** Bay Navigator Development Team
