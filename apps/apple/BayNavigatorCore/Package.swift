// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "BayNavigatorCore",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
        .visionOS(.v1)
    ],
    products: [
        .library(
            name: "BayNavigatorCore",
            targets: ["BayNavigatorCore"]
        ),
    ],
    dependencies: [
        // Lottie for high-quality animations
        .package(url: "https://github.com/airbnb/lottie-ios.git", from: "4.4.0"),
        // GRDB for on-device SQLite/FTS5 retrieval (the Knowledge Pack corpus)
        .package(url: "https://github.com/groue/GRDB.swift.git", from: "7.0.0"),
    ],
    targets: [
        .target(
            name: "BayNavigatorCore",
            dependencies: [
                .product(name: "Lottie", package: "lottie-ios"),
                .product(name: "GRDB", package: "GRDB.swift"),
            ],
            path: "Sources/BayNavigatorCore",
            resources: [
                .process("Resources/Animations"),
                .process("Resources/quick-answers.json"),
            ]
        ),
        .testTarget(
            name: "BayNavigatorCoreTests",
            dependencies: ["BayNavigatorCore"],
            path: "Tests/BayNavigatorCoreTests"
        ),
    ]
)
