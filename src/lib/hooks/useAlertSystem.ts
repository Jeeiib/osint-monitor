"use client";

import { useEffect } from "react";
import { useEarthquakeStore } from "@/lib/stores/earthquakeStore";
import { useEventsStore } from "@/lib/stores/eventsStore";
import { useSocialStore } from "@/lib/stores/socialStore";
import { useAlertStore } from "@/lib/stores/alertStore";

/**
 * Wires alert detection to data store changes.
 * Mount once in MainLayout — handles subscriptions and cleanup.
 */
export function useAlertSystem(): void {
  useEffect(() => {
    const { checkEarthquakes, checkEvents, checkSocialPosts, requestDesktopPermission } =
      useAlertStore.getState();

    // Request desktop notification permission on mount
    requestDesktopPermission();

    const unsubEarthquakes = useEarthquakeStore.subscribe(
      (state) => state.earthquakes,
      (earthquakes) => {
        if (earthquakes.length > 0) {
          checkEarthquakes(earthquakes);
        }
      }
    );

    const unsubEvents = useEventsStore.subscribe(
      (state) => state.events,
      (events) => {
        if (events.length > 0) {
          checkEvents(events);
        }
      }
    );

    const unsubSocial = useSocialStore.subscribe(
      (state) => state.posts,
      (posts) => {
        if (posts.length > 0) {
          checkSocialPosts(posts);
        }
      }
    );

    return () => {
      unsubEarthquakes();
      unsubEvents();
      unsubSocial();
    };
  }, []);
}
