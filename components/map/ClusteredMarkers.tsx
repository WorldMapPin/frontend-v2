// Main clustering component that manages marker display and clustering
// This component uses Supercluster to efficiently cluster markers based on viewport
// and handles the rendering of both individual markers and cluster markers

import React, { useCallback, useEffect, useState } from 'react';
import Supercluster, { ClusterProperties } from 'supercluster';
import { ClusterMarker } from './ClusterMarker';
import { FeatureMarker } from './FeatureMarker';
import { StoreMarker } from './community/StoreMarker';
import { StoreClusterMarker } from './community/StoreClusterMarker';
import { FoodMarker } from './community/FoodMarker';
import { FoodClusterMarker } from './community/FoodClusterMarker';
import { useSupercluster } from '../../hooks/use-supercluster';
import { Feature, FeatureCollection, GeoJsonProperties, Point } from 'geojson';
import { Community } from '../../types';
import { groupPinsByCoordinates } from '../../utils/coordinateGrouping';

// Determine minimum zoom level based on screen size
let minZoom = 2;
if (typeof window !== 'undefined' && window.innerWidth < 800) {  
  minZoom = 2;
}

type ClusteredMarkersProps = {
  geojson: FeatureCollection<Point>;
  setNumClusters: (n: number) => void;
  setInfowindowData: (
    data: {
      anchor: google.maps.marker.AdvancedMarkerElement;
      features: Feature<Point>[];
    } | null
  ) => void;
  currentZoom?: number;
  onClustersReady?: (clusterCount: number) => void;
  community?: Community;
};

// Supercluster configuration options
const superclusterOptions: Supercluster.Options<
  GeoJsonProperties,
  ClusterProperties
> = {
  extent: 256,
  radius: 60,
  maxZoom: 20, // Increased to ensure individual markers are visible at very high zoom levels
  minZoom: minZoom
};

/**
 * Main clustering component for map markers
 * Manages the clustering of markers using Supercluster algorithm
 * Renders either individual markers or cluster markers based on zoom level and density
 * Handles click events for both individual markers and clusters
 * 
 * @param geojson - GeoJSON data containing all markers to be clustered
 * @param setNumClusters - Callback to update the number of visible clusters
 * @param setInfowindowData - Callback to show info window with marker data
 */
export const ClusteredMarkers = ({
  geojson,
  setNumClusters,
  setInfowindowData,
  currentZoom = 3,
  onClustersReady,
  community,
}: ClusteredMarkersProps) => {
  // For SpendHBD community, group pins by exact coordinates first
  const processedGeojson = React.useMemo(() => {
    if (community?.id === 'spendhbd') {
      const groupedPins = groupPinsByCoordinates(geojson.features);
      
      // Convert grouped pins back to GeoJSON format
      const groupedFeatures = groupedPins.map(group => ({
        type: "Feature" as const,
        id: group.id,
        geometry: {
          type: "Point" as const,
          coordinates: group.coordinates
        },
        properties: {
          ...group.features[0].properties,
          groupedCount: group.count,
          groupedFeatures: group.features,
          // Store original feature IDs for API calls
          originalFeatureIds: group.features.map(f => f.id)
        }
      }));
      
      return {
        type: "FeatureCollection" as const,
        features: groupedFeatures
      };
    }
    return geojson;
  }, [geojson, community]);

  const { clusters, getLeaves } = useSupercluster(processedGeojson, superclusterOptions);

  // Update cluster count when clusters change
  useEffect(() => {
    setNumClusters(clusters.length);
    
    // Notify parent that clusters are ready (even if empty, to signal data has been processed)
    if (onClustersReady) {
      onClustersReady(clusters.length);
    }
  }, [setNumClusters, clusters.length, onClustersReady]);

  // Handle cluster click - show all markers in the cluster
  const handleClusterClick = useCallback((marker: google.maps.marker.AdvancedMarkerElement, clusterId: number) => {
    const leaves = getLeaves(clusterId);
    
    // For SpendHBD community, show cluster info instead of individual markers
    if (community?.id === 'spendhbd') {
      setInfowindowData({ anchor: marker, features: leaves, isCluster: true });
    } else {
      setInfowindowData({ anchor: marker, features: leaves });
    }
  }, [getLeaves, setInfowindowData, community]);

  // Handle individual marker click - show single marker info
  const handleMarkerClick = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement, featureId: string) => {
      const feature = clusters.find(
        feat => feat.id === featureId
      ) as Feature<Point>;

      // For SpendHBD community, if this is a grouped feature, show the grouped feature (not the individual features)
      if (community?.id === 'spendhbd' && feature.properties?.groupedFeatures) {
        setInfowindowData({ anchor: marker, features: [feature] });
      } else {
        setInfowindowData({ anchor: marker, features: [feature] });
      }
    },
    [clusters, setInfowindowData, community]
  );
  
  return (
    <>
      {clusters.map(feature => {
        const [lng, lat] = feature.geometry.coordinates;

        const clusterProperties = feature.properties as ClusterProperties;
        const isCluster: boolean = clusterProperties.cluster;
        
        return isCluster ? (
          community?.id === 'spendhbd' ? (
            <StoreClusterMarker
              key={feature.id}
              clusterId={clusterProperties.cluster_id}
              position={{ lat, lng }}
              size={clusterProperties.point_count}
              sizeAsText={String(clusterProperties.point_count_abbreviated)}
              onMarkerClick={handleClusterClick}
            />
          ) : community?.id === 'foodie' ? (
            <FoodClusterMarker
              key={feature.id}
              clusterId={clusterProperties.cluster_id}
              position={{ lat, lng }}
              size={clusterProperties.point_count}
              sizeAsText={String(clusterProperties.point_count_abbreviated)}
              onMarkerClick={handleClusterClick}
            />
          ) : (
            <ClusterMarker
              key={feature.id}
              clusterId={clusterProperties.cluster_id}
              position={{ lat, lng }}
              size={clusterProperties.point_count}
              sizeAsText={String(clusterProperties.point_count_abbreviated)}
              onMarkerClick={handleClusterClick}
            />
          )
        ) : community?.id === 'spendhbd' ? (
          <StoreMarker
            key={feature.id}
            featureId={feature.id as string}
            position={{ lat, lng }}
            count={feature.properties?.groupedCount || 1}
            reviewCount={feature.properties?.reviewCount || 0}
            onMarkerClick={handleMarkerClick}
          />
        ) : community?.id === 'foodie' ? (
          <FoodMarker
            key={feature.id}
            featureId={feature.id as string}
            position={{ lat, lng }}
            count={1}
            onMarkerClick={handleMarkerClick}
          />
        ) : (
          <FeatureMarker
            key={feature.id}
            featureId={feature.id as string}
            position={{ lat, lng }}
            onMarkerClick={handleMarkerClick}
          />
        );
      })}
    </>
  );
};
