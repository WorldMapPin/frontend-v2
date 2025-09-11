// Main clustering component that manages marker display and clustering
// This component uses Supercluster to efficiently cluster markers based on viewport
// and handles the rendering of both individual markers and cluster markers

import React, { useCallback, useEffect, useState } from 'react';
import Supercluster, { ClusterProperties } from 'supercluster';
import { ClusterMarker } from './ClusterMarker';
import { FeatureMarker } from './FeatureMarker';
import { useSupercluster } from '../../hooks/use-supercluster';
import { Feature, FeatureCollection, GeoJsonProperties, Point } from 'geojson';

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
};

// Supercluster configuration options
const superclusterOptions: Supercluster.Options<
  GeoJsonProperties,
  ClusterProperties
> = {
  extent: 256,
  radius: 60,
  maxZoom: 18,
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
}: ClusteredMarkersProps) => {
  const { clusters, getLeaves } = useSupercluster(geojson, superclusterOptions);

  // Update cluster count when clusters change
  useEffect(() => {
    setNumClusters(clusters.length);
    
    // Notify parent that clusters are ready
    if (onClustersReady && clusters.length > 0) {
      onClustersReady(clusters.length);
    }
  }, [setNumClusters, clusters.length, onClustersReady]);

  // Handle cluster click - show all markers in the cluster
  const handleClusterClick = useCallback((marker: google.maps.marker.AdvancedMarkerElement, clusterId: number) => {
    const leaves = getLeaves(clusterId);
    setInfowindowData({ anchor: marker, features: leaves });
  }, [getLeaves, setInfowindowData]);

  // Handle individual marker click - show single marker info
  const handleMarkerClick = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement, featureId: string) => {
      const feature = clusters.find(
        feat => feat.id === featureId
      ) as Feature<Point>;

      setInfowindowData({ anchor: marker, features: [feature] });
    },
    [clusters, setInfowindowData]
  );
  
  return (
    <>
      {clusters.map(feature => {
        const [lng, lat] = feature.geometry.coordinates;

        const clusterProperties = feature.properties as ClusterProperties;
        const isCluster: boolean = clusterProperties.cluster;
        
        return isCluster ? (
          <ClusterMarker
            key={feature.id}
            clusterId={clusterProperties.cluster_id}
            position={{ lat, lng }}
            size={clusterProperties.point_count}
            sizeAsText={String(clusterProperties.point_count_abbreviated)}
            onMarkerClick={handleClusterClick}
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
