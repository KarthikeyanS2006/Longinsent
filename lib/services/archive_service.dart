import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

  static final List<String> _apiKeys = [
    'INSERT_YOUR_GROQ_API_KEY_HERE',
  ];

  static int _currentIndex = 0;
  static const String _endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  static String _getApiKey() {
    final key = _apiKeys[_currentIndex];
    _currentIndex = (_currentIndex + 1) % _apiKeys.length;
    return key;
  }

  static Future<Map<String, String>> getDeepDive(String title, String? description) async {
    final prompt = '''
      You are a world-class historian for the KEYAN GROUPS RESEARCH ARCHIVE.
      Provide a deep dive into: "$title".
      Context: ${description ?? 'No context provided'}.

      STRICT OUTPUT FORMAT (JSON ONLY):
      {
        "title": "A compelling title",
        "intro": "A strong, engaging opening paragraph summarizing the event (approx 60-80 words).",
        "content": "The rest of the detailed historical analysis, including timelines (YEAR: Event), global significance, and 3 archival secrets. Use markdown formatting."
      }
    ''';

    try {
      final response = await _makeRequest(prompt);
      final jsonStr = _extractJson(response);
      final data = jsonDecode(jsonStr);
      return {
        'title': data['title']?.toString() ?? title,
        'intro': data['intro']?.toString() ?? '',
        'content': data['content']?.toString() ?? '',
      };
    } catch (e) {
      debugPrint('DeepDive Error: $e');
      return {
        'title': title,
        'intro': '<strong>ACCESS ERROR</strong>: The archival node could not reconstruct the initial data fragment.',
        'content': 'System reported: $e. \n\nPlease try re-initializing the protocol.',
      };
    }
  }

  static Future<List<Map<String, String>>> getCurrentAffairs() async {
    final date = DateTime.now();
    final dateStr = "${date.month}-${date.day}"; // e.g., 10-25
    
    final prompt = '''
      Identify 5 MAJOR historical events that happened on this day ($dateStr) in history.
      Focus on events with global impact or scientific significance.

      STRICT OUTPUT FORMAT (JSON ARRAY ONLY):
      [
        {
          "year": "YYYY",
          "title": "Event Title",
          "description": "2 sentence summary."
        }
      ]
    ''';

    try {
      final response = await _makeRequest(prompt);
      final jsonStr = _extractJson(response);
      final List<dynamic> list = jsonDecode(jsonStr);
      
      return list.map((e) => {
        'year': e['year']?.toString() ?? '????',
        'title': e['title']?.toString() ?? 'Unknown Event',
        'description': e['description']?.toString() ?? '',
      }).toList();
    } catch (e) {
      debugPrint('CurrentAffairs Error: $e');
      return [];
    }
  }

  static Future<Map<String, String>> discoverIncident(String query) async {
    final prompt = '''
      User Query: "$query"
      If valid history, return JSON:
      {
        "title": "Clear Title",
        "description": "Brief summary",
        "date": "YYYY-MM-DD"
      }
    ''';

    try {
      final response = await _makeRequest(prompt, temperature: 0.3);
      final jsonStr = _extractJson(response);
      final data = jsonDecode(jsonStr);
      
      final safeTitle = Uri.encodeComponent(data['title'] ?? query);
      // High-res placeholder or attempt to search if we had an image API. 
      // For now, using loremflickr with keywords.
      final imageUrl = 'https://loremflickr.com/800/600/history,$safeTitle';

      return {
        'title': data['title']?.toString() ?? 'Unknown',
        'description': data['description']?.toString() ?? '',
        'date': data['date']?.toString() ?? DateTime.now().toString().split(' ')[0],
        'image_url': imageUrl,
      };
    } catch (e) {
      return {};
    }
  }

  static Future<String> _makeRequest(String prompt, {double temperature = 0.5}) async {
    final apiKey = _getApiKey();
    debugPrint('Using Key: ...${apiKey.substring(apiKey.length - 6)}');
    
    final response = await http.post(
      Uri.parse(_endpoint),
      headers: {
        'Authorization': 'Bearer $apiKey',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'model': 'llama-3.3-70b-versatile',
        'messages': [
          {'role': 'system', 'content': 'You are a JSON-only historical database. Output RAW JSON. No markdown fences.'},
          {'role': 'user', 'content': prompt},
        ],
        'temperature': temperature,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['choices'][0]['message']['content'];
    } else {
      throw Exception('Groq API Error: ${response.statusCode} - ${response.body}');
    }
  }

  static String _extractJson(String content) {
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replaceAll('```json', '').replaceAll('```', '');
    } else if (content.startsWith('```')) {
      content = content.replaceAll('```', '');
    }
    return content.trim();
  }
}
