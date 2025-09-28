// Script to fetch Distriator data and save it locally for faster development
// Run this with: node scripts/fetch-and-save-data.js

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'temp-distriator-data.json');

async function fetchAllDistriatorBusinesses() {
  const allStores = [];
  const mappedStores = [];
  const unmappedStores = [];
  let currentPage = 1;
  let hasNextPage = true;
  const pageSize = 20;

  console.log('🚀 Starting to fetch Distriator data...');

  try {
    // First, fetch all businesses
    while (hasNextPage) {
      console.log(`📄 Fetching page ${currentPage}...`);

      try {
        const response = await axios.get(
          `https://beta-api.distriator.com/business/paginated?page=${currentPage}&pageSize=${pageSize}`
        );

        const { data, pagination } = response.data;

        // Add all businesses to the complete list
        allStores.push(...data);

        // Separate mapped and unmapped businesses
        data.forEach(business => {
          if (business.location.pin.latitude &&
              business.location.pin.longitude &&
              business.location.pin.latitude !== 0 &&
              business.location.pin.longitude !== 0) {
            mappedStores.push(business);
          } else {
            unmappedStores.push(business);
          }
        });

        console.log(`✅ Page ${currentPage}: ${data.length} businesses (${mappedStores.length} mapped, ${unmappedStores.length} unmapped)`);

        hasNextPage = pagination.hasNextPage;
        currentPage++;

        // Add a small delay to avoid overwhelming the API
        if (hasNextPage) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (pageError) {
        console.error(`❌ Error fetching page ${currentPage}:`, pageError.message);
        if (axios.isAxiosError(pageError) && pageError.response?.status === 400) {
          console.log('🛑 Received 400 error, assuming we\'ve reached the end of data');
          break;
        }
        currentPage++;
        if (currentPage > 100) {
          console.log('🛑 Reached safety limit of 100 pages, stopping');
          break;
        }
      }
    }

    console.log(`\n📊 Fetch Summary:`);
    console.log(`   Total stores: ${allStores.length}`);
    console.log(`   Mapped stores: ${mappedStores.length}`);
    console.log(`   Unmapped stores: ${unmappedStores.length}`);

    // Now fetch reviews for mapped stores (in batches of 10)
    console.log('\n🔍 Fetching reviews for mapped stores...');
    const storeReviews = {};
    const reviewCounts = {};

    for (let i = 0; i < mappedStores.length; i += 10) {
      const batch = mappedStores.slice(i, i + 10);
      console.log(`📝 Fetching reviews for batch ${Math.floor(i/10) + 1} (stores ${i + 1}-${Math.min(i + 10, mappedStores.length)})`);

      for (const store of batch) {
        try {
          // Fetch review count
          const countResponse = await axios.get(
            `https://beta-api.distriator.com/review/paginated?business-id=${store.id}&page=1&pageSize=1`
          );
          const totalRecords = countResponse.data.pagination.totalRecords;
          reviewCounts[store.id] = totalRecords;

          // Fetch first 10 reviews
          if (totalRecords > 0) {
            const reviewsResponse = await axios.get(
              `https://beta-api.distriator.com/review/paginated?business-id=${store.id}&page=1&pageSize=10`
            );
            storeReviews[store.id] = reviewsResponse.data.data || [];
          } else {
            storeReviews[store.id] = [];
          }

          console.log(`   ✅ ${store.profile.displayName}: ${totalRecords} reviews`);
        } catch (error) {
          console.error(`   ❌ Error fetching reviews for ${store.profile.displayName}:`, error.message);
          reviewCounts[store.id] = 0;
          storeReviews[store.id] = [];
        }

        // Small delay between stores
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Delay between batches
      if (i + 10 < mappedStores.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const result = {
      mappedStores,
      unmappedStores,
      allStores,
      storeReviews,
      reviewCounts,
      lastUpdated: new Date().toISOString()
    };

    // Save to file
    const dataDir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(result, null, 2));
    console.log(`\n💾 Data saved to: ${DATA_FILE_PATH}`);
    console.log(`📁 File size: ${(fs.statSync(DATA_FILE_PATH).size / 1024 / 1024).toFixed(2)} MB`);

    return result;
  } catch (error) {
    console.error('❌ Error fetching Distriator data:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  fetchAllDistriatorBusinesses()
    .then(() => {
      console.log('\n🎉 Data fetching completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Data fetching failed:', error);
      process.exit(1);
    });
}

module.exports = { fetchAllDistriatorBusinesses };
