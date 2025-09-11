// Custom hook for managing marker clustering using Supercluster
// This hook provides efficient clustering of map markers based on viewport
// and zoom level, improving performance when displaying large numbers of markers

import { FeatureCollection, GeoJsonProperties, Point } from 'geojson';
import Supercluster, { ClusterProperties } from 'supercluster';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { useMapViewport } from './use-map-viewport';

/**
 * Custom hook for managing marker clustering
 * Uses Supercluster library to efficiently cluster markers based on current viewport
 * Provides methods to expand clusters and get cluster details
 * 
 * @param geojson - GeoJSON data containing markers to cluster
 * @param superclusterOptions - Configuration options for the clustering algorithm
 * @returns Object containing clusters and cluster manipulation methods
 */
export function useSupercluster<T extends GeoJsonProperties>(
  geojson: FeatureCollection<Point, T>,
  superclusterOptions: Supercluster.Options<T, ClusterProperties>
) {
  // Create the clusterer instance and keep it stable
  const clusterer = useMemo(() => {
    return new Supercluster(superclusterOptions);
  }, [superclusterOptions]);

  // Version number for tracking data updates
  // This triggers cluster recalculation when data changes
  const [version, dataWasUpdated] = useReducer((x: number) => x + 1, 0);

  // Load data into clusterer when geojson changes
  useEffect(() => {
    clusterer.load(geojson.features);
    dataWasUpdated();
  }, [clusterer, geojson]);

  // Get current viewport bounds and zoom level
  const { bbox, zoom } = useMapViewport({ padding: 90 });

  // Calculate clusters within current viewport
  const clusters = useMemo(() => {
    // Don't calculate clusters before data is loaded
    if (!clusterer || version === 0) return [];

    return clusterer.getClusters(bbox, zoom);
  }, [version, clusterer, bbox, zoom]);

  // Callback to get child clusters of a given cluster
  const getChildren = useCallback(
    (clusterId: number) => clusterer.getChildren(clusterId),
    [clusterer]
  );

  // Callback to get all leaf markers in a cluster
  // Note: Paging is disabled as it has no significant performance impact
  // when used in click event handlers
  const getLeaves = useCallback(
    (clusterId: number) => clusterer.getLeaves(clusterId, Infinity),
    [clusterer]
  );

  // Callback to get the zoom level needed to expand a cluster
  const getClusterExpansionZoom = useCallback(
    (clusterId: number) => clusterer.getClusterExpansionZoom(clusterId),
    [clusterer]
  );

  return {
    clusters,
    getChildren,
    getLeaves,
    getClusterExpansionZoom
  };
}

