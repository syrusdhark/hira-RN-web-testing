//
// HealthModule.m
// Objective-C bridge for HealthModule (Swift). Add to your iOS app target with HealthModule.swift.
// In Xcode: File > Add Files to "<YourTarget>" and add both HealthModule.m and HealthModule.swift.
// Ensure the target's Build Phases > Compile Sources includes both files.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HealthModule, NSObject)

RCT_EXTERN_METHOD(getTodayHealthData:(RCTResponseSenderBlock)callback)

@end
