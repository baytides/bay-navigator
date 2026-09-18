import Foundation
import Testing

@testable import BayNavigatorCore

/// Pins the download picker's contract: what "my city", "my county" and
/// "the whole Bay Area" each resolve to, and that the sizes shown to someone
/// choosing are the sizes they will actually download.
struct OrdinancePacksTests {

    private func catalog() throws -> OrdinanceCatalog {
        let json = """
            {
              "dir": "ordinances",
              "jurisdictions": {
                "oakland":   {"name":"Oakland","county":"Alameda","type":"city","file":"ordinances/oakland.sqlite","sha256":"a","bytes":1372160,"sections":394},
                "berkeley":  {"name":"Berkeley","county":"Alameda","type":"city","file":"ordinances/berkeley.sqlite","sha256":"b","bytes":57344,"sections":5},
                "daly-city": {"name":"Daly City","county":"San Mateo","type":"city","file":"ordinances/daly-city.sqlite","sha256":"c","bytes":1204224,"sections":406}
              },
              "counties": {
                "alameda":   {"name":"Alameda County","jurisdictions":["berkeley","oakland"],"bytes":1429504,"sections":399,"available":2,"total":15},
                "san-mateo": {"name":"San Mateo County","jurisdictions":["daly-city"],"bytes":1204224,"sections":406,"available":1,"total":21},
                "marin":     {"name":"Marin County","jurisdictions":[],"bytes":0,"sections":0,"available":0,"total":12}
              },
              "all": {"jurisdictions":["berkeley","daly-city","oakland"],"bytes":2633728,"sections":805,"available":3,"total":109}
            }
            """
        return try JSONDecoder().decode(OrdinanceCatalog.self, from: Data(json.utf8))
    }

    // MARK: the three tiers

    @Test func cityTierDownloadsOnePack() throws {
        let plan = try catalog().plan(for: .city("oakland"))
        #expect(plan.slugs == ["oakland"])
        #expect(plan.files == ["ordinances/oakland.sqlite"])
        #expect(plan.bytes == 1_372_160)
    }

    @Test func countyTierDownloadsEveryCityInIt() throws {
        let cat = try catalog()
        let plan = cat.plan(for: .county("alameda"))
        #expect(Set(plan.slugs) == ["berkeley", "oakland"])
        #expect(plan.bytes == cat.counties["alameda"]!.bytes, "quoted county size must be what is fetched")
    }

    @Test func entireBayAreaTierDownloadsEverything() throws {
        let cat = try catalog()
        let plan = cat.plan(for: .entireBayArea)
        #expect(plan.slugs.count == cat.jurisdictions.count)
        #expect(plan.bytes == cat.all.bytes)
    }

    @Test func decliningDownloadsNothing() throws {
        #expect(try catalog().plan(for: .none).isEmpty)
    }

    // MARK: honesty

    @Test func countyTierReportsPartialCoverage() throws {
        // Alameda has 15 jurisdictions; only 2 are scraped. A picker that hid
        // this would promise a county's worth of law and deliver two cities'.
        let alameda = try catalog().counties["alameda"]!
        #expect(alameda.available == 2)
        #expect(alameda.total == 15)
    }

    @Test func countyWithNoPacksIsStillVisibleAtZero() throws {
        let marin = try catalog().counties["marin"]!
        #expect(marin.available == 0)
        #expect(marin.bytes == 0)
    }

    @Test func unknownJurisdictionYieldsNothingRatherThanSomethingElse() throws {
        let cat = try catalog()
        #expect(cat.plan(for: .city("atlantis")).isEmpty)
        #expect(cat.plan(for: .county("nowhere")).isEmpty)
    }

    // MARK: deriving the county tier from a city

    @Test func countyIsDerivedFromTheCitySomeoneAlreadyPicked() throws {
        // Plenty of people cannot name their county off the top of their head,
        // so "my county" has to be offered without asking for it.
        let cat = try catalog()
        #expect(cat.countySlug(forCity: "Oakland") == "alameda")
        #expect(cat.countySlug(forCity: "Daly City") == "san-mateo")
        #expect(cat.countySlug(forCity: "Atlantis") == nil)
    }

    @Test func slugifyMatchesTheJSBuilder() {
        // These slugs are the pack filenames; if the two sides disagree, every
        // download 404s.
        #expect(OrdinanceCatalog.slugify("Daly City") == "daly-city")
        #expect(OrdinanceCatalog.slugify("St. Helena") == "st-helena")
        #expect(OrdinanceCatalog.slugify("Alameda County") == "alameda-county")
    }

    // MARK: compatibility

    @Test func manifestPublishedBeforeTheSplitStillDecodes() throws {
        // An app that refused a pre-split manifest would lock itself out of core
        // updates too.
        let legacy = #"{"version":1,"generated":"","minAppVersion":"0.0.0","minModelVersion":"0","files":{}}"#
        let m = try JSONDecoder().decode(KnowledgePackManifest.self, from: Data(legacy.utf8))
        #expect(m.ordinances == nil)
    }

    @Test func installedFilesOnlyCountsWhatIsOnDisk() throws {
        let cat = try catalog()
        let dir = FileManager.default.temporaryDirectory
            .appendingPathComponent("ord-test-\(UUID().uuidString)")
        try FileManager.default.createDirectory(
            at: dir.appendingPathComponent("ordinances"), withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: dir) }

        #expect(cat.installedFiles(in: dir).isEmpty)
        try Data("x".utf8).write(to: dir.appendingPathComponent("ordinances/oakland.sqlite"))
        #expect(cat.installedFiles(in: dir).count == 1)
    }
}
