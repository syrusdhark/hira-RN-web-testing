//
// HealthModule.swift
// Add to your iOS app target after running: npx expo prebuild --platform ios
// Enable HealthKit capability in Xcode and add NSHealthShareUsageDescription / NSHealthUpdateUsageDescription to Info.plist.
//

import Foundation
import HealthKit

@objc(HealthModule)
class HealthModule: NSObject {

  private let healthStore = HKHealthStore()

  private func todayStartAndEnd() -> (start: Date, end: Date) {
    let now = Date()
    let start = Calendar.current.startOfDay(for: now)
    return (start, now)
  }

  @objc
  func getTodayHealthData(_ callback: @escaping (([Any]) -> Void)) {
    guard HKHealthStore.isHealthDataAvailable() else {
      callback([jsonString(steps: nil, sleepMinutes: nil, distanceMeters: nil, error: "health_data_unavailable")])
      return
    }

    let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
    let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)!
    let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis)!

    let typesToRead: Set<HKObjectType> = [stepType, distanceType, sleepType]
    healthStore.requestAuthorization(toShare: nil, read: typesToRead) { [weak self] success, _ in
      guard let self = self else { return }
      if !success {
        callback([self.jsonString(steps: nil, sleepMinutes: nil, distanceMeters: nil, error: "permission_denied")])
        return
      }
      self.queryTodayData(callback: callback)
    }
  }

  private func queryTodayData(callback: @escaping RCTResponseSenderBlock) {
    let (start, end) = todayStartAndEnd()
    let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)

    var stepsResult: Int?
    var distanceResult: Double?
    var sleepMinutesResult: Int?
    var queryError: String?
    let group = DispatchGroup()

    group.enter()
    let stepsType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
    let stepsQuery = HKStatisticsQuery(quantityType: stepsType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
      defer { group.leave() }
      if let err = error {
        queryError = err.localizedDescription
        return
      }
      stepsResult = result?.sumQuantity().map { Int($0.doubleValue(for: .count())) }
    }
    healthStore.execute(stepsQuery)

    group.enter()
    let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)!
    let distanceQuery = HKStatisticsQuery(quantityType: distanceType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
      defer { group.leave() }
      if error != nil { return }
      distanceResult = result?.sumQuantity().map { $0.doubleValue(for: .meter()) }
    }
    healthStore.execute(distanceQuery)

    group.enter()
    let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis)!
    let sleepQuery = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, error in
      defer { group.leave() }
      if error != nil { return }
      guard let categories = samples as? [HKCategorySample] else { return }
      let total = categories.reduce(0) { acc, s in
        acc + Int(s.endDate.timeIntervalSince(s.startDate) / 60)
      }
      if total > 0 { sleepMinutesResult = total }
    }
    healthStore.execute(sleepQuery)

    group.notify(queue: .main) { [weak self] in
      guard let self = self else { return }
      let steps: Int? = stepsResult
      let sleepMinutes: Int? = sleepMinutesResult
      let distanceMeters: Double? = distanceResult
      let err = queryError
      callback([self.jsonString(steps: steps, sleepMinutes: sleepMinutes, distanceMeters: distanceMeters, error: err)])
    }
  }

  private func jsonString(steps: Int?, sleepMinutes: Int?, distanceMeters: Double?, error: String?) -> String {
    var dict: [String: Any] = [:]
    dict["steps"] = steps as Any
    dict["sleepMinutes"] = sleepMinutes as Any
    dict["distanceMeters"] = distanceMeters as Any
    dict["error"] = error as Any
    if let data = try? JSONSerialization.data(withJSONObject: dict),
       let s = String(data: data, encoding: .utf8) {
      return s
    }
    return "{\"error\":\"invalid_data\"}"
  }
}
