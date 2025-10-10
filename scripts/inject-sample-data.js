// Sample data injection script
// Run this in the browser console to populate localStorage with sample data

const sampleData = {
  mappedStores: [
    {
      id: "sample-store-1",
      profile: {
        displayName: "Sample Store 1",
        displayImage: "https://images.hive.blog/600x0/https://images.hive.blog/DQmRRWwaQtb8Xdr6XYeX1hmm5LrGHWJ5yY5ZQUyrnhRV6of/sample-store-1.jpg",
        businessType: "Restaurant",
        workTime: "9:00 AM - 10:00 PM",
        isOnline: true,
        images: []
      },
      contact: {
        email: "contact@samplestore1.com",
        phone: "+1-555-0123",
        notes: "Great food and service"
      },
      location: {
        pin: {
          latitude: 40.7128,
          longitude: -74.0060
        },
        address: {
          address1: "123 Main Street",
          city: "New York",
          state: "NY",
          country: "USA"
        }
      }
    },
    {
      id: "sample-store-2",
      profile: {
        displayName: "Sample Store 2",
        displayImage: "https://images.hive.blog/600x0/https://images.hive.blog/DQmRRWwaQtb8Xdr6XYeX1hmm5LrGHWJ5yY5ZQUyrnhRV6of/sample-store-2.jpg",
        businessType: "Retail Shop",
        workTime: "10:00 AM - 8:00 PM",
        isOnline: false,
        images: []
      },
      contact: {
        email: "info@samplestore2.com",
        phone: "+1-555-0456",
        notes: "Quality products"
      },
      location: {
        pin: {
          latitude: 34.0522,
          longitude: -118.2437
        },
        address: {
          address1: "456 Oak Avenue",
          city: "Los Angeles",
          state: "CA",
          country: "USA"
        }
      }
    }
  ],
  unmappedStores: [
    {
      id: "unmapped-store-1",
      profile: {
        displayName: "Unmapped Store 1",
        displayImage: "",
        businessType: "Service",
        workTime: "24/7",
        isOnline: true,
        images: []
      },
      contact: {
        email: "service@unmapped.com",
        phone: "+1-555-0789",
        notes: "Online service only"
      },
      location: {
        pin: {
          latitude: 0,
          longitude: 0
        },
        address: {
          address1: "Online Only",
          city: "Virtual",
          state: "Digital",
          country: "Internet"
        }
      }
    }
  ],
  allStores: [],
  storeReviews: {
    "sample-store-1": [
      {
        id: "review-1",
        username: "john.doe",
        permlink: "great-food-review",
        photos: ["https://images.hive.blog/600x0/https://images.hive.blog/sample-food-photo.jpg"],
        reviewText: "Amazing food and great service!",
        reviewBody: "I had an excellent experience at this restaurant. The food was delicious and the staff was very friendly. Highly recommended!",
        totalValue: "25.50 HBD",
        invoiceId: "INV-001",
        created: "2024-01-15T12:00:00Z",
        reviewStatus: "visible",
        modifiedAt: "2024-01-15T12:00:00Z"
      },
      {
        id: "review-2",
        username: "jane.smith",
        permlink: "wonderful-experience",
        photos: [],
        reviewText: "Perfect place for dinner!",
        reviewBody: "The ambiance was great and the food was outstanding. Will definitely come back again.",
        totalValue: "18.75 HBD",
        invoiceId: "INV-002",
        created: "2024-01-14T18:30:00Z",
        reviewStatus: "visible",
        modifiedAt: "2024-01-14T18:30:00Z"
      }
    ],
    "sample-store-2": [
      {
        id: "review-3",
        username: "mike.wilson",
        permlink: "great-shopping",
        photos: ["https://images.hive.blog/600x0/https://images.hive.blog/sample-product-photo.jpg"],
        reviewText: "Found exactly what I needed!",
        reviewBody: "Great selection of products and helpful staff. The quality is excellent.",
        totalValue: "45.00 HBD",
        invoiceId: "INV-003",
        created: "2024-01-13T14:20:00Z",
        reviewStatus: "visible",
        modifiedAt: "2024-01-13T14:20:00Z"
      }
    ]
  },
  reviewCounts: {
    "sample-store-1": 2,
    "sample-store-2": 1,
    "unmapped-store-1": 0
  },
  lastUpdated: new Date().toISOString()
};

// Combine all stores
sampleData.allStores = [...sampleData.mappedStores, ...sampleData.unmappedStores];

// Inject into localStorage
localStorage.setItem('temp_distriator_data', JSON.stringify(sampleData));

console.log('✅ Sample data injected into localStorage!');
console.log('📊 Data contains:');
console.log(`   - ${sampleData.allStores.length} total stores`);
console.log(`   - ${sampleData.mappedStores.length} mapped stores`);
console.log(`   - ${sampleData.unmappedStores.length} unmapped stores`);
console.log(`   - ${Object.keys(sampleData.storeReviews).length} stores with reviews`);
console.log('🔄 Refresh the page to see the data in action!');
