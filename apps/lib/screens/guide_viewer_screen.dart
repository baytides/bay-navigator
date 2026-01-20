import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import '../config/theme.dart';

/// Native guide viewer that fetches markdown content from the website
/// and renders it as native Flutter widgets
class GuideViewerScreen extends StatefulWidget {
  final String title;
  final String guideId;
  final Color accentColor;

  const GuideViewerScreen({
    required this.title,
    required this.guideId,
    required this.accentColor,
    super.key,
  });

  @override
  State<GuideViewerScreen> createState() => _GuideViewerScreenState();
}

class _GuideViewerScreenState extends State<GuideViewerScreen> {
  bool _isLoading = true;
  bool _hasError = false;
  String? _errorMessage;
  String _content = '';

  @override
  void initState() {
    super.initState();
    _loadContent();
  }

  Future<void> _loadContent() async {
    setState(() {
      _isLoading = true;
      _hasError = false;
      _errorMessage = null;
    });

    try {
      // Fetch markdown content from the website
      // The website serves markdown at /api/eligibility/{guideId}.md
      final url = 'https://baynavigator.org/api/eligibility/${widget.guideId}.md';
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Accept': 'text/markdown, text/plain, */*',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        setState(() {
          _content = response.body;
          _isLoading = false;
        });
      } else if (response.statusCode == 404) {
        // Fallback: Try the HTML page and extract content, or show error
        setState(() {
          _hasError = true;
          _errorMessage = 'Guide content not available yet. Opening web version...';
          _isLoading = false;
        });
        // Auto-open in webview after delay
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            _openInWebView();
          }
        });
      } else {
        setState(() {
          _hasError = true;
          _errorMessage = 'Failed to load guide (${response.statusCode})';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _hasError = true;
        _errorMessage = 'Unable to connect. Check your internet connection.';
        _isLoading = false;
      });
    }
  }

  Future<void> _openInWebView() async {
    final url = Uri.parse('https://baynavigator.org/eligibility/${widget.guideId}');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadContent,
            tooltip: 'Refresh',
          ),
          IconButton(
            icon: const Icon(Icons.open_in_browser),
            onPressed: _openInWebView,
            tooltip: 'Open in browser',
          ),
        ],
      ),
      body: _isLoading
          ? _buildLoadingView()
          : _hasError
              ? _buildErrorView(isDark)
              : _buildContentView(isDark),
    );
  }

  Widget _buildLoadingView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: widget.accentColor),
          const SizedBox(height: 24),
          Text(
            'Loading guide...',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }

  Widget _buildErrorView(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.wifi_off,
              size: 64,
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
            const SizedBox(height: 24),
            Text(
              'Unable to load guide',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              _errorMessage ?? 'Something went wrong.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            FilledButton.icon(
              onPressed: _loadContent,
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _openInWebView,
              icon: const Icon(Icons.open_in_browser),
              label: const Text('Open in Browser'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContentView(bool isDark) {
    final theme = Theme.of(context);

    // Custom markdown styling
    final markdownStyleSheet = MarkdownStyleSheet(
      h1: theme.textTheme.headlineMedium?.copyWith(
        fontWeight: FontWeight.bold,
        color: widget.accentColor,
      ),
      h2: theme.textTheme.headlineSmall?.copyWith(
        fontWeight: FontWeight.w600,
        color: isDark ? AppColors.darkText : AppColors.lightText,
      ),
      h3: theme.textTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.w600,
        color: isDark ? AppColors.darkText : AppColors.lightText,
      ),
      p: theme.textTheme.bodyMedium?.copyWith(
        height: 1.6,
        color: isDark ? AppColors.darkText : AppColors.lightText,
      ),
      listBullet: theme.textTheme.bodyMedium?.copyWith(
        color: widget.accentColor,
      ),
      a: TextStyle(
        color: AppColors.primary,
        decoration: TextDecoration.underline,
      ),
      blockquoteDecoration: BoxDecoration(
        color: widget.accentColor.withValues(alpha: 0.1),
        border: Border(
          left: BorderSide(
            color: widget.accentColor,
            width: 4,
          ),
        ),
      ),
      blockquotePadding: const EdgeInsets.all(16),
      code: TextStyle(
        backgroundColor: isDark ? Colors.grey[800] : Colors.grey[200],
        fontFamily: 'monospace',
        fontSize: 14,
      ),
      codeblockDecoration: BoxDecoration(
        color: isDark ? Colors.grey[850] : Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
      ),
      codeblockPadding: const EdgeInsets.all(16),
      horizontalRuleDecoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          ),
        ),
      ),
      tableHead: theme.textTheme.bodyMedium?.copyWith(
        fontWeight: FontWeight.bold,
      ),
      tableBody: theme.textTheme.bodyMedium,
      tableBorder: TableBorder.all(
        color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
        width: 1,
      ),
      tableCellsPadding: const EdgeInsets.all(8),
    );

    return Markdown(
      data: _content,
      selectable: true,
      styleSheet: markdownStyleSheet,
      padding: const EdgeInsets.all(16),
      onTapLink: (text, href, title) {
        if (href != null) {
          _openUrl(href);
        }
      },
    );
  }
}
