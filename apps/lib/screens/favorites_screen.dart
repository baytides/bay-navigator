import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/programs_provider.dart';
import '../models/program.dart';
import '../config/theme.dart';
import '../services/export_service.dart';
import '../utils/category_icons.dart';
import 'program_detail_screen.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => FavoritesScreenState();
}

class FavoritesScreenState extends State<FavoritesScreen> {
  Future<void> _exportPrograms(List<dynamic> favorites) async {
    final success = await ExportService.saveAndShareCsv(
      favorites.cast(),
      context,
    );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success
              ? 'Programs exported successfully'
              : 'Failed to export programs'),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _printPrograms(List<dynamic> favorites) async {
    final success = await ExportService.printPrograms(favorites.cast());
    if (mounted && !success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to prepare print preview'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _copyAllToClipboard(List<dynamic> favorites) async {
    await ExportService.copyAllToClipboard(favorites.cast());
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Programs copied to clipboard'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  IconData _getStatusIcon(FavoriteStatus status) {
    switch (status) {
      case FavoriteStatus.saved:
        return Icons.bookmark_outline;
      case FavoriteStatus.researching:
        return Icons.search;
      case FavoriteStatus.applied:
        return Icons.send_outlined;
      case FavoriteStatus.waiting:
        return Icons.schedule;
      case FavoriteStatus.approved:
        return Icons.check_circle_outline;
      case FavoriteStatus.denied:
        return Icons.cancel_outlined;
    }
  }

  void _showStatusNotesSheet(BuildContext context, Program program, FavoriteItem? favoriteItem) {
    final provider = Provider.of<ProgramsProvider>(context, listen: false);
    final currentStatus = favoriteItem?.status ?? FavoriteStatus.saved;
    final notesController = TextEditingController(text: favoriteItem?.notes ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.grey[400],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              // Program name
              Text(
                program.name,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 20),
              // Status section
              Text(
                'Status',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Color(currentStatus.colorValue).withValues(alpha: 0.5),
                  ),
                  color: Color(currentStatus.colorValue).withValues(alpha: 0.1),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<FavoriteStatus>(
                    value: currentStatus,
                    isExpanded: true,
                    borderRadius: BorderRadius.circular(12),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    icon: Icon(
                      Icons.keyboard_arrow_down,
                      color: Color(currentStatus.colorValue),
                    ),
                    items: FavoriteStatus.values.map((status) {
                      return DropdownMenuItem<FavoriteStatus>(
                        value: status,
                        child: Row(
                          children: [
                            Icon(
                              _getStatusIcon(status),
                              size: 20,
                              color: Color(status.colorValue),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              status.label,
                              style: TextStyle(
                                color: Color(status.colorValue),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                    onChanged: (status) {
                      if (status != null && status != currentStatus) {
                        provider.updateFavoriteStatus(program.id, status);
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Status updated to "${status.label}"'),
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      }
                    },
                  ),
                ),
              ),
              const SizedBox(height: 20),
              // Notes section
              Text(
                'Private Notes',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: notesController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Add personal notes (e.g., "Called on 1/10, need to submit docs by Friday")',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  contentPadding: const EdgeInsets.all(12),
                ),
              ),
              const SizedBox(height: 16),
              // Save button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    provider.updateFavoriteNotes(program.id, notesController.text.isEmpty ? null : notesController.text);
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Notes saved'),
                        duration: Duration(seconds: 2),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Save Notes'),
                ),
              ),
              const SizedBox(height: 8),
              // Privacy notice
              Text(
                'Your notes are stored only on this device and never sent to any server.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey[500],
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isDesktop = Platform.isMacOS || Platform.isWindows || Platform.isLinux;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Saved Programs'),
        actions: [
          Consumer<ProgramsProvider>(
            builder: (context, provider, child) {
              final favorites = provider.favoritePrograms;
              if (favorites.isEmpty) return const SizedBox.shrink();

              // Show action buttons only when there are favorites
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Copy to clipboard button
                  IconButton(
                    icon: const Icon(Icons.copy),
                    tooltip: 'Copy to clipboard',
                    onPressed: () => _copyAllToClipboard(favorites),
                  ),
                  // Export button (desktop only shows both, mobile shows menu)
                  if (isDesktop) ...[
                    IconButton(
                      icon: const Icon(Icons.download),
                      tooltip: 'Export to CSV',
                      onPressed: () => _exportPrograms(favorites),
                    ),
                    IconButton(
                      icon: const Icon(Icons.print),
                      tooltip: 'Print',
                      onPressed: () => _printPrograms(favorites),
                    ),
                  ] else
                    PopupMenuButton<String>(
                      icon: const Icon(Icons.more_vert),
                      onSelected: (value) {
                        switch (value) {
                          case 'export':
                            _exportPrograms(favorites);
                            break;
                          case 'print':
                            _printPrograms(favorites);
                            break;
                        }
                      },
                      itemBuilder: (context) => [
                        const PopupMenuItem(
                          value: 'export',
                          child: ListTile(
                            leading: Icon(Icons.download),
                            title: Text('Export to CSV'),
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'print',
                          child: ListTile(
                            leading: Icon(Icons.print),
                            title: Text('Print'),
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                      ],
                    ),
                ],
              );
            },
          ),
        ],
      ),
      body: Consumer<ProgramsProvider>(
        builder: (context, provider, child) {
          final favorites = provider.favoritePrograms;

          if (favorites.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.bookmark_border,
                    size: 64,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No saved programs yet',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tap the bookmark icon on any program\nto save it for later',
                    style: theme.textTheme.bodySmall,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          return LayoutBuilder(
            builder: (context, constraints) {
              // Use grid layout on desktop
              if (isDesktop && constraints.maxWidth >= 600) {
                int crossAxisCount;
                if (constraints.maxWidth >= 1200) {
                  crossAxisCount = 4;
                } else if (constraints.maxWidth >= 900) {
                  crossAxisCount = 3;
                } else {
                  crossAxisCount = 2;
                }

                const cardHeight = 380.0; // Increased for status badge
                final cardWidth = (constraints.maxWidth - (crossAxisCount - 1) * 16 - 32) / crossAxisCount;
                final aspectRatio = cardWidth / cardHeight;

                return GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: aspectRatio,
                  ),
                  itemCount: favorites.length,
                  itemBuilder: (context, index) {
                    final program = favorites[index];
                    final favoriteItem = provider.getFavoriteItem(program.id);
                    return _FavoriteCard(
                      program: program,
                      favoriteItem: favoriteItem,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => ProgramDetailScreen(
                              program: program,
                            ),
                          ),
                        );
                      },
                      onFavoriteToggle: () {
                        provider.toggleFavorite(program.id);
                      },
                      onStatusNotesTap: () {
                        _showStatusNotesSheet(context, program, favoriteItem);
                      },
                    );
                  },
                );
              }

              // List view for mobile
              return ListView.builder(
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: favorites.length,
                itemBuilder: (context, index) {
                  final program = favorites[index];
                  final favoriteItem = provider.getFavoriteItem(program.id);
                  return _FavoriteCard(
                    program: program,
                    favoriteItem: favoriteItem,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => ProgramDetailScreen(
                            program: program,
                          ),
                        ),
                      );
                    },
                    onFavoriteToggle: () {
                      provider.toggleFavorite(program.id);
                    },
                    onStatusNotesTap: () {
                      _showStatusNotesSheet(context, program, favoriteItem);
                    },
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}

/// Custom favorite card with status badge and notes indicator
class _FavoriteCard extends StatelessWidget {
  final Program program;
  final FavoriteItem? favoriteItem;
  final VoidCallback onTap;
  final VoidCallback onFavoriteToggle;
  final VoidCallback onStatusNotesTap;

  const _FavoriteCard({
    required this.program,
    this.favoriteItem,
    required this.onTap,
    required this.onFavoriteToggle,
    required this.onStatusNotesTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final status = favoriteItem?.status ?? FavoriteStatus.saved;
    final hasNotes = favoriteItem?.notes?.isNotEmpty == true;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Category and location row
              Row(
                children: [
                  CategoryIcons.buildCategoryBadge(
                    program.category,
                    isDark: isDark,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      program.locationText,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  // Favorite toggle button
                  IconButton(
                    icon: const Icon(Icons.favorite, color: Colors.red),
                    iconSize: 20,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    tooltip: 'Remove from favorites',
                    onPressed: onFavoriteToggle,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              // Program name
              Text(
                program.name,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              // Description
              Text(
                program.description,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              // Status and notes row
              InkWell(
                onTap: onStatusNotesTap,
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Color(status.colorValue).withValues(alpha:0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: Color(status.colorValue).withValues(alpha:0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _getStatusIcon(status),
                        size: 16,
                        color: Color(status.colorValue),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        status.label,
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: Color(status.colorValue),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (hasNotes) ...[
                        const SizedBox(width: 8),
                        Icon(
                          Icons.note_alt_outlined,
                          size: 14,
                          color: Color(status.colorValue),
                        ),
                      ],
                      const Spacer(),
                      Icon(
                        Icons.edit_outlined,
                        size: 14,
                        color: Color(status.colorValue).withValues(alpha:0.6),
                      ),
                    ],
                  ),
                ),
              ),
              // Show notes preview if available
              if (hasNotes) ...[
                const SizedBox(height: 8),
                Text(
                  favoriteItem!.notes!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    fontStyle: FontStyle.italic,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  IconData _getStatusIcon(FavoriteStatus status) {
    switch (status) {
      case FavoriteStatus.saved:
        return Icons.bookmark_outline;
      case FavoriteStatus.researching:
        return Icons.search;
      case FavoriteStatus.applied:
        return Icons.send_outlined;
      case FavoriteStatus.waiting:
        return Icons.schedule;
      case FavoriteStatus.approved:
        return Icons.check_circle_outline;
      case FavoriteStatus.denied:
        return Icons.cancel_outlined;
    }
  }
}
