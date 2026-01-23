import SwiftUI
import BayNavigatorCore

/// View for customizing navigation tab bar and more menu items
struct NavigationCustomizationView: View {
    @Environment(NavigationService.self) private var navigationService
    @Environment(\.dismiss) private var dismiss

    @State private var tabBarIds: [String] = []
    @State private var moreIds: [String] = []
    @State private var hasChanges = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(spacing: 24) {
                        // Tab Bar Section
                        tabBarSection

                        // More Menu Section
                        moreSection
                    }
                    .padding()
                }

                Divider()

                // Tab Bar Preview
                tabBarPreview
            }
            .navigationTitle("Customize Navigation")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveChanges()
                        dismiss()
                    }
                    .disabled(!hasChanges)
                    .fontWeight(.semibold)
                }
            }
        }
        .onAppear {
            loadCurrentConfiguration()
        }
        #if os(iOS)
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        #endif
    }

    // MARK: - Tab Bar Section

    private var tabBarSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("TAB BAR")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)

                Spacer()

                Text("\(tabBarIds.count)/\(NavigationService.maxTabBarItems)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Text("Drag to reorder. \"For You\" always stays first.")
                .font(.caption)
                .foregroundStyle(.tertiary)

            // Reorderable list
            VStack(spacing: 8) {
                ForEach(Array(tabBarIds.enumerated()), id: \.element) { index, id in
                    if let item = NavItems.getById(id) {
                        DraggableNavItemRow(
                            item: item,
                            isInTabBar: true,
                            canRemove: !item.isLocked && tabBarIds.count > NavigationService.minTabBarItems,
                            onRemove: {
                                moveToMore(id)
                            }
                        )
                        .onDrag {
                            item.isLocked ? NSItemProvider() : NSItemProvider(object: id as NSString)
                        }
                        .onDrop(of: [.text], delegate: TabBarDropDelegate(
                            item: id,
                            items: $tabBarIds,
                            hasChanges: $hasChanges
                        ))
                    }
                }
            }

            // Add button
            if tabBarIds.count < NavigationService.maxTabBarItems && !moreIds.isEmpty {
                Button {
                    showAddItemPicker()
                } label: {
                    HStack {
                        Image(systemName: "plus.circle")
                        Text("Add to Tab Bar")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.appPrimary.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                    .foregroundStyle(Color.appPrimary)
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - More Section

    private var moreSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("MORE MENU")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(.secondary)

            Text("Items not in the tab bar appear here.")
                .font(.caption)
                .foregroundStyle(.tertiary)

            if moreIds.isEmpty {
                Text("All items are in the tab bar")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding()
                    #if os(iOS)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
                    #elseif os(macOS)
                    .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 12))
                    #else
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
                    #endif
            } else {
                VStack(spacing: 8) {
                    ForEach(moreIds, id: \.self) { id in
                        if let item = NavItems.getById(id) {
                            DraggableNavItemRow(
                                item: item,
                                isInTabBar: false,
                                canAdd: tabBarIds.count < NavigationService.maxTabBarItems,
                                onAdd: {
                                    moveToTabBar(id)
                                }
                            )
                        }
                    }
                }
            }

            // Reset button
            Button(role: .destructive) {
                resetToDefaults()
            } label: {
                HStack {
                    Image(systemName: "arrow.counterclockwise")
                    Text("Reset to Defaults")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.appDanger.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                .foregroundStyle(Color.appDanger)
            }
            .buttonStyle(.plain)
            .padding(.top, 8)
        }
    }

    // MARK: - Tab Bar Preview

    private var tabBarPreview: some View {
        VStack(spacing: 8) {
            Text("PREVIEW")
                .font(.caption2)
                .foregroundStyle(.secondary)

            HStack(spacing: 0) {
                ForEach(tabBarIds, id: \.self) { id in
                    if let item = NavItems.getById(id) {
                        TabBarPreviewItem(item: item)
                    }
                }

                // More tab (always shown)
                VStack(spacing: 4) {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 18))
                    Text("More")
                        .font(.caption2)
                }
                .frame(maxWidth: .infinity)
                .foregroundStyle(.secondary)
            }
            .padding(.vertical, 8)
            .padding(.horizontal, 4)
            #if os(iOS)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
            #elseif os(macOS)
            .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 16))
            #else
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
            #endif
        }
        .padding()
    }

    // MARK: - Actions

    private func loadCurrentConfiguration() {
        tabBarIds = navigationService.tabBarItemIds
        moreIds = navigationService.moreItems.map(\.id)
    }

    private func moveToTabBar(_ id: String) {
        guard tabBarIds.count < NavigationService.maxTabBarItems else { return }
        guard let index = moreIds.firstIndex(of: id) else { return }

        withAnimation {
            moreIds.remove(at: index)
            tabBarIds.append(id)
            hasChanges = true
        }
        HapticManager.impact(.light)
    }

    private func moveToMore(_ id: String) {
        guard let item = NavItems.getById(id) else { return }
        guard !item.isLocked else { return }
        guard tabBarIds.count > NavigationService.minTabBarItems else { return }
        guard let index = tabBarIds.firstIndex(of: id) else { return }

        withAnimation {
            tabBarIds.remove(at: index)
            moreIds.append(id)
            hasChanges = true
        }
        HapticManager.impact(.light)
    }

    private func resetToDefaults() {
        withAnimation {
            tabBarIds = NavItems.defaultTabBarIds
            moreIds = NavItems.all
                .filter { !NavItems.defaultTabBarIds.contains($0.id) }
                .map(\.id)
            hasChanges = true
        }
        HapticManager.notification(.warning)
    }

    private func saveChanges() {
        navigationService.applyConfiguration(tabBarIds: tabBarIds)
        HapticManager.notification(.success)
    }

    @State private var showingAddPicker = false

    private func showAddItemPicker() {
        showingAddPicker = true
    }
}

// MARK: - Draggable Nav Item Row

struct DraggableNavItemRow: View {
    let item: NavItem
    let isInTabBar: Bool
    var canRemove: Bool = false
    var canAdd: Bool = false
    var onRemove: (() -> Void)?
    var onAdd: (() -> Void)?

    var body: some View {
        HStack(spacing: 12) {
            // Drag handle (only for unlocked tab bar items)
            if isInTabBar && !item.isLocked {
                Image(systemName: "line.3.horizontal")
                    .foregroundStyle(.tertiary)
                    .font(.caption)
            }

            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.appPrimary.opacity(0.1))
                    .frame(width: 36, height: 36)

                Image(systemName: item.iconName)
                    .font(.body)
                    .foregroundStyle(Color.appPrimary)
            }

            // Label and lock indicator
            VStack(alignment: .leading, spacing: 2) {
                Text(item.label)
                    .font(.subheadline)
                    .fontWeight(.medium)

                if item.isLocked {
                    Text("Always first")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }

            Spacer()

            // Action buttons
            if isInTabBar {
                if item.isLocked {
                    Image(systemName: "lock.fill")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                } else if canRemove {
                    Button {
                        onRemove?()
                    } label: {
                        Image(systemName: "minus.circle.fill")
                            .font(.title3)
                            .foregroundStyle(Color.appDanger)
                    }
                    .buttonStyle(.plain)
                }
            } else if canAdd {
                Button {
                    onAdd?()
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.title3)
                        .foregroundStyle(Color.appSuccess)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(12)
        #if os(iOS)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        #elseif os(macOS)
        .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 12))
        #else
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        #endif
        .contentShape(Rectangle())
    }
}

// MARK: - Tab Bar Preview Item

struct TabBarPreviewItem: View {
    let item: NavItem

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: item.iconName)
                .font(.system(size: 18))
            Text(item.label)
                .font(.caption2)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .foregroundStyle(Color.appPrimary)
    }
}

// MARK: - Drop Delegate

struct TabBarDropDelegate: DropDelegate {
    let item: String
    @Binding var items: [String]
    @Binding var hasChanges: Bool

    func performDrop(info: DropInfo) -> Bool {
        hasChanges = true
        return true
    }

    func dropEntered(info: DropInfo) {
        guard let fromItem = info.itemProviders(for: [.text]).first else { return }

        fromItem.loadObject(ofClass: NSString.self) { reading, _ in
            guard let fromId = reading as? String else { return }
            guard let fromIndex = items.firstIndex(of: fromId) else { return }
            guard let toIndex = items.firstIndex(of: item) else { return }
            guard fromIndex != toIndex else { return }

            // Don't allow moving to position 0 (For You)
            let adjustedToIndex = toIndex == 0 ? 1 : toIndex

            DispatchQueue.main.async {
                withAnimation {
                    items.move(
                        fromOffsets: IndexSet(integer: fromIndex),
                        toOffset: adjustedToIndex > fromIndex ? adjustedToIndex + 1 : adjustedToIndex
                    )
                }
            }
        }
    }

    func dropUpdated(info: DropInfo) -> DropProposal? {
        DropProposal(operation: .move)
    }
}

#Preview {
    NavigationCustomizationView()
        .environment(NavigationService.shared)
}
