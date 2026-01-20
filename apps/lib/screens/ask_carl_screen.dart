import 'package:flutter/foundation.dart' show kIsWeb, kDebugMode;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/theme.dart';
import '../models/program.dart';
import '../providers/user_prefs_provider.dart';
import '../services/api_service.dart';
import '../services/platform_service.dart';
import '../utils/category_icons.dart';
import 'program_detail_screen.dart';
import 'webview_screen.dart';

/// Chat message model
class ChatMessage {
  final String id;
  final String content;
  final bool isUser;
  final DateTime timestamp;
  final List<Program>? programs;
  final QuickAnswer? quickAnswer;
  final bool isLoading;
  final bool isError;

  ChatMessage({
    required this.id,
    required this.content,
    required this.isUser,
    required this.timestamp,
    this.programs,
    this.quickAnswer,
    this.isLoading = false,
    this.isError = false,
  });

  ChatMessage copyWith({
    String? content,
    List<Program>? programs,
    QuickAnswer? quickAnswer,
    bool? isLoading,
    bool? isError,
  }) {
    return ChatMessage(
      id: id,
      content: content ?? this.content,
      isUser: isUser,
      timestamp: timestamp,
      programs: programs ?? this.programs,
      quickAnswer: quickAnswer ?? this.quickAnswer,
      isLoading: isLoading ?? this.isLoading,
      isError: isError ?? this.isError,
    );
  }
}

/// Ask Carl - AI-powered chat assistant screen
class AskCarlScreen extends StatefulWidget {
  const AskCarlScreen({super.key});

  @override
  State<AskCarlScreen> createState() => _AskCarlScreenState();
}

class _AskCarlScreenState extends State<AskCarlScreen> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  final ScrollController _scrollController = ScrollController();
  final ApiService _apiService = ApiService();

  final List<ChatMessage> _messages = [];
  bool _isTyping = false;

  // Quick prompt suggestions
  static const List<Map<String, String>> _quickPrompts = [
    {'icon': '🍽️', 'label': 'Food help', 'query': 'I need help with food'},
    {'icon': '💡', 'label': 'Utility help', 'query': 'I need help paying my utility bills'},
    {'icon': '🏥', 'label': 'Healthcare', 'query': 'I need healthcare assistance'},
    {'icon': '🏠', 'label': 'Housing', 'query': 'I need housing assistance'},
    {'icon': '👴', 'label': 'Seniors', 'query': 'Programs for seniors'},
    {'icon': '🎖️', 'label': 'Veterans', 'query': 'Programs for veterans'},
  ];

  @override
  void initState() {
    super.initState();
    _addWelcomeMessage();
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _addWelcomeMessage() {
    _messages.add(ChatMessage(
      id: 'welcome',
      content: "Hi! I'm Carl, your Bay Area benefits guide. I can help you find free and low-cost programs for food, healthcare, housing, utilities, and more.\n\nTry asking me something like \"I need help with food\" or tap one of the quick prompts below.",
      isUser: false,
      timestamp: DateTime.now(),
    ));
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    final userMessage = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      content: text.trim(),
      isUser: true,
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.add(userMessage);
      _isTyping = true;
    });

    _controller.clear();
    _scrollToBottom();

    // Check for crisis keywords first
    final crisisType = _apiService.detectCrisis(text);
    if (crisisType != null) {
      _handleCrisis(crisisType);
      return;
    }

    // Add loading message
    final loadingId = '${DateTime.now().millisecondsSinceEpoch}_loading';
    setState(() {
      _messages.add(ChatMessage(
        id: loadingId,
        content: 'Thinking...',
        isUser: false,
        timestamp: DateTime.now(),
        isLoading: true,
      ));
    });
    _scrollToBottom();

    try {
      // Get user preferences for context
      final userPrefs = context.read<UserPrefsProvider>();
      final county = userPrefs.selectedCounty;

      final result = await _apiService.performAISearch(
        query: text,
        county: county,
      );

      // Remove loading message and add response
      setState(() {
        _messages.removeWhere((m) => m.id == loadingId);
        _messages.add(ChatMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          content: result.message.isNotEmpty
              ? result.message
              : (result.programs.isNotEmpty
                  ? "Here are some programs that might help:"
                  : "I couldn't find specific programs for that. Try being more specific or browse the directory."),
          isUser: false,
          timestamp: DateTime.now(),
          programs: result.programs.isNotEmpty ? result.programs.take(5).toList() : null,
          quickAnswer: result.quickAnswer,
        ));
        _isTyping = false;
      });
      _scrollToBottom();
    } catch (e) {
      // Remove loading message and add error
      String errorMessage = "Sorry, I'm having trouble connecting right now. Please try again or browse the directory directly.";

      // In debug mode, provide more info
      if (kDebugMode) {
        errorMessage += "\n\nDebug: ${e.toString()}";
      }

      setState(() {
        _messages.removeWhere((m) => m.id == loadingId);
        _messages.add(ChatMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          content: errorMessage,
          isUser: false,
          timestamp: DateTime.now(),
          isError: true,
        ));
        _isTyping = false;
      });
      _scrollToBottom();
    }
  }

  void _handleCrisis(CrisisType type) {
    String content;
    QuickAnswer quickAnswer;

    if (type == CrisisType.emergency) {
      content = "If you're in immediate danger, please call 911.";
      quickAnswer = QuickAnswer(
        type: 'crisis',
        title: 'Emergency Help',
        message: 'If you are in immediate danger, please call emergency services.',
        resource: QuickAnswerResource(
          name: 'Emergency Services',
          phone: '911',
          description: 'Call 911 for immediate emergencies',
          action: 'call',
        ),
      );
    } else {
      content = "If you're having thoughts of suicide or self-harm, please reach out for help.";
      quickAnswer = QuickAnswer(
        type: 'crisis',
        title: 'Crisis Support',
        message: 'You are not alone. Help is available 24/7.',
        resource: QuickAnswerResource(
          name: '988 Suicide & Crisis Lifeline',
          phone: '988',
          description: 'Free, confidential support 24/7',
          action: 'call',
        ),
        secondary: QuickAnswerResource(
          name: 'Crisis Text Line',
          phone: '741741',
          description: 'Text HOME to 741741',
          action: 'text',
        ),
      );
    }

    setState(() {
      _messages.add(ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        content: content,
        isUser: false,
        timestamp: DateTime.now(),
        quickAnswer: quickAnswer,
      ));
      _isTyping = false;
    });
    _scrollToBottom();
  }

  Future<void> _launchPhone(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _launchSms(String phone, String message) async {
    final uri = Uri.parse('sms:$phone?body=$message');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  /// Open a guide URL in the in-app WebView
  void _openGuideInApp(String url, String title) {
    // Check if it's a baynavigator URL - open in WebView
    if (url.contains('baynavigator.org')) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => WebViewScreen(
            title: title,
            url: url,
          ),
        ),
      );
    } else {
      // External URLs open in browser
      _launchUrl(url);
    }
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isDesktop = !kIsWeb && PlatformService.isDesktop;
    final screenWidth = MediaQuery.of(context).size.width;
    final useDesktopLayout = isDesktop && screenWidth >= 800;

    return Scaffold(
      body: SafeArea(
        top: !useDesktopLayout,
        child: Column(
          children: [
            // Header (mobile only)
            if (!useDesktopLayout)
              Container(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Icon(
                        Icons.chat_bubble,
                        color: AppColors.primary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Ask Carl',
                            style: theme.textTheme.titleLarge,
                          ),
                          Text(
                            'Your Bay Area benefits guide',
                            style: theme.textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh),
                      onPressed: () {
                        setState(() {
                          _messages.clear();
                          _addWelcomeMessage();
                        });
                        _apiService.clearConversationHistory();
                      },
                      tooltip: 'Start new conversation',
                    ),
                  ],
                ),
              ),

            // Messages list
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                itemCount: _messages.length + (_messages.isEmpty ? 0 : 1), // +1 for quick prompts at end
                itemBuilder: (context, index) {
                  // Show quick prompts after welcome message or at the end
                  if (index == _messages.length && _messages.isNotEmpty) {
                    if (_messages.length == 1 || !_isTyping) {
                      return _buildQuickPrompts(isDark);
                    }
                    return const SizedBox.shrink();
                  }

                  final message = _messages[index];
                  return _buildMessage(message, isDark);
                },
              ),
            ),

            // Input area
            _buildInputArea(isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildMessage(ChatMessage message, bool isDark) {
    if (message.isLoading) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : AppColors.lightCard,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    message.content,
                    style: TextStyle(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: message.isUser
            ? CrossAxisAlignment.end
            : CrossAxisAlignment.start,
        children: [
          // Message bubble
          Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.8,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: message.isUser
                  ? AppColors.primary
                  : (message.isError
                      ? AppColors.danger.withValues(alpha: 0.1)
                      : (isDark ? AppColors.darkCard : AppColors.lightCard)),
              borderRadius: BorderRadius.circular(16).copyWith(
                bottomRight: message.isUser ? const Radius.circular(4) : null,
                bottomLeft: !message.isUser ? const Radius.circular(4) : null,
              ),
              border: message.isError
                  ? Border.all(color: AppColors.danger.withValues(alpha: 0.3))
                  : null,
            ),
            child: Text(
              message.content,
              style: TextStyle(
                color: message.isUser
                    ? Colors.white
                    : (message.isError
                        ? AppColors.danger
                        : (isDark ? AppColors.darkText : AppColors.lightText)),
              ),
            ),
          ),

          // Crisis quick answer
          if (message.quickAnswer != null && message.quickAnswer!.isCrisis)
            _buildCrisisCard(message.quickAnswer!, isDark),

          // Guide/Eligibility quick answer (non-crisis)
          if (message.quickAnswer != null &&
              !message.quickAnswer!.isCrisis &&
              (message.quickAnswer!.guideUrl != null ||
               message.quickAnswer!.applyUrl != null))
            _buildGuideCard(message.quickAnswer!, isDark),

          // Program results
          if (message.programs != null && message.programs!.isNotEmpty)
            _buildProgramResults(message.programs!, isDark),
        ],
      ),
    );
  }

  Widget _buildCrisisCard(QuickAnswer quickAnswer, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.danger.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (quickAnswer.resource != null) ...[
            FilledButton.icon(
              onPressed: () => _launchPhone(quickAnswer.resource!.phone!),
              icon: const Icon(Icons.phone),
              label: Text('Call ${quickAnswer.resource!.name}'),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.danger,
                minimumSize: const Size(double.infinity, 48),
              ),
            ),
            if (quickAnswer.resource!.description != null) ...[
              const SizedBox(height: 8),
              Text(
                quickAnswer.resource!.description!,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
            ],
          ],
          if (quickAnswer.secondary != null) ...[
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => _launchSms(quickAnswer.secondary!.phone!, 'HOME'),
              icon: const Icon(Icons.message),
              label: Text(quickAnswer.secondary!.description ?? 'Text for help'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 44),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildGuideCard(QuickAnswer quickAnswer, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark
            ? AppColors.primary.withValues(alpha: 0.1)
            : AppColors.primary.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (quickAnswer.title != null) ...[
            Row(
              children: [
                Icon(
                  Icons.menu_book_outlined,
                  color: AppColors.primary,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    quickAnswer.title!,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                      color: isDark ? AppColors.darkText : AppColors.lightText,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],
          if (quickAnswer.summary != null) ...[
            Text(
              quickAnswer.summary!,
              style: TextStyle(
                fontSize: 14,
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
            const SizedBox(height: 12),
          ],
          // Guide URL button
          if (quickAnswer.guideUrl != null)
            FilledButton.icon(
              onPressed: () => _openGuideInApp(
                quickAnswer.guideUrl!,
                quickAnswer.guideText ?? 'Eligibility Guide',
              ),
              icon: const Icon(Icons.article_outlined, size: 18),
              label: Text(quickAnswer.guideText ?? 'View Eligibility Guide'),
              style: FilledButton.styleFrom(
                minimumSize: const Size(double.infinity, 44),
              ),
            ),
          // Apply URL button
          if (quickAnswer.applyUrl != null) ...[
            if (quickAnswer.guideUrl != null) const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => _openGuideInApp(
                quickAnswer.applyUrl!,
                quickAnswer.applyText ?? 'Apply Now',
              ),
              icon: const Icon(Icons.launch_outlined, size: 18),
              label: Text(quickAnswer.applyText ?? 'Apply Now'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 44),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildProgramResults(List<Program> programs, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: programs.map((program) {
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            child: Material(
              color: isDark ? AppColors.darkCard : AppColors.lightCard,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => ProgramDetailScreen(program: program),
                    ),
                  );
                },
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          _getCategoryIcon(program.category),
                          color: AppColors.primary,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              program.name,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              CategoryIcons.formatName(program.category),
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        Icons.chevron_right,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildQuickPrompts(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: _quickPrompts.map((prompt) {
          return ActionChip(
            avatar: Text(prompt['icon']!, style: const TextStyle(fontSize: 16)),
            label: Text(prompt['label']!),
            onPressed: () => _sendMessage(prompt['query']!),
            backgroundColor: isDark
                ? AppColors.primary.withValues(alpha: 0.1)
                : AppColors.primary.withValues(alpha: 0.05),
            side: BorderSide(
              color: AppColors.primary.withValues(alpha: 0.2),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildInputArea(bool isDark) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        border: Border(
          top: BorderSide(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              focusNode: _focusNode,
              decoration: InputDecoration(
                hintText: 'Ask Carl anything...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: isDark ? AppColors.darkCard : AppColors.lightCard,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
              ),
              textInputAction: TextInputAction.send,
              onSubmitted: _sendMessage,
              maxLines: null,
            ),
          ),
          const SizedBox(width: 8),
          IconButton.filled(
            onPressed: _isTyping ? null : () => _sendMessage(_controller.text),
            icon: const Icon(Icons.send),
            style: IconButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.5),
            ),
          ),
        ],
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'food':
        return Icons.restaurant;
      case 'health':
      case 'healthcare':
        return Icons.local_hospital;
      case 'housing':
        return Icons.home;
      case 'utilities':
        return Icons.bolt;
      case 'transportation':
        return Icons.directions_bus;
      case 'education':
        return Icons.school;
      case 'employment':
        return Icons.work;
      case 'legal':
        return Icons.gavel;
      case 'community':
        return Icons.people;
      case 'recreation':
        return Icons.sports_soccer;
      default:
        return Icons.category;
    }
  }
}
