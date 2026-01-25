import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../models/program.dart';
import '../config/theme.dart';
import '../utils/category_icons.dart';
import '../providers/settings_provider.dart';

/// Floating AI assistant button and chat panel
class SmartAssistant extends StatefulWidget {
  final Function(Program)? onProgramTap;
  final Function(Program)? onFavoriteToggle;
  final bool Function(String)? isFavorite;

  const SmartAssistant({
    super.key,
    this.onProgramTap,
    this.onFavoriteToggle,
    this.isFavorite,
  });

  @override
  State<SmartAssistant> createState() => _SmartAssistantState();
}

class _SmartAssistantState extends State<SmartAssistant>
    with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _inputFocusNode = FocusNode();

  bool _isOpen = false;
  bool _isLoading = false;
  bool _showNotificationDot = true;
  final List<_ChatMessage> _messages = [];

  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutBack,
    );

    // Add welcome message
    _messages.add(_ChatMessage(
      role: 'assistant',
      content:
          "Hi! I'm here to help you find programs and services in the Bay Area. You can ask me things like:\n\n• \"I need help paying my electric bill\"\n• \"What food assistance is available for seniors?\"\n• \"I'm a veteran looking for housing help\"\n\nWhat can I help you find today?",
    ));
  }

  @override
  void dispose() {
    _animationController.dispose();
    _inputController.dispose();
    _scrollController.dispose();
    _inputFocusNode.dispose();
    super.dispose();
  }

  void _togglePanel() {
    HapticFeedback.lightImpact();
    setState(() {
      _isOpen = !_isOpen;
      _showNotificationDot = false;
    });

    if (_isOpen) {
      _animationController.forward();
      Future.delayed(const Duration(milliseconds: 100), () {
        _inputFocusNode.requestFocus();
      });
    } else {
      _animationController.reverse();
    }
  }

  void _clearChat() {
    HapticFeedback.mediumImpact();
    setState(() {
      _messages.clear();
      // Re-add welcome message
      _messages.add(_ChatMessage(
        role: 'assistant',
        content:
            "Hi! I'm here to help you find programs and services in the Bay Area. You can ask me things like:\n\n• \"I need help paying my electric bill\"\n• \"What food assistance is available for seniors?\"\n• \"I'm a veteran looking for housing help\"\n\nWhat can I help you find today?",
      ));
    });
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage([String? overrideMessage]) async {
    final message = overrideMessage ?? _inputController.text.trim();
    if (message.isEmpty || _isLoading) return;

    _inputController.clear();

    // Check for crisis keywords
    final crisisType = _apiService.detectCrisis(message);
    if (crisisType != null) {
      _showCrisisDialog(crisisType);
    }

    setState(() {
      _messages.add(_ChatMessage(role: 'user', content: message));
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final result = await _apiService.performAISearch(query: message);

      setState(() {
        _messages.add(_ChatMessage(
          role: 'assistant',
          content: result.message,
          programs: result.programs,
        ));
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _messages.add(_ChatMessage(
          role: 'assistant',
          content:
              "I'm sorry, I'm having trouble connecting right now. Please try searching the programs directly or try again later.",
          isError: true,
        ));
        _isLoading = false;
      });
    }
    _scrollToBottom();
  }

  void _showCrisisDialog(CrisisType type) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: type == CrisisType.emergency
            ? Colors.red.shade50
            : Colors.blue.shade50,
        title: Row(
          children: [
            Icon(
              type == CrisisType.emergency
                  ? Icons.emergency
                  : Icons.support_agent,
              color:
                  type == CrisisType.emergency ? Colors.red : Colors.blue,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                type == CrisisType.emergency
                    ? 'Emergency Resources'
                    : 'Crisis Support Available',
                style: TextStyle(
                  color: type == CrisisType.emergency
                      ? Colors.red.shade900
                      : Colors.blue.shade900,
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              type == CrisisType.emergency
                  ? 'If you or someone else is in immediate danger, please call 911.'
                  : 'If you\'re experiencing a mental health crisis, help is available 24/7.',
              style: TextStyle(
                color: isDark ? Colors.grey.shade800 : Colors.grey.shade900,
              ),
            ),
            const SizedBox(height: 16),
            if (type == CrisisType.mentalHealth) ...[
              _buildCrisisButton(
                icon: Icons.phone,
                label: '988 Suicide & Crisis Lifeline',
                subtitle: 'Call or text 988',
                onTap: () {
                  // In a real app, launch phone dialer
                  Navigator.pop(context);
                },
              ),
              const SizedBox(height: 8),
              _buildCrisisButton(
                icon: Icons.chat,
                label: 'Crisis Text Line',
                subtitle: 'Text HOME to 741741',
                onTap: () => Navigator.pop(context),
              ),
            ] else ...[
              _buildCrisisButton(
                icon: Icons.emergency,
                label: 'Emergency Services',
                subtitle: 'Call 911',
                onTap: () => Navigator.pop(context),
                isEmergency: true,
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Continue searching'),
          ),
        ],
      ),
    );
  }

  Widget _buildCrisisButton({
    required IconData icon,
    required String label,
    required String subtitle,
    required VoidCallback onTap,
    bool isEmergency = false,
  }) {
    final Color primaryColor = isEmergency ? Colors.red.shade600 : Colors.blue.shade600;
    final Color backgroundColor = isEmergency ? Colors.red.shade50 : Colors.blue.shade50;

    return Container(
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: primaryColor.withValues(alpha: 0.3), width: 1.5),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: primaryColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: primaryColor, size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                          color: Colors.grey.shade900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: primaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward_ios, color: primaryColor, size: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Consumer<SettingsProvider>(
      builder: (context, settings, child) {
        final aiEnabled = settings.aiSearchEnabled;

        return Stack(
          children: [
            // Floating action button
            Positioned(
              bottom: bottomPadding + 80,
              right: 16,
              child: Stack(
                children: [
                  FloatingActionButton(
                    heroTag: 'smart_assistant',
                    onPressed: aiEnabled ? _togglePanel : () => _showOfflineMessage(context),
                    backgroundColor: aiEnabled ? AppColors.primary : Colors.grey,
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: _isOpen
                          ? const Icon(Icons.close, key: ValueKey('close'))
                          : Icon(
                              // Cloud icon for Karl the Fog / cloud computing
                              aiEnabled ? Icons.cloud : Icons.cloud_off,
                              key: ValueKey(aiEnabled ? 'cloud' : 'offline'),
                            ),
                    ),
                  ),
                  if (_showNotificationDot && aiEnabled)
                    Positioned(
                      top: 0,
                      right: 0,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                  // Offline indicator
                  if (!aiEnabled)
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 14,
                        height: 14,
                        decoration: BoxDecoration(
                          color: Colors.orange,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(Icons.wifi_off, size: 8, color: Colors.white),
                      ),
                    ),
                ],
              ),
            ),

        // Chat panel
        if (_isOpen)
          Positioned(
            bottom: bottomPadding + 150,
            right: 16,
            child: ScaleTransition(
              scale: _scaleAnimation,
              alignment: Alignment.bottomRight,
              child: Material(
                elevation: 8,
                borderRadius: BorderRadius.circular(16),
                color: isDark ? AppColors.darkCard : Colors.white,
                child: Container(
                  width: 340,
                  height: 480,
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(context).size.height - 200,
                  ),
                  child: Column(
                    children: [
                      // Header
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(16),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.lightbulb_outline,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Bay Navigator Assistant',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    'AI-powered program finder',
                                    style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.8),
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            PopupMenuButton<String>(
                              icon: const Icon(Icons.more_vert, color: Colors.white),
                              tooltip: 'Options',
                              onSelected: (value) {
                                if (value == 'clear') {
                                  _clearChat();
                                }
                              },
                              itemBuilder: (context) => [
                                const PopupMenuItem(
                                  value: 'clear',
                                  child: Row(
                                    children: [
                                      Icon(Icons.delete_outline, size: 20),
                                      SizedBox(width: 8),
                                      Text('Clear Chat'),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            IconButton(
                              icon: const Icon(Icons.close, color: Colors.white),
                              onPressed: _togglePanel,
                              tooltip: 'Close',
                            ),
                          ],
                        ),
                      ),

                      // Messages
                      Expanded(
                        child: ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.all(16),
                          itemCount: _messages.length + (_isLoading ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (_isLoading && index == _messages.length) {
                              return _buildLoadingIndicator();
                            }
                            return _buildMessage(_messages[index]);
                          },
                        ),
                      ),

                      // Quick prompts (show only at start)
                      if (_messages.length == 1)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              _buildQuickPrompt('Food assistance'),
                              _buildQuickPrompt('Utility bill help'),
                              _buildQuickPrompt('Healthcare'),
                            ],
                          ),
                        ),

                      // Input
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          border: Border(
                            top: BorderSide(
                              color: isDark
                                  ? AppColors.darkBorder
                                  : AppColors.lightBorder,
                            ),
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _inputController,
                                focusNode: _inputFocusNode,
                                decoration: InputDecoration(
                                  hintText: 'Ask about programs...',
                                  filled: true,
                                  fillColor: isDark
                                      ? AppColors.darkBackground
                                      : AppColors.lightBackground,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(24),
                                    borderSide: BorderSide.none,
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 12,
                                  ),
                                ),
                                textInputAction: TextInputAction.send,
                                onSubmitted: (_) => _sendMessage(),
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton.filled(
                              onPressed: _isLoading ? null : () => _sendMessage(),
                              icon: const Icon(Icons.send),
                              style: IconButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                disabledBackgroundColor: Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          ],
        );
      },
    );
  }

  void _showOfflineMessage(BuildContext context) {
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.wifi_off, color: Colors.white, size: 18),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Carl is offline. Enable AI-Powered Search in Settings to use the assistant.',
              ),
            ),
          ],
        ),
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'Settings',
          onPressed: () {
            Navigator.pushNamed(context, '/settings');
          },
        ),
      ),
    );
  }

  Widget _buildQuickPrompt(String text) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return ActionChip(
      label: Text(text),
      onPressed: () => _sendMessage(text),
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
    );
  }

  Widget _buildLoadingIndicator() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark
              ? AppColors.darkBackground
              : AppColors.lightBackground,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(
            3,
            (index) => Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              child: _LoadingDot(delay: index * 150),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMessage(_ChatMessage message) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isUser = message.role == 'user';

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: const BoxConstraints(maxWidth: 280),
        child: Column(
          crossAxisAlignment:
              isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isUser
                    ? AppColors.primary
                    : message.isError
                        ? Colors.red.shade100
                        : (isDark
                            ? AppColors.darkBackground
                            : AppColors.lightBackground),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
              ),
              child: Text(
                message.content,
                style: TextStyle(
                  color: isUser
                      ? Colors.white
                      : (isDark ? AppColors.darkText : AppColors.lightText),
                ),
              ),
            ),
            // Program cards
            if (message.programs != null && message.programs!.isNotEmpty) ...[
              const SizedBox(height: 8),
              ...message.programs!.take(3).map(
                    (program) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: _MiniProgramCard(
                        program: program,
                        onTap: () {
                          widget.onProgramTap?.call(program);
                          _togglePanel();
                        },
                        isFavorite: widget.isFavorite?.call(program.id) ?? false,
                        onFavoriteToggle: () =>
                            widget.onFavoriteToggle?.call(program),
                      ),
                    ),
                  ),
              if (message.programs!.length > 3)
                Text(
                  '+${message.programs!.length - 3} more programs',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ChatMessage {
  final String role;
  final String content;
  final List<Program>? programs;
  final bool isError;

  _ChatMessage({
    required this.role,
    required this.content,
    this.programs,
    this.isError = false,
  });
}

class _LoadingDot extends StatefulWidget {
  final int delay;

  const _LoadingDot({required this.delay});

  @override
  State<_LoadingDot> createState() => _LoadingDotState();
}

class _LoadingDotState extends State<_LoadingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _animation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) {
        _controller.repeat(reverse: true);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: Colors.grey.withValues(alpha: 0.4 + _animation.value * 0.4),
            shape: BoxShape.circle,
          ),
        );
      },
    );
  }
}

/// Mini program card for display in chat
class _MiniProgramCard extends StatelessWidget {
  final Program program;
  final VoidCallback onTap;
  final bool isFavorite;
  final VoidCallback? onFavoriteToggle;

  const _MiniProgramCard({
    required this.program,
    required this.onTap,
    required this.isFavorite,
    this.onFavoriteToggle,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Material(
      color: isDark ? AppColors.darkCard : Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      program.name,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (onFavoriteToggle != null)
                    GestureDetector(
                      onTap: onFavoriteToggle,
                      child: Icon(
                        isFavorite ? Icons.bookmark : Icons.bookmark_outline,
                        size: 18,
                        color: isFavorite ? AppColors.primary : Colors.grey,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                CategoryIcons.formatName(program.category),
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                program.description,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
