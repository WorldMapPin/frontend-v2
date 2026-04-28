"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAiohaSafe } from "@/hooks/use-aioha-safe";
import { useTheme } from "../ThemeProvider";
import {
  setGlobalLocation,
  setGlobalZoom,
  toggleGlobalCodeMode,
} from "./map-global-controls";

export default function MapNavbar() {
  const { user, isReady, logout } = useAiohaSafe();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [pinCount] = useState(142194);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Autocomplete state (proxied through /api/places/autocomplete)
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipAutocompleteRef = useRef(false);
  const sessionTokenRef = useRef<any>(null);
  const requestTimestampsRef = useRef<number[]>([]);
  const resultCacheRef = useRef<Map<string, any[]>>(new Map());
  const [budgetExhausted, setBudgetExhausted] = useState(false);

  // User menu state
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Debounced autocomplete via backend proxy
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (skipAutocompleteRef.current) {
      skipAutocompleteRef.current = false;
      return;
    }

    if (!searchValue || searchValue.length < 3) {
      setPredictions([]);
      setIsDropdownOpen(false);
      setIsSearching(false);
      setBudgetExhausted(false);
      return;
    }

    const cacheKey = searchValue.toLowerCase().trim();
    const cached = resultCacheRef.current.get(cacheKey);
    if (cached) {
      setPredictions(cached);
      setIsDropdownOpen(true);
      setHighlightedIndex(-1);
      setIsSearching(false);
      setBudgetExhausted(false);
      return;
    }

    const now = Date.now();
    const recentRequests = requestTimestampsRef.current.filter(
      (t) => t > now - 60000,
    );
    requestTimestampsRef.current = recentRequests;
    if (recentRequests.length >= 10) {
      setBudgetExhausted(true);
      setIsSearching(false);
      return;
    }
    setBudgetExhausted(false);

    setIsSearching(true);
    let cancelled = false;

    debounceRef.current = setTimeout(async () => {
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = crypto.randomUUID();
        }
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: searchValue,
            sessionToken: sessionTokenRef.current,
          }),
        });

        if (cancelled) return;

        if (res.status === 429) {
          setBudgetExhausted(true);
          setIsSearching(false);
          return;
        }

        if (!res.ok) {
          setIsSearching(false);
          setPredictions([]);
          return;
        }

        const data = await res.json();
        const placePredictions = data.suggestions || [];

        if (resultCacheRef.current.size >= 20) {
          const firstKey = resultCacheRef.current.keys().next().value;
          if (firstKey) resultCacheRef.current.delete(firstKey);
        }
        resultCacheRef.current.set(cacheKey, placePredictions);
        requestTimestampsRef.current.push(Date.now());

        setPredictions(placePredictions);
        setIsDropdownOpen(true);
        setHighlightedIndex(-1);
        setIsSearching(false);
      } catch {
        if (!cancelled) {
          setIsSearching(false);
          setPredictions([]);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchValue]);

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleSelectPlace = async (prediction: any) => {
    skipAutocompleteRef.current = true;
    setSearchValue(prediction.mainText || "");
    setIsDropdownOpen(false);
    setPredictions([]);
    setHighlightedIndex(-1);

    const placeId = prediction.placeId;
    const fallbackText = prediction.mainText || prediction.secondaryText || "";

    try {
      if (placeId && window.google?.maps?.places) {
        const { Place } = (await (google.maps as any).importLibrary(
          "places",
        )) as { Place: any };
        const place = new Place({ id: placeId });
        await place.fetchFields({
          fields: ["location", "displayName", "formattedAddress"],
        });
        const lat = place.location?.lat();
        const lng = place.location?.lng();
        if (lat != null && lng != null) {
          setGlobalLocation({
            location: { lat, lng },
            name: place.formattedAddress || place.displayName || "",
          });
          setGlobalZoom(12);
          sessionTokenRef.current = null;
          return;
        }
      }
      throw new Error("Place lookup failed");
    } catch {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: fallbackText }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const { location } = results[0].geometry;
          setGlobalLocation({
            location: { lat: location.lat(), lng: location.lng() },
            name: results[0].formatted_address,
          });
          setGlobalZoom(12);
        }
      });
    }

    sessionTokenRef.current = null;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlightedIndex >= 0 && predictions[highlightedIndex]) {
      handleSelectPlace(predictions[highlightedIndex]);
      return;
    }
    if (!searchValue) return;

    skipAutocompleteRef.current = true;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchValue }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const { location } = results[0].geometry;
        setGlobalLocation({
          location: { lat: location.lat(), lng: location.lng() },
          name: results[0].formatted_address,
        });
        setGlobalZoom(12);
      }
    });
    setIsDropdownOpen(false);
    setPredictions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < predictions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : predictions.length - 1,
      );
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const clearSearch = () => {
    setSearchValue("");
    setPredictions([]);
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-md border-b flex items-center justify-between px-3 sm:px-6 h-12 sm:h-14 md:h-16 shadow-sm font-lexend transition-colors duration-300"
        style={{
          backgroundColor: "var(--navbar-bg)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Left: Logo */}
        <div className="flex items-center flex-shrink-0">
          <Link href={user ? "/map" : "/"} className="flex items-center space-x-2">
            <Image
              src="/images/worldmappin-logo.png"
              alt="WorldMappin"
              width={32}
              height={32}
              className="w-7 h-7 sm:w-8 sm:h-8"
            />
            <div className="hidden sm:flex flex-col">
              <span
                className="text-base sm:text-lg font-bold leading-none"
                style={{ color: "var(--text-primary)" }}
              >
                World<span className="text-[#ED6D28]">Map</span>Pin
              </span>
              <span className="text-[10px] sm:text-xs text-[#ED6D28] font-medium leading-none mt-0.5">
                Found {pinCount.toLocaleString()} Pins
              </span>
            </div>
          </Link>
        </div>

        <div
          className="flex flex-1 max-w-md mx-2 sm:mx-4 relative"
          ref={searchContainerRef}
        >
          <form onSubmit={handleSearch} className="relative w-full">
            <div
              className="flex items-center w-full rounded-full px-3 sm:px-4 h-9 sm:h-10 transition-colors duration-200"
              style={{ backgroundColor: "var(--section-bg)" }}
            >
              {isSearching ? (
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0 animate-spin"
                  style={{ color: "#ED6D28" }}
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth={4}
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0"
                  style={{ color: "var(--text-muted)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
              <input
                ref={inputRef}
                type="text"
                placeholder="Find a Place"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => {
                  if (predictions.length > 0) setIsDropdownOpen(true);
                }}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 w-full text-xs sm:text-sm p-0 placeholder:text-[var(--text-muted)]"
                style={{ color: "var(--text-primary)" }}
                autoComplete="off"
                role="combobox"
                aria-expanded={isDropdownOpen}
                aria-autocomplete="list"
                aria-controls="places-autocomplete-list"
                aria-activedescendant={
                  highlightedIndex >= 0
                    ? `place-option-${highlightedIndex}`
                    : undefined
                }
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="mr-1 p-0.5 rounded-full hover:opacity-70 transition-opacity flex-shrink-0"
                  style={{ color: "var(--text-muted)" }}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={toggleGlobalCodeMode}
                className="absolute right-1 top-1 bottom-1 w-7 h-7 sm:w-8 sm:h-8 bg-[#ED6D28] rounded-full flex items-center justify-center text-white shadow-sm hover:bg-[#D95D20] transition-colors"
                title="Get Location Code"
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {(isDropdownOpen || budgetExhausted) && (
            <div
              id="places-autocomplete-list"
              role="listbox"
              className="absolute top-full left-0 right-0 mt-1.5 rounded-xl shadow-xl border overflow-hidden z-[200] animate-in fade-in slide-in-from-top-1 duration-150"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--border-subtle)",
              }}
            >
              {budgetExhausted ? (
                <div className="px-4 py-3 text-center">
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Try again shortly
                  </p>
                </div>
              ) : predictions.length > 0 ? (
                <ul className="py-1">
                  {predictions.map((prediction: any, index: number) => (
                    <li
                      key={prediction.placeId || index}
                      id={`place-option-${index}`}
                      role="option"
                      aria-selected={highlightedIndex === index}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                      style={{
                        backgroundColor:
                          highlightedIndex === index
                            ? "var(--section-bg)"
                            : "transparent",
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectPlace(prediction);
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "var(--section-bg)" }}
                      >
                        <svg
                          className="w-4 h-4"
                          style={{ color: "#ED6D28" }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {prediction.mainText || ""}
                        </p>
                        {prediction.secondaryText && (
                          <p
                            className="text-xs truncate"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {prediction.secondaryText}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : !isSearching ? (
                <div className="px-4 py-3 text-center">
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No places found
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right: Desktop Links and Actions */}
        <div className="flex items-center space-x-1 sm:space-x-4">
          <div
            className="hidden lg:flex items-center space-x-6 font-medium text-sm mr-4"
            style={{ color: "var(--text-secondary)" }}
          >
            <Link href={user ? "/map" : "/"} className="hover:text-[#ED6D28] transition-colors">
              Home
            </Link>
            <Link
              href="/explore"
              className="hover:text-[#ED6D28] transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/leaderboard"
              className="hover:text-[#0ea5e9] transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href={`/map/@${user || ""}`}
              className="hover:text-[#ED6D28] transition-colors"
            >
              My Map
            </Link>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-colors hidden sm:block hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {/* Desktop User profile */}
          {isReady && user && (
            <div className="hidden sm:block relative" ref={userMenuRef}>
              <button
                onClick={toggleUserMenu}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#ED6D28] p-[2px] transition-transform active:scale-95 focus:outline-none"
              >
                <div
                  className="w-full h-full rounded-full overflow-hidden border-2 relative"
                  style={{
                    borderColor: "var(--card-bg)",
                    backgroundColor: "var(--card-bg)",
                  }}
                >
                  <Image
                    src={`https://images.ecency.com/u/${user}/avatar`}
                    alt={user}
                    fill
                    className="object-cover"
                  />
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl py-2 z-50 border animate-in fade-in zoom-in-95 duration-100 origin-top-right"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <div
                    className="px-4 py-2 border-b"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Signed in as
                    </p>
                    <p
                      className="text-sm font-bold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      @{user}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href={`/@${user}`}
                      className="block px-4 py-2 text-sm hover:text-orange-600 transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                      onClick={() => setShowUserMenu(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      href={`/map/@${user}`}
                      className="block px-4 py-2 text-sm hover:text-orange-600 transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                      onClick={() => setShowUserMenu(false)}
                    >
                      My Map
                    </Link>
                    <Link
                      href="/my-countries"
                      className="block px-4 py-2 text-sm hover:text-orange-600 transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                      onClick={() => setShowUserMenu(false)}
                    >
                      My Countries
                    </Link>
                    <Link
                      href="/explore"
                      className="block px-4 py-2 text-sm hover:text-orange-600 transition-colors lg:hidden"
                      style={{ color: "var(--text-secondary)" }}
                      onClick={() => setShowUserMenu(false)}
                    >
                      Explore
                    </Link>
                    <Link
                      href="/leaderboard"
                      className="block px-4 py-2 text-sm hover:text-sky-600 transition-colors lg:hidden"
                      style={{ color: "var(--text-secondary)" }}
                      onClick={() => setShowUserMenu(false)}
                    >
                      Leaderboard
                    </Link>
                  </div>

                  <div
                    className="border-t mt-1 pt-1"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        router.push("/");
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 font-medium transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 sm:p-2 lg:hidden rounded-full transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar Menu */}
      <div
        className={`fixed inset-0 z-[110] lg:hidden transition-all duration-300 ${isMobileMenuOpen ? "opacity-100 pointer-events-auto bg-black/40 backdrop-blur-sm" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`absolute top-0 right-0 h-screen w-72 shadow-2xl transition-transform duration-300 transform ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"} font-lexend`}
          style={{ backgroundColor: "var(--card-bg)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 flex flex-col h-full overflow-y-auto">
            {/* Header of Sidebar */}
            <div
              className="flex items-center justify-between mb-8 pb-4 border-b"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div className="flex items-center space-x-3">
                {isReady && user ? (
                  <>
                    <div className="w-11 h-11 rounded-full border-2 border-[#ED6D28] overflow-hidden relative shadow-sm">
                      <Image
                        src={`https://images.ecency.com/u/${user}/avatar`}
                        alt={user}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span
                        className="font-bold leading-none"
                        style={{ color: "var(--text-primary)" }}
                      >
                        @{user}
                      </span>
                      <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mt-1">
                        Explorer
                      </span>
                    </div>
                  </>
                ) : (
                  <span
                    className="font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Menu
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{
                  backgroundColor: "var(--section-bg)",
                  color: "var(--text-muted)",
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1 flex-1">
              <Link
                href={user ? "/map" : "/"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between p-4 rounded-xl font-bold transition-all border border-transparent hover:border-orange-100"
                style={{ color: "var(--text-secondary)" }}
              >
                <span>Home</span>
                <svg
                  className="w-4 h-4 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <Link
                href="/explore"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between p-4 rounded-xl font-bold transition-all border border-transparent hover:border-orange-100"
                style={{ color: "var(--text-secondary)" }}
              >
                <span>Explore</span>
                <svg
                  className="w-4 h-4 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <Link
                href="/leaderboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between p-4 rounded-xl font-bold transition-all border border-transparent hover:border-sky-100"
                style={{ color: "var(--text-secondary)" }}
              >
                <span>Leaderboard</span>
                <svg
                  className="w-4 h-4 text-sky-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <Link
                href={`/map/@${user || ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between p-4 rounded-xl font-bold transition-all border border-transparent hover:border-orange-100"
                style={{ color: "var(--text-secondary)" }}
              >
                <span>My Map</span>
                <svg
                  className="w-4 h-4 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>

              <div className="pt-4 mt-2">
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl font-bold transition-all"
                  style={{
                    backgroundColor: "var(--section-bg)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  {theme === "dark" ? (
                    <svg
                      className="w-5 h-5 text-amber-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464l-.707-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414zm2.12 10.607a1 1 0 010-1.414l.706-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Footer section of Sidebar */}
            <div
              className="mt-auto pt-6 border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              {user && (
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full p-4 rounded-xl bg-red-50 text-red-600 font-bold transition-all flex items-center justify-center shadow-sm"
                >
                  Log out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
