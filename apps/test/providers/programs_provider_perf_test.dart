import 'package:flutter_test/flutter_test.dart';
import 'package:baynavigator/models/program.dart';
import 'package:baynavigator/providers/programs_provider.dart';
import 'package:baynavigator/services/api_service.dart';

/// Serves a fixed, in-memory dataset so the filter pipeline can be exercised
/// without network or SharedPreferences.
class FakeApiService extends ApiService {
  FakeApiService(this.programs);

  final List<Program> programs;

  @override
  Future<List<Program>> getPrograms({bool forceRefresh = false}) async => programs;

  @override
  Future<List<ProgramCategory>> getCategories({bool forceRefresh = false}) async =>
      List.generate(
        kCategoryIds.length,
        (i) => ProgramCategory(
          id: kCategoryIds[i],
          name: kCategoryIds[i],
          icon: 'star',
          programCount: 0,
        ),
      );

  @override
  Future<List<ProgramGroup>> getGroups({bool forceRefresh = false}) async => List.generate(
        kGroupIds.length,
        (i) => ProgramGroup(
          id: kGroupIds[i],
          name: kGroupIds[i],
          description: '',
          icon: 'star',
          programCount: 0,
        ),
      );

  @override
  Future<List<Area>> getAreas({bool forceRefresh = false}) async => List.generate(
        kCountyNames.length,
        (i) => Area(
          id: kCountyNames[i].toLowerCase().replaceAll(' ', '-'),
          name: kCountyNames[i],
          type: 'county',
          programCount: 0,
        ),
      );

  @override
  Future<APIMetadata> getMetadata({bool forceRefresh = false}) async =>
      APIMetadata(version: '1', generatedAt: '2026-01-01', totalPrograms: programs.length);

  @override
  Future<List<String>> getFavorites() async => const [];

  @override
  Future<List<FavoriteItem>> getFavoriteItems() async => const [];
}

const kCategoryIds = [
  'food', 'health', 'housing', 'utilities', 'transportation', 'education',
  'employment', 'legal', 'childcare', 'seniors', 'internet', 'recreation',
];

const kGroupIds = [
  'seniors', 'low-income', 'veterans', 'students', 'families', 'disabled',
  'immigrants', 'youth', 'unhoused',
];

const kCountyNames = [
  'San Francisco', 'Alameda', 'Santa Clara', 'San Mateo', 'Contra Costa',
  'Marin', 'Sonoma', 'Napa', 'Solano',
];

/// Mirrors the real corpus size (823 programs as of the current API build).
List<Program> buildPrograms(int count) => List.generate(count, (i) {
      final areas = i % 4 == 0
          ? <String>['Bay Area']
          : <String>[kCountyNames[i % kCountyNames.length]];
      return Program(
        id: 'program-$i',
        name: 'Program $i free food assistance',
        category: kCategoryIds[i % kCategoryIds.length],
        description: 'Description for program $i providing support services',
        groups: [kGroupIds[i % kGroupIds.length], kGroupIds[(i + 3) % kGroupIds.length]],
        areas: areas,
        website: 'https://example.org/$i',
        lastUpdated: '2026-0${(i % 9) + 1}-01',
      );
    });

/// One directory_screen build reads the filtered list three times and asks for
/// a count per category chip, group chip, and area row.
int simulateOneDirectoryBuild(ProgramsProvider p) {
  var acc = 0;
  acc += p.filteredPrograms.length;
  acc += p.filteredPrograms.length;
  acc += p.filteredPrograms.length;
  for (final c in p.categories) {
    acc += p.getCategoryCount(c.id);
  }
  for (final g in p.groups) {
    acc += p.getGroupCount(g.id);
  }
  for (final a in p.areas) {
    acc += p.getAreaCount(a.id);
  }
  return acc;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ProgramsProvider filter pipeline', () {
    late ProgramsProvider provider;

    setUp(() async {
      provider = ProgramsProvider(apiService: FakeApiService(buildPrograms(823)));
      await provider.loadData();
    });

    test('loads the full dataset', () {
      expect(provider.programs.length, 823);
      expect(provider.filteredPrograms.length, 823);
    });

    test('reports how expensive one directory_screen build is', () {
      // Warm up so we measure steady state, not first-call effects.
      simulateOneDirectoryBuild(provider);

      const builds = 20;
      final sw = Stopwatch()..start();
      for (var i = 0; i < builds; i++) {
        simulateOneDirectoryBuild(provider);
      }
      sw.stop();

      final perBuild = sw.elapsedMicroseconds / builds;
      // ignore: avoid_print
      print('one directory build: ${perBuild.toStringAsFixed(0)}us '
          '($builds builds in ${sw.elapsedMilliseconds}ms)');

      // Typing in the search box rebuilds on every keystroke, so a single build
      // has to stay well inside one 60fps frame (16_666us).
      expect(perBuild, lessThan(16666),
          reason: 'one directory_screen build must fit in a 60fps frame');
    });

    // The chip counts moved from a per-chip `.where(...).length` scan to a
    // single tallying pass; these lock in that the numbers did not move.
    test('chip counts match a naive per-chip scan', () {
      void check() {
        for (final c in provider.categories) {
          final naive = provider.programs
              .where((p) => p.category == c.id)
              .where((p) => _passesGroups(provider, p))
              .where((p) => _passesSearch(provider, p))
              .length;
          expect(provider.getCategoryCount(c.id), naive, reason: 'category ${c.id}');
        }
        for (final g in provider.groups) {
          final naive = provider.programs
              .where((p) => p.groups.contains(g.id))
              .where((p) => _passesCategories(provider, p))
              .where((p) => _passesSearch(provider, p))
              .length;
          expect(provider.getGroupCount(g.id), naive, reason: 'group ${g.id}');
        }
      }

      check();

      provider.toggleCategory('food');
      check();

      provider.toggleGroup('seniors');
      check();

      provider.setSearchQuery('assistance');
      check();
    });

    test('cache invalidates when filters change', () {
      final unfiltered = provider.filteredPrograms.length;
      provider.toggleCategory('food');
      final filtered = provider.filteredPrograms.length;
      expect(filtered, lessThan(unfiltered));

      provider.clearFilters();
      expect(provider.filteredPrograms.length, unfiltered);
    });

    test('cache invalidates when the sort option changes', () {
      provider.setSortOption(SortOption.nameAsc);
      final asc = provider.filteredPrograms.map((p) => p.name).toList();
      provider.setSortOption(SortOption.nameDesc);
      final desc = provider.filteredPrograms.map((p) => p.name).toList();
      expect(desc, asc.reversed.toList());
    });

    test('sorting does not reorder the underlying programs list', () {
      final before = provider.programs.map((p) => p.id).toList();
      provider.setSortOption(SortOption.nameAsc);
      provider.filteredPrograms;
      expect(provider.programs.map((p) => p.id).toList(), before);
    });

    test('reports the cost of typing a search query', () {
      const query = 'food assistance';
      final sw = Stopwatch()..start();
      for (var i = 1; i <= query.length; i++) {
        provider.setSearchQuery(query.substring(0, i));
        simulateOneDirectoryBuild(provider);
      }
      sw.stop();
      // ignore: avoid_print
      print('typing "$query" (${query.length} keystrokes): ${sw.elapsedMilliseconds}ms');
    });
  });
}

bool _passesSearch(ProgramsProvider p, Program program) {
  final q = p.filterState.searchQuery.toLowerCase();
  if (q.isEmpty) return true;
  return program.name.toLowerCase().contains(q) ||
      program.description.toLowerCase().contains(q);
}

bool _passesCategories(ProgramsProvider p, Program program) =>
    p.filterState.categories.isEmpty ||
    p.filterState.categories.contains(program.category);

bool _passesGroups(ProgramsProvider p, Program program) =>
    p.filterState.groups.isEmpty ||
    p.filterState.groups.any((g) => program.groups.contains(g));
