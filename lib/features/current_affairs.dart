import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:longinset/services/archive_service.dart';
import 'package:longinset/main.dart'; // import for AppTheme if needed, or redefine

class CurrentAffairsPage extends StatefulWidget {
  const CurrentAffairsPage({super.key});

  @override
  State<CurrentAffairsPage> createState() => _CurrentAffairsPageState();
}

class _CurrentAffairsPageState extends State<CurrentAffairsPage> {
  late Future<List<Map<String, String>>> _dataFuture;

  @override
  void initState() {
    super.initState();
    _dataFuture = ArchiveAIService.getCurrentAffairs();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('ON THIS DAY', style: GoogleFonts.cinzel(fontWeight: FontWeight.bold, color: const Color(0xFFB8860B))),
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Color(0xFFB8860B)),
      ),
      body: Stack(
        children: [
           Positioned.fill(
            child: Image.asset(
              'assets/vault_bg.png',
              fit: BoxFit.cover,
              color: Colors.black.withValues(alpha:0.8),
              colorBlendMode: BlendMode.darken,
            ),
          ),
          FutureBuilder<List<Map<String, String>>>(
            future: _dataFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const CircularProgressIndicator(color: Color(0xFFB8860B)),
                      const SizedBox(height: 16),
                      Text("Scanning Temporal Lines...", style: GoogleFonts.cinzel(color: Colors.white70)),
                    ],
                  ),
                );
              }

              if (snapshot.hasError || !snapshot.hasData || snapshot.data!.isEmpty) {
                return Center(
                  child: Text("Unable to retrieve timeline data.", style: TextStyle(color: Colors.white54)),
                );
              }

              final events = snapshot.data!;
              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: events.length,
                itemBuilder: (context, index) {
                  final event = events[index];
                  return Card(
                    color: const Color(0xFF1B1B2F).withValues(alpha:0.8),
                    margin: const EdgeInsets.only(bottom: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: const Color(0xFFB8860B).withValues(alpha:0.3)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                event['year']!,
                                style: GoogleFonts.outfit(
                                  fontSize: 24, 
                                  fontWeight: FontWeight.bold, 
                                  color: const Color(0xFFB8860B)
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Container(height: 1, color: Colors.white10),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            event['title']!,
                            style: GoogleFonts.cinzel(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            event['description']!,
                            style: const TextStyle(color: Colors.white70),
                          ),
                        ],
                      ),
                    ),
                  ).animate().fadeIn(delay: (index * 100).ms).slideX();
                },
              );
            },
          ),
        ],
      ),
    );
  }
}
