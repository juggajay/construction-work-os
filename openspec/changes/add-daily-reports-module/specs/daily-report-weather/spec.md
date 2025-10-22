# Capability: Daily Report Weather Integration

**Capability ID**: `daily-report-weather`
**Status**: New
**Owner**: Backend Team

## Purpose

Enable automatic weather data capture for daily reports using external weather APIs, with manual fallback for offline scenarios and API failures.

## ADDED Requirements

### Requirement: Auto-Fetch Weather Data on Report Creation

The system MUST automatically fetch weather data from an external API when a daily report is created.

**Priority**: P0 (Critical)

#### Scenario: Auto-populate weather on report creation

**Given** I am creating a daily report for 2025-01-20
**And** the project location is San Francisco, CA (37.7749°N, 122.4194°W)
**When** the report is created
**Then** weather data is automatically fetched from OpenWeatherMap API
**And** the report is populated with:
- Weather condition: "partly_cloudy"
- Temperature high: 62°F
- Temperature low: 48°F
- Precipitation: 0.0 inches
- Wind speed: 12 mph
- Humidity: 65%
**And** a weather data source indicator shows "Auto-fetched from OpenWeatherMap"

#### Scenario: Use cached weather data for same location and date

**Given** weather data for San Francisco on 2025-01-20 was previously fetched
**And** the data is cached in the system
**When** another user creates a daily report for the same location and date
**Then** the cached weather data is used
**And** no additional API call is made
**And** the cache indicator shows "Cached data from [timestamp]"

---

### Requirement: Manual Weather Entry Fallback

Users MUST be able to manually enter weather data if the API fails or is unavailable.

**Priority**: P0 (Critical)

#### Scenario: API failure triggers manual entry mode

**Given** I am creating a daily report for 2025-01-20
**And** the OpenWeatherMap API returns a 500 error
**When** the automatic fetch fails
**Then** I am shown a manual weather entry form
**And** the form is pre-populated with yesterday's weather as defaults
**And** a warning message displays: "Weather API unavailable. Please enter manually."
**And** a warning badge is shown on the report: "Weather manually entered"

#### Scenario: Manually override auto-fetched weather

**Given** a daily report has auto-fetched weather data
**And** the weather data appears incorrect (e.g., doesn't match actual site conditions)
**When** I click "Edit Weather Data" and manually update fields
**Then** the weather data is updated with my manual values
**And** the weather source indicator changes to "Manually entered (overriding API data)"
**And** an audit log entry records the manual override

---

### Requirement: Historical Weather Lookup for Late Reports

The system MUST support fetching historical weather data for reports created after the date has passed.

**Priority**: P1 (High)

#### Scenario: Fetch historical weather for past date

**Given** today is 2025-01-25
**And** I am creating a daily report for 2025-01-20 (5 days ago)
**When** the report is created
**Then** the system fetches historical weather data for 2025-01-20
**And** the weather data reflects actual conditions from that date
**And** the weather source indicator shows "Historical data from OpenWeatherMap"

#### Scenario: Historical weather is outside API limit

**Given** today is 2025-01-30
**And** I am creating a daily report for 2025-01-10 (20 days ago)
**And** the OpenWeatherMap free tier only provides 5 days of historical data
**When** the report is created
**Then** the system falls back to manual entry mode
**And** I receive a message: "Historical weather not available for dates older than 5 days. Please enter manually."

---

### Requirement: Display Weather Conditions with Visual Indicators

Daily reports MUST display weather conditions with intuitive icons and color coding.

**Priority**: P1 (High)

#### Scenario: Display weather icon based on condition

**Given** a daily report has weather_condition "rain"
**When** I view the report in the list or detail page
**Then** I see a rain cloud icon ☁️🌧️
**And** the temperature range is displayed: "55°F - 62°F"

**Given** a daily report has weather_condition "clear"
**Then** I see a sun icon ☀️

**Given** a daily report has weather_condition "snow"
**Then** I see a snowflake icon ❄️

#### Scenario: Color-code weather severity for alerts

**Given** a daily report has weather_condition "rain" or "snow"
**When** I view the report
**Then** the weather badge is highlighted in yellow (caution)
**And** it indicates potential weather-related delays

**Given** a daily report has wind_speed > 25 mph
**Then** the weather badge is highlighted in orange (high wind alert)

---

### Requirement: Filter Daily Reports by Weather Condition

Users MUST be able to filter daily reports by weather conditions to identify weather-impacted days.

**Priority**: P1 (High)

#### Scenario: Filter reports by rain days

**Given** the project has 30 daily reports in January 2025
**And** 5 reports have weather_condition "rain"
**When** I filter by weather condition "rain"
**Then** I see only the 5 rainy day reports
**And** this helps identify weather-related delays and productivity impacts

#### Scenario: Filter reports by temperature range

**Given** I am viewing daily reports
**When** I filter by temperature < 40°F
**Then** I see only reports where work may have been impacted by cold weather
**And** this is useful for concrete curing analysis and scheduling decisions

---

### Requirement: Weather API Rate Limit Handling

The system MUST gracefully handle API rate limits and avoid excessive API calls.

**Priority**: P0 (Critical)

#### Scenario: API rate limit triggers fallback

**Given** the OpenWeatherMap API returns a 429 Too Many Requests error
**When** I create a daily report
**Then** the system falls back to manual entry mode
**And** I receive a message: "Weather API rate limit reached. Please enter manually."
**And** an admin notification is sent to monitor API usage

#### Scenario: Implement exponential backoff on errors

**Given** the weather API returns multiple consecutive errors
**When** the system retries the request
**Then** it uses exponential backoff (1s, 2s, 4s delays)
**And** it stops retrying after 3 attempts
**And** it falls back to manual entry

---

### Requirement: Cache Weather Data to Reduce API Calls

The system MUST cache weather data per location and date to minimize API usage.

**Priority**: P0 (Critical)

#### Scenario: Cache weather data for 24 hours

**Given** weather data for San Francisco on 2025-01-20 was fetched at 10:00 AM
**And** the data is cached
**When** another user creates a report for the same location and date at 2:00 PM
**Then** the cached data is used
**And** no additional API call is made
**And** the cache expires after 24 hours

#### Scenario: Invalidate cache for manual overrides

**Given** weather data was auto-fetched and cached
**When** a user manually overrides the weather data
**Then** the cached entry is invalidated
**And** future reports for the same date use the manual override (not the cached API data)

---

### Requirement: Display Weather Data Source and Reliability

Users MUST be able to see the source of weather data and trust the accuracy.

**Priority**: P2 (Medium)

#### Scenario: Show weather data source indicator

**Given** a daily report has auto-fetched weather data
**When** I view the report
**Then** I see a small indicator: "Weather data from OpenWeatherMap"
**And** it includes a timestamp: "Fetched at 10:00 AM on 2025-01-20"

**Given** a daily report has manually entered weather data
**Then** I see an indicator: "Weather manually entered by [user name]"
**And** it includes a timestamp: "Entered at 2:30 PM on 2025-01-20"

---

### Requirement: Weather Analytics for Project Delays

The system MUST provide weather analytics to correlate weather conditions with delays and productivity.

**Priority**: P2 (Medium)

#### Scenario: Generate weather impact report

**Given** a project has 60 daily reports over 2 months
**And** 10 reports have weather_condition "rain"
**And** 5 of those rainy day reports have delay incidents
**When** I view the project weather analytics dashboard
**Then** I see a chart showing:
- "Rain days: 10 (17% of project days)"
- "Delay incidents on rainy days: 5 (50% of rain days)"
- "Average crew hours on rainy days: 32 (vs 48 on clear days)"
**And** this helps with schedule risk analysis and weather contingency planning

---

## Test Coverage

### Unit Tests
- [x] Weather API client integration (mocked responses)
- [x] Cache key generation (location + date)
- [x] Exponential backoff on API errors
- [x] Manual fallback logic
- [x] Historical weather date calculation

### Integration Tests
- [x] Weather data fetch on report creation (live API test in staging)
- [x] Cache hit avoids duplicate API calls
- [x] API failure triggers manual entry mode
- [x] Manual override invalidates cache

### E2E Tests
- [x] Create report → Weather auto-populated → Submit
- [x] Create report with API failure → Manual entry → Submit
- [x] Filter reports by weather condition
- [x] View weather analytics dashboard

## Dependencies

- **External API**: OpenWeatherMap API (free tier: 1,000 calls/day)
- **Cache**: Redis or in-memory cache for weather data
- **Parent capability**: daily-report-lifecycle (weather data is part of daily report)
- **Project data**: Project location (latitude/longitude) for weather lookup

## Acceptance Criteria

- [ ] Weather data is automatically fetched from OpenWeatherMap on report creation
- [ ] Weather data is cached per location/date for 24 hours
- [ ] API failures gracefully fall back to manual entry mode
- [ ] Historical weather data is fetched for reports up to 5 days in the past
- [ ] Users can manually override auto-fetched weather data
- [ ] Weather conditions are displayed with intuitive icons and color coding
- [ ] Reports can be filtered by weather condition and temperature range
- [ ] API rate limits are handled with exponential backoff and admin alerts
- [ ] Weather data source is clearly indicated (API vs manual)
- [ ] Weather analytics dashboard shows weather impact on project productivity
