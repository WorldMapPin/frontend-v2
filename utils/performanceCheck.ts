// Performance checking utilities for device capability detection
// This module provides comprehensive performance testing to determine if a device
// is low-end and needs optimized data loading strategies

// Interface to extend Navigator with deviceMemory
export interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

// Store the network speed for external access
let networkSpeedKbps = 0;

/**
 * Gets the last measured network speed in Kbps
 * @returns number - The network speed in Kbps
 */
export function getNetworkSpeed(): number {
  return networkSpeedKbps;
}

/**
 * Checks if the device has an extremely slow connection (less than 2 Kbps)
 * @returns boolean - true if extremely slow, false otherwise
 */
export function isExtremelySlowConnection(): boolean {
  return networkSpeedKbps > 0 && networkSpeedKbps < 2;
}

/**
 * Checks if the device has a slow connection (less than 6 Kbps)
 * @returns boolean - true if slow, false otherwise
 */
export function isSlowConnection(): boolean {
  return networkSpeedKbps > 0 && networkSpeedKbps < 6;
}

/**
 * Comprehensive performance check to determine if the device is low-end
 * Tests network speed, device capabilities, and graphics performance
 * @returns Promise<boolean> - true if device is low-performance, false otherwise
 */
export function checkPerformance(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      // Running on server, assume high performance
      resolve(false);
      return;
    }

    // Set a default assumption for slower devices
    let isLowPerformance = false;
    let checksCompleted = 0;
    let totalChecks = 3; // Number of checks we plan to run

    // Helper function to mark a check as complete
    const checkComplete = () => {
      checksCompleted++;
      if (checksCompleted >= totalChecks) {
        // console.log(`Device performance assessment: ${isLowPerformance ? 'Low-end' : 'High-end'}`);
        resolve(isLowPerformance);
      }
    };

    // 1. Network Speed Test with Multiple Samples
    const runNetworkTest = () => {
      const downloadSizes = [0.05, 0.1, 0.2]; // Multiple file sizes in KB
      const downloadUrls = [
        'https://www.google.com/images/phd/px.gif',
        'https://www.google.com/favicon.ico'
      ];
      
      let speedSamples = 0;
      let totalSpeedKbps = 0;
      const samplesNeeded = 3; // Number of samples to collect
      
      const testSpeed = (url: string, size: number) => {
        const startTime = Date.now();
        const img = new Image();
        
        img.onload = function() {
          const endTime = Date.now();
          const duration = (endTime - startTime) / 1000; // in seconds
          if (duration > 0) { // avoid division by zero
            const bitsLoaded = size * 8; // Convert KB to Kb
            const speedKbps = (bitsLoaded / duration);
            
            totalSpeedKbps += speedKbps;
            speedSamples++;
            
            // console.log(`Speed sample ${speedSamples}: ${speedKbps.toFixed(2)} Kbps`);
            
            if (speedSamples >= samplesNeeded) {
              const averageSpeed = totalSpeedKbps / speedSamples;
              networkSpeedKbps = averageSpeed; // Store the speed for external access
              // console.log(`Average network speed: ${averageSpeed.toFixed(2)} Kbps`);
              
              console.log(averageSpeed)
              // If speed is less than 6 Kbps, consider it a low-performance device
              if (averageSpeed < 6) {
                isLowPerformance = true;
              }
              
              checkComplete();
            } else {
              // Try another URL/size combination
              const nextUrl = downloadUrls[speedSamples % downloadUrls.length];
              const nextSize = downloadSizes[speedSamples % downloadSizes.length];
              testSpeed(nextUrl, nextSize);
            }
          } else {
            // Try again with a different URL if duration was 0
            const nextUrl = downloadUrls[Math.floor(Math.random() * downloadUrls.length)];
            const nextSize = downloadSizes[Math.floor(Math.random() * downloadSizes.length)];
            testSpeed(nextUrl, nextSize);
          }
        };
        
        img.onerror = function() {
          console.warn(`Error loading test image from ${url}`);
          // Try a different URL
          const fallbackUrl = url === downloadUrls[0] ? downloadUrls[1] : downloadUrls[0];
          testSpeed(fallbackUrl, size);
        };
        
        // Set a random cache buster
        const cacheBuster = "?r=" + Math.random();
        img.src = url + cacheBuster;
      };
      
      // Start the first test
      testSpeed(downloadUrls[0], downloadSizes[0]);
      
      // Set a timeout in case tests don't complete
      setTimeout(() => {
        if (speedSamples < samplesNeeded) {
          // console.warn(`Network test timed out after collecting ${speedSamples} samples`);
          isLowPerformance = true; // Assume low performance if test times out
          checkComplete();
        }
      }, 8000);
    };

    // 2. CPU/Memory Performance Test
    const checkDeviceCapabilities = () => {
      const nav = navigator as NavigatorWithMemory;
      
      // Check for low memory (less than 4GB)
      if (nav.deviceMemory && nav.deviceMemory < 4) {
        // console.log(`Low memory device detected: ${nav.deviceMemory}GB RAM`);
        isLowPerformance = true;
      }
      
      // Check for low CPU cores (less than 4)
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        // console.log(`Low CPU device detected: ${navigator.hardwareConcurrency} cores`);
        isLowPerformance = true;
      }
      
      checkComplete();
    };

    // 3. Graphics/Animation Performance Test
    const checkGraphicsPerformance = () => {
      let startTime = performance.now();
      let frames = 0;
      const testDuration = 1000; // 1 second test
      
      // Function to count frames
      const countFrame = () => {
        frames++;
        const elapsed = performance.now() - startTime;
        
        if (elapsed < testDuration) {
          // Continue counting frames
          requestAnimationFrame(countFrame);
        } else {
          // Test complete
          const fps = (frames / (elapsed / 1000)).toFixed(1);
          // console.log(`Graphics performance: ${fps} FPS`);
          
          // If FPS is less than 30, consider it a low-performance device
          if (parseFloat(fps) < 30) {
            isLowPerformance = true;
          }
          
          checkComplete();
        }
      };
      
      // Start counting frames
      requestAnimationFrame(countFrame);
      
      // Set a timeout in case the test doesn't complete
      setTimeout(() => {
        if (frames === 0) {
          // console.warn('Graphics performance test timed out');
          isLowPerformance = true; // Assume low performance if test times out
          checkComplete();
        }
      }, testDuration + 1000);
    };

    // Run all tests in parallel
    runNetworkTest();
    checkDeviceCapabilities();
    checkGraphicsPerformance();
    
    // Overall timeout as a safety measure
    setTimeout(() => {
      if (checksCompleted < totalChecks) {
        // console.warn(`Performance check timed out after completing ${checksCompleted}/${totalChecks} checks`);
        resolve(true); // Assume low performance if overall timeout is hit
      }
    }, 10000);
  });
}

// Initialize performance check before app loads - improved approach
let isLowPerformanceDevice = false;
let performanceCheckPromise: Promise<boolean> | null = null;

/**
 * Initializes and returns the performance check promise
 * Ensures the check only runs once, even if called multiple times
 * @returns Promise<boolean> - resolves to true if device is low-performance
 */
export function initPerformanceCheck(): Promise<boolean> {
  if (!performanceCheckPromise) {
    console.log("Starting initial performance check...");
    performanceCheckPromise = checkPerformance().then(result => {
      isLowPerformanceDevice = result;
      // console.log(`Initial device assessment complete: ${isLowPerformanceDevice ? 'Low-performance' : 'High-performance'} device`);
      return result;
    }).catch(error => {
      console.error("Performance check failed:", error);
      return false; // Default to high performance if check fails
    });
  }
  return performanceCheckPromise;
}

// Start the check immediately (only in browser)
if (typeof window !== 'undefined') {
  initPerformanceCheck();
}

