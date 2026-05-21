"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";
import LocationList from "@/components/location-list";
import {
  DEFAULT_MAP_CENTER,
  EXAM_TYPES,
  LOCATION_FILTERS,
} from "@/lib/constants";
import { loadCenterCoordinates } from "@/lib/center-coordinates";
import { fetchCenters, fetchExamSchedules } from "@/lib/client-api";
import { calculateHaversineDistance } from "@/lib/distance";
import type { ApiCenterInfo, Coordinates, ExamSchedule, Location } from "@/lib/types";

const CENTER_COORDINATES_PATH =
  process.env.NEXT_PUBLIC_TOEIC_CENTER_COORDINATES_PATH ?? "/toeic_centers.csv";

const DynamicMap = dynamic(() => import("@/components/map-client"), {
  ssr: false,
  loading: () => <MapLoading>지도를 불러오는 중...</MapLoading>,
});

const AppContainer = styled.div`
  display: flex;
  min-height: 100dvh;
  width: 100%;

  @media (max-width: 960px) {
    flex-direction: column;
  }
`;

const ListContainer = styled.aside`
  width: 320px;
  padding: 20px;
  background-color: #f5f5f5;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;

  @media (max-width: 960px) {
    width: 100%;
    height: auto;
    max-height: 55dvh;
    border-right: 0;
    border-bottom: 1px solid #ddd;
  }
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const MapContainer = styled.section`
  flex: 1;
  min-height: 45dvh;
  height: 100dvh;

  @media (max-width: 960px) {
    height: 45dvh;
  }
`;

const PageHeading = styled.h2`
  margin: 0 0 12px;
  font-size: 1.3rem;
  color: #111827;
`;

const StatusText = styled.p`
  margin: 0 0 16px;
  color: #4b5563;
  font-size: 0.92rem;
  line-height: 1.5;
`;

const ErrorDisplay = styled.div`
  color: #b91c1c;
  padding: 12px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const HiddenStatus = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;

const MapLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #4b5563;
  background: #f8fafc;
`;

const buildLocations = (
  centers: ApiCenterInfo[],
  centerCoordinates: Map<string, Coordinates>,
  selectedExamType: string,
  selectedExamDate: string,
  selectedLocationFilter: string,
): Location[] =>
  centers.reduce<Location[]>((allLocations, centerInfo) => {
    const centerCode = centerInfo.center_code;

    if (!centerCode) {
      return allLocations;
    }

    const coordinates = centerCoordinates.get(centerCode);
    const lat = coordinates?.lat ?? 0;
    const lng = coordinates?.lng ?? 0;

    allLocations.push({
      id: centerCode,
      name: centerInfo.center_name,
      address: centerInfo.address,
      lat,
      lng,
      examType: selectedExamType,
      examDate: selectedExamDate,
      location: selectedLocationFilter,
    });

    return allLocations;
  }, []);

interface ToeicCenterFinderClientProps {
  initialExamDate?: string;
  initialLocationFilter?: string;
}

export default function ToeicCenterFinderClient({
  initialExamDate = "",
  initialLocationFilter = "",
}: ToeicCenterFinderClientProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [examDates, setExamDates] = useState<string[]>([]);
  const [selectedExamType, setSelectedExamType] = useState(EXAM_TYPES[0]);
  const [selectedExamDate, setSelectedExamDate] = useState(initialExamDate);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState(
    initialLocationFilter,
  );
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [sortedLocations, setSortedLocations] = useState<Location[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_MAP_CENTER);
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isLoadingCenters, setIsLoadingCenters] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [centerCoordinates, setCenterCoordinates] = useState<Map<string, Coordinates> | null>(
    null,
  );

  const allFiltersSelected =
    selectedExamType !== "" &&
    selectedExamDate !== "" &&
    selectedLocationFilter !== "";

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingData(true);

      try {
        const coordinates = await loadCenterCoordinates(CENTER_COORDINATES_PATH);
        setCenterCoordinates(coordinates);
      } catch (loadError) {
        console.error("Failed to load center coordinates:", loadError);
        setError("시험장 좌표 데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoadingData(false);
      }
    };

    void loadInitialData();
  }, []);

  useEffect(() => {
    const loadSchedules = async () => {
      if (selectedExamType !== "토익") {
        setExamSchedules([]);
        setExamDates([]);
        return;
      }

      setIsLoadingSchedules(true);
      setError(null);

      try {
        const schedules = await fetchExamSchedules();
        const uniqueDates = Array.from(
          new Set(schedules.map((schedule) => schedule.exam_day)),
        ).sort();

        setExamSchedules(schedules);
        setExamDates(uniqueDates);
      } catch (scheduleError) {
        console.error("시험 일정을 가져오는 중 오류 발생:", scheduleError);
        setError("시험 일정을 불러오는 데 실패했습니다.");
        setExamSchedules([]);
        setExamDates([]);
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    void loadSchedules();
  }, [selectedExamType]);

  useEffect(() => {
    const loadCentersForFilters = async () => {
      if (!allFiltersSelected || centerCoordinates === null) {
        setLocations([]);
        return;
      }

      const selectedSchedule = examSchedules.find(
        (schedule) => schedule.exam_day === selectedExamDate,
      );

      if (!selectedSchedule) {
        setError("선택된 날짜의 시험 정보를 찾을 수 없습니다.");
        setLocations([]);
        return;
      }

      setIsLoadingCenters(true);
      setError(null);
      setLocations([]);

      try {
        const fetchedCenters = await fetchCenters(
          selectedSchedule.exam_code,
          selectedLocationFilter,
        );

        setLocations(
          buildLocations(
            fetchedCenters,
            centerCoordinates,
            selectedExamType,
            selectedExamDate,
            selectedLocationFilter,
          ),
        );
      } catch (centerError) {
        console.error("시험 센터 정보를 가져오는 중 오류 발생:", centerError);
        setError("시험 센터 정보를 불러오는 데 실패했습니다.");
        setLocations([]);
      } finally {
        setIsLoadingCenters(false);
      }
    };

    if ((examSchedules.length > 0 || !isLoadingSchedules) && !isLoadingData) {
      void loadCentersForFilters();
    }

    setSelectedLocation(null);
    setSortedLocations([]);
  }, [
    allFiltersSelected,
    centerCoordinates,
    examSchedules,
    isLoadingData,
    isLoadingSchedules,
    selectedExamDate,
    selectedExamType,
    selectedLocationFilter,
  ]);

  useEffect(() => {
    if (userLocation && locations.length > 0) {
      const locationsWithDistance = locations
        .map((location) => ({
          ...location,
          distance: calculateHaversineDistance(
            userLocation.lat,
            userLocation.lng,
            location.lat,
            location.lng,
          ),
        }))
        .sort((locationA, locationB) => {
          if (
            locationA.distance === Number.POSITIVE_INFINITY &&
            locationB.distance === Number.POSITIVE_INFINITY
          ) {
            return 0;
          }

          if (locationA.distance === Number.POSITIVE_INFINITY) {
            return 1;
          }

          if (locationB.distance === Number.POSITIVE_INFINITY) {
            return -1;
          }

          return (locationA.distance ?? 0) - (locationB.distance ?? 0);
        });

      setSortedLocations(locationsWithDistance);
      return;
    }

    if (!userLocation) {
      setSortedLocations([]);
    }
  }, [locations, userLocation]);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);

    if (location.lat !== 0 && location.lng !== 0) {
      setMapCenter([location.lat, location.lng]);
    }
  };

  const handleUserLocationChange = (location: Coordinates | null) => {
    setUserLocation(location);

    if (location) {
      setMapCenter([location.lat, location.lng]);
      return;
    }

    setMapCenter(DEFAULT_MAP_CENTER);
    setSortedLocations([]);
  };

  const displayLocations = allFiltersSelected
    ? userLocation
      ? sortedLocations
      : locations
    : [];

  const isLoading = isLoadingData || isLoadingSchedules || isLoadingCenters;

  return (
    <AppContainer>
      <ListContainer>
        {error ? (
          <ErrorDisplay role="alert" data-testid="app-error">
            {error}
          </ErrorDisplay>
        ) : null}

        <ScrollableContent>
          <PageHeading>내 근처 토익 시험장 찾기</PageHeading>
          <StatusText>
            시험 일정과 지역을 선택하면 시험장을 확인할 수 있고, 현재 위치를
            사용하면 가까운 순으로 정렬됩니다.
          </StatusText>

          <LocationList
            locations={displayLocations}
            selectedLocation={selectedLocation}
            onLocationSelect={handleLocationSelect}
            examTypes={EXAM_TYPES}
            examDates={examDates}
            locationFilters={LOCATION_FILTERS}
            selectedExamType={selectedExamType}
            selectedExamDate={selectedExamDate}
            selectedLocationFilter={selectedLocationFilter}
            onExamTypeChange={(examType) => {
              setSelectedExamType(examType);
              setSelectedExamDate("");
              setSelectedLocationFilter("");
            }}
            onExamDateChange={(examDate) => {
              setSelectedExamDate(examDate);
              setSelectedLocationFilter("");
            }}
            onLocationFilterChange={setSelectedLocationFilter}
            onUserLocationChange={handleUserLocationChange}
            allFiltersSelected={allFiltersSelected}
            isLocationLoading={isLoading}
          />
        </ScrollableContent>
      </ListContainer>

      <MapContainer>
        <DynamicMap
          locations={displayLocations}
          center={mapCenter}
          userLocation={userLocation}
          selectedLocation={selectedLocation}
          onMarkerClick={handleLocationSelect}
        />
      </MapContainer>

      <HiddenStatus data-testid="selected-location-name">
        {selectedLocation?.name ?? "선택된 시험장 없음"}
      </HiddenStatus>
      <HiddenStatus data-testid="map-center">
        {mapCenter[0]},{mapCenter[1]}
      </HiddenStatus>
    </AppContainer>
  );
}
