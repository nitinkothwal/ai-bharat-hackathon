# Bharat CareLink – Requirements Specification

## Table of Contents
1. [Functional Requirements](#1-functional-requirements)
2. [Non-Functional Requirements](#2-non-functional-requirements)
3. [Data Requirements](#3-data-requirements)
4. [Acceptance Criteria](#4-acceptance-criteria)

## 1. Functional Requirements


### 1.1 ASHA Mobile App

#### 1.1.1 Voice-Based Patient Data Entry
- Voice input using AWS Transcribe with Hindi, Tamil, Telugu, Bengali, English language support
- Automatic language detection with fallback to manual selection
- Voice commands mapped to form fields: "patient name", "age", "symptoms", "blood pressure"
- Real-time transcription display with edit capability before submission
- Confidence score threshold: >0.85 for auto-fill, <0.85 requires manual confirmation
- Audio files stored locally (max 5MB per recording), synced to S3 when online
- Audio format: MP3, 16kHz sample rate, mono channel
- Maximum recording duration: 60 seconds per field

#### 1.1.2 Structured Form Fields

**Patient Registration Form:**
- `patient_id` (auto-generated: {ASHA_CODE}-{YYYYMMDD}-{SEQUENCE}, e.g., ASH001-20260215-001)
- `aadhaar_number` (12 digits, optional, field-level encrypted)
- `full_name` (string, max 100 chars, Unicode support for regional languages)
- `age` (integer, 0-120, validation required)
- `gender` (enum: male, female, other)
- `mobile_number` (10 digits, optional, format: 9XXXXXXXXX)
- `village_code` (string, dropdown from predefined master list)
- `address` (string, max 200 chars)
- `created_by_asha_id` (auto-populated from logged-in user)
- `created_at` (timestamp, auto-generated)

**Pregnancy Referral Form:**
- `gravida` (integer, 1-15, number of pregnancies)
- `parity` (integer, 0-14, number of live births)
- `gestational_age_weeks` (integer, 1-42)
- `lmp_date` (date, ISO 8601 format, last menstrual period)
- `edd_date` (date, auto-calculated: LMP + 280 days)
- `hemoglobin_level` (float, 0-20 g/dL, decimal precision: 1)
- `blood_pressure_systolic` (integer, 60-250 mmHg)
- `blood_pressure_diastolic` (integer, 40-150 mmHg)
- `weight_kg` (float, 20-200, decimal precision: 1)
- `height_cm` (float, 100-220, decimal precision: 1)
- `bmi` (float, auto-calculated: weight/(height/100)², decimal precision: 1)
- `anc_visits_completed` (integer, 0-9, antenatal care visits)
- `high_risk_symptoms` (multi-select checkboxes: bleeding, severe_headache, blurred_vision, convulsions, reduced_fetal_movement, fever, swelling)
- `previous_complications` (multi-select: preeclampsia, gestational_diabetes, preterm_birth, stillbirth, cesarean)
- `referral_reason` (text area, max 500 chars, required field)

**Child Malnutrition Referral Form:**
- `child_age_months` (integer, 0-60)
- `weight_kg` (float, 1-30, decimal precision: 2)
- `height_cm` (float, 40-120, decimal precision: 1)
- `muac_cm` (float, 5-20, mid-upper arm circumference, decimal precision: 1)
- `weight_for_age_zscore` (float, auto-calculated using WHO standards)
- `height_for_age_zscore` (float, auto-calculated using WHO standards)
- `weight_for_height_zscore` (float, auto-calculated using WHO standards)
- `edema_present` (boolean, bilateral pitting edema)
- `appetite_status` (enum: normal, reduced, very_poor)
- `recent_illness` (multi-select: diarrhea, fever, cough, vomiting, none)
- `feeding_practices` (enum: exclusive_breastfeeding, complementary_feeding, inadequate)
- `immunization_status` (enum: up_to_date, delayed, incomplete)
- `referral_reason` (text area, max 500 chars)

**TB Suspect Referral Form:**
- `cough_duration_weeks` (integer, 0-52)
- `fever_present` (boolean)
- `fever_duration_days` (integer, 0-365, conditional: if fever_present=true)
- `night_sweats` (boolean)
- `weight_loss_kg` (float, 0-50, decimal precision: 1)
- `hemoptysis` (boolean, coughing up blood)
- `chest_pain` (boolean)
- `previous_tb_treatment` (boolean)
- `treatment_completion_status` (enum: completed, incomplete, unknown, conditional: if previous_tb_treatment=true)
- `hiv_status` (enum: positive, negative, unknown)
- `diabetes_present` (boolean)
- `contact_with_tb_patient` (boolean)
- `contact_relationship` (string, max 100 chars, conditional: if contact_with_tb_patient=true)
- `referral_reason` (text area, max 500 chars)

#### 1.1.3 Offline Data Storage with Sync Mechanism
- Local SQLite database stores up to 500 referral records
- Automatic sync when network available (WiFi or cellular with >2G speed)
- Sync priority queue: high_risk cases first, then by timestamp ascending
- Conflict resolution strategy: server timestamp wins, local changes logged for audit
- Sync status indicators:
  - Green checkmark: Successfully synced
  - Yellow clock: Pending sync (queued)
  - Red exclamation: Sync failed (retry available)
- Failed sync retry logic: Exponential backoff (1min, 5min, 15min, 1hr, 4hr)
- Maximum offline duration: 48 hours before mandatory sync warning
- Sync completion notification displayed to ASHA worker with count of synced records
- Background sync service runs every 15 minutes when app is active
- Sync progress indicator shows: X of Y records synced

#### 1.1.4 Referral Submission with Unique Referral ID Generation
- Referral ID format: `REF-{STATE_CODE}-{DISTRICT_CODE}-{YYYYMMDD}-{6_DIGIT_SEQUENCE}`
- Example: `REF-UP-12-20260215-000123`
- ID generated server-side via Lambda function using DynamoDB atomic counter
- Submission payload includes:
  - `patient_id` (string)
  - `referral_type` (enum: pregnancy, malnutrition, tb_suspect, chronic_disease)
  - `form_data` (JSON object with all form fields)
  - `asha_id` (string, auto-populated)
  - `timestamp` (Unix epoch milliseconds)
  - `geolocation` (object: {lat: float, lon: float}, captured at submission)
  - `audio_file_s3_keys` (array of strings, if voice input used)
- Submission confirmation displayed within 3 seconds with referral ID
- PDF referral slip auto-generated and stored in S3 bucket: `referral-slips/{year}/{month}/{referral_id}.pdf`
- PDF accessible via in-app "View Referral Slip" button
- SMS sent to patient mobile (if provided) with referral ID and PHC details
- SMS template: "Your referral {referral_id} submitted to {phc_name}. Visit within 3 days. Contact: {phc_phone}"

#### 1.1.5 Referral Status Tracking
- Status values (enum):
  - `submitted` - Initial state after ASHA submission
  - `received_at_phc` - PHC acknowledged receipt
  - `under_evaluation` - PHC staff reviewing case
  - `completed` - Patient evaluated and treated
  - `follow_up_required` - Additional follow-up needed
  - `closed` - Case closed after follow-up completion
- Real-time status updates via WebSocket connection (fallback: 30-second polling)
- Status history timeline displayed in app showing:
  - Status name
  - Timestamp
  - Updated by (user name and role)
  - Notes (if any)
- Push notification sent on status change with message: "Referral {referral_id} status updated to {status}"
- Filter referrals by:
  - Status (multi-select dropdown)
  - Date range (from/to date picker)
  - Risk level (low, medium, high)
  - Referral type (multi-select)
- Search functionality:
  - By patient name (partial match, case-insensitive)
  - By referral ID (exact match)
  - By patient ID (exact match)
- Sort options: Date (newest/oldest), Risk Score (high/low), Status

#### 1.1.6 Follow-Up Reminder Notifications
- Automatic reminder schedule:
  - Day 7: First reminder to ASHA worker (if status != completed or closed)
  - Day 14: Second reminder to ASHA + notification to supervisor
  - Day 21: Escalation to Block Medical Officer
- Reminder content includes:
  - Patient name
  - Referral ID
  - Days pending (calculated from submission date)
  - Current status
  - Action required: "Please follow up with patient and update status"
- Delivery channels:
  - In-app notification (persistent until dismissed)
  - SMS to ASHA mobile number
  - Email to supervisor (day 14+)
- Snooze options:
  - 2 days
  - 5 days
  - Custom date picker
- Mark follow-up complete action:
  - Outcome notes field (text area, max 300 chars)
  - Outcome status (enum: patient_visited, patient_unreachable, patient_refused, other)
  - Next action required (boolean)
  - Next follow-up date (date picker, conditional)
- Follow-up completion updates referral status and creates audit log entry

### 1.2 PHC Web Dashboard

#### 1.2.1 Referral Queue View (Sorted by Risk Score)
- Default view: Descending risk score (highest risk first)
- Table columns:
  - Referral ID (clickable link to detail page)
  - Patient Name
  - Age/Gender (format: "24F" or "45M")
  - Referral Type (badge with icon)
  - Risk Score (numeric: 0.00-1.00)
  - Risk Level (color-coded badge: Red/Orange/Green)
  - ASHA Name
  - Village
  - Submission Date (format: DD-MMM-YYYY HH:MM)
  - Status (color-coded badge)
  - Actions (View, Update Status buttons)
- Color coding:
  - Red: High risk (score >0.7)
  - Orange: Medium risk (score 0.4-0.7)
  - Green: Low risk (score <0.4)
- Filter panel (collapsible sidebar):
  - Risk level (checkboxes: High, Medium, Low)
  - Referral type (checkboxes: Pregnancy, Malnutrition, TB, Chronic Disease)
  - Date range (from/to date pickers with presets: Today, Last 7 days, Last 30 days, Custom)
  - ASHA worker (searchable dropdown)
  - Village (searchable dropdown)
  - Status (checkboxes for all status values)
- Pagination: 50 records per page with page size options (25, 50, 100)
- Export functionality:
  - CSV export (all filtered records)
  - Excel export with formatting
  - PDF report with summary statistics
- Bulk actions:
  - Select multiple referrals (checkboxes)
  - Bulk status update (dropdown + confirm dialog)
  - Bulk assign to staff member
- Auto-refresh: Every 60 seconds (toggle on/off available)
- Total count displayed: "Showing X-Y of Z referrals"

#### 1.2.2 Patient Detail Page with AI-Generated Case Summary
- Page sections:
  1. **Patient Demographics** (card layout):
     - Patient ID, Name, Age, Gender
     - Mobile number (click to call)
     - Address with village name
     - Aadhaar number (masked: XXXX-XXXX-1234, view full requires additional authentication)
  
  2. **Referral Information** (card layout):
     - Referral ID, Type, Submission date/time
     - ASHA worker name and contact
     - Current status with timeline
     - Geolocation (map pin showing submission location)
  
  3. **Clinical Data** (tabbed interface by referral type):
     - All form fields displayed in organized sections
     - Abnormal values highlighted in red
     - Normal ranges shown as tooltips
  
  4. **Risk Assessment** (prominent card):
     - Risk score: Large numeric display (0.00-1.00) with percentage
     - Risk level: Color-coded badge
     - Risk factor breakdown:
       - Table showing top 5 contributing factors
       - Columns: Factor Name, Value, Contribution (%), Normal Range
       - Visual bar chart of contributions
     - Comparison: "X% higher than district average"
  
  5. **AI-Generated Case Summary** (expandable card):
     - Generated using AWS Bedrock (Claude 3.5 Sonnet)
     - Input: All form fields + risk scores + risk factors
     - Output: 150-300 word clinical summary
     - Language: English with option to translate to Hindi/regional language
     - Content includes:
       - Key clinical findings
       - Primary risk factors
       - Recommended immediate actions
       - Urgency level assessment
       - Suggested investigations/tests
     - Regenerate button (if needed)
     - Copy to clipboard button
  
  6. **Referral History** (table):
     - Previous referrals for same patient
     - Columns: Date, Type, Risk Score, Outcome
     - Click to view previous referral details
  
  7. **Attached Documents** (file list):
     - Images uploaded by ASHA (lab reports, prescriptions)
     - Audio recordings (playback controls)
     - Download/view buttons
     - Stored in S3: `attachments/{referral_id}/{filename}`
  
  8. **Action Panel** (sticky footer):
     - Update Status button (opens modal)
     - Add Notes button (opens text area)
     - Schedule Follow-Up button (opens date picker)
     - Print Referral button (generates PDF)
     - Assign to Staff button (dropdown)

#### 1.2.3 Risk Score Visualization
- Display formats:
  - Numeric: 0.00-1.00 (2 decimal precision)
  - Percentage: 0-100% (0 decimal precision)
  - Risk level badge: LOW/MEDIUM/HIGH with color coding
- Gauge chart:
  - Semi-circular gauge (180 degrees)
  - Color gradient: Green (0-0.4), Orange (0.4-0.7), Red (0.7-1.0)
  - Needle pointing to current score
  - Threshold markers at 0.4 and 0.7
- Factor contribution visualization:
  - Horizontal bar chart showing top 5 contributing factors
  - X-axis: Contribution percentage (0-100%)
  - Y-axis: Factor names
  - Bars color-coded by severity
  - Tooltip on hover showing: Factor name, Value, Contribution %, Normal range
- District comparison:
  - Line showing district average risk score
  - Text: "X% higher/lower than district average"
  - Percentile rank: "Higher risk than Y% of cases"
- Trend chart (if multiple referrals exist for patient):
  - Line chart showing risk scores over time
  - X-axis: Referral dates
  - Y-axis: Risk score (0-1.0)
  - Data points clickable to view that referral

#### 1.2.4 Referral Completion Update
- Status update modal with form:
  - Status dropdown (values: under_evaluation, completed, follow_up_required, closed)
  - Conditional fields based on status:
  
  **If status = completed:**
  - `diagnosis` (text area, max 500 chars, required)
  - `treatment_provided` (text area, max 500 chars, required)
  - `medications_prescribed` (text area, max 300 chars)
  - `investigations_done` (multi-select: blood_test, urine_test, ultrasound, xray, other)
  - `follow_up_required` (boolean)
  - `follow_up_date` (date picker, conditional: if follow_up_required=true)
  - `follow_up_instructions` (text area, max 300 chars, conditional)
  - `outcome` (enum: recovered, improved, stable, referred_higher, deceased, lost_to_follow_up)
  - `referred_to_facility` (string, max 200 chars, conditional: if outcome=referred_higher)
  - `phc_staff_notes` (text area, max 500 chars)
  
  **If status = follow_up_required:**
  - `follow_up_date` (date picker, required)
  - `follow_up_reason` (text area, max 300 chars, required)
  - `instructions_to_asha` (text area, max 300 chars)
  
- Auto-populated fields:
  - `updated_by_user_id` (from logged-in user)
  - `updated_by_name` (from logged-in user)
  - `updated_at` (timestamp)
- Validation: All required fields must be filled before submission
- Confirmation dialog: "Are you sure you want to update status to {status}?"
- On successful update:
  - Status updated in database
  - Status history entry created
  - Notification sent to ASHA worker via SMS and in-app
  - Email sent to supervisor (if status=completed or closed)
  - Success toast message: "Referral status updated successfully"

#### 1.2.5 Daily/Weekly High-Risk Analytics
- Dashboard layout: Grid of widgets (responsive, 2-3 columns)

**Widget 1: Key Metrics (4 cards in row)**
- Total referrals today/this week (large number with trend arrow)
- High-risk referrals count and percentage (red badge)
- Average risk score (gauge mini-chart)
- Completion rate percentage (progress bar)

**Widget 2: Referrals by Type (Pie Chart)**
- Segments: Pregnancy, Malnutrition, TB Suspect, Chronic Disease
- Percentages and counts displayed
- Click segment to filter main referral queue
- Legend with color coding

**Widget 3: Referrals by Status (Stacked Bar Chart)**
- X-axis: Days of week (or dates for weekly view)
- Y-axis: Count of referrals
- Stacked bars colored by status
- Tooltip shows breakdown on hover

**Widget 4: Top 5 Villages by Referral Volume (Horizontal Bar Chart)**
- Y-axis: Village names
- X-axis: Referral count
- Bars color-coded by average risk level
- Click bar to view village-specific referrals

**Widget 5: Top 5 ASHA Workers by Referral Count (Table)**
- Columns: ASHA Name, Referrals Submitted, High-Risk Count, Avg Risk Score
- Sortable by any column
- Click row to view ASHA-specific referrals

**Widget 6: Referrals Over Time (Line Chart)**
- X-axis: Last 30 days (daily granularity)
- Y-axis: Count of referrals
- Multiple lines: Total, High-Risk, Completed
- Zoom and pan controls
- Date range selector

**Widget 7: Performance Metrics (Cards)**
- Average time to completion (in days)
- Median time to first status update (in hours)
- Missed follow-ups count (red alert if >10)
- Escalated cases count

**Widget 8: Risk Distribution (Histogram)**
- X-axis: Risk score bins (0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0)
- Y-axis: Count of referrals
- Color-coded bars (green, yellow, orange, red)

- Date range selector (top of dashboard):
  - Presets: Today, Yesterday, Last 7 days, Last 30 days, This Month, Custom
  - Custom: From/To date pickers
- Auto-refresh toggle (on/off, interval: 5 minutes)
- Export dashboard as PDF report button
- All charts interactive with drill-down capability

#### 1.2.6 Heatmap by Village
- Interactive map using Leaflet/Mapbox
- Base layer: OpenStreetMap or Google Maps
- Village markers:
  - Circle markers at village coordinates
  - Size proportional to referral volume (min: 10px, max: 50px radius)
  - Color intensity based on selected metric:
    - Referral volume: Blue gradient (light to dark)
    - High-risk case density: Red gradient (light to dark)
    - Completion rate: Green-to-red gradient (high completion=green, low=red)
- Metric selector (dropdown):
  - Total Referrals
  - High-Risk Referrals
  - Completion Rate (%)
  - Average Risk Score
  - Pending Referrals
- Hover tooltip shows:
  - Village name
  - Selected metric value
  - Total referrals count
  - High-risk count
  - ASHA workers assigned (count)
- Click village marker for drill-down modal:
  - Village details (name, code, population)
  - Referral list table (same columns as main queue)
  - ASHA workers list with contact info
  - Demographics summary (age distribution, gender split)
  - Export village report button
- Filter controls:
  - Date range (from/to date pickers)
  - Referral type (multi-select)
  - Risk level (multi-select)
  - Status (multi-select)
- Map controls:
  - Zoom in/out buttons
  - Reset view button
  - Fullscreen toggle
  - Layer selector (satellite/terrain/street view)
- Legend showing color scale and size scale
- Export map as PNG image button
- Cluster markers when zoomed out (shows count in cluster)
- Search box to find and zoom to specific village

### 1.3 AI Risk Scoring Engine

#### 1.3.1 High-Risk Pregnancy Prediction

**Algorithm:** XGBoost Classifier

**Input Features (23 features):**
1. `age` (integer, years)
2. `gravida` (integer, number of pregnancies)
3. `parity` (integer, number of live births)
4. `gestational_age_weeks` (integer, weeks)
5. `hemoglobin_level` (float, g/dL)
6. `blood_pressure_systolic` (integer, mmHg)
7. `blood_pressure_diastolic` (integer, mmHg)
8. `bmi` (float, kg/m²)
9. `anc_visits_completed` (integer, count)
10. `has_bleeding` (boolean, 0/1)
11. `has_severe_headache` (boolean, 0/1)
12. `has_blurred_vision` (boolean, 0/1)
13. `has_convulsions` (boolean, 0/1)
14. `has_reduced_fetal_movement` (boolean, 0/1)
15. `has_fever` (boolean, 0/1)
16. `has_swelling` (boolean, 0/1)
17. `previous_preeclampsia` (boolean, 0/1)
18. `previous_gestational_diabetes` (boolean, 0/1)
19. `previous_preterm_birth` (boolean, 0/1)
20. `previous_stillbirth` (boolean, 0/1)
21. `previous_cesarean` (boolean, 0/1)
22. `rural_location` (boolean, 0/1)
23. `distance_to_phc_km` (float, kilometers)

**Feature Engineering:**
- Age categories: <18 (very_young), 18-35 (normal), >35 (advanced_maternal_age)
- BP categories: Normal (<120/80), Elevated (120-139/80-89), High (≥140/90)
- Hemoglobin categories: Severe anemia (<7), Moderate (7-10), Mild (10-11), Normal (≥11)
- BMI categories: Underweight (<18.5), Normal (18.5-24.9), Overweight (25-29.9), Obese (≥30)
- Gestational age categories: First trimester (1-12), Second (13-27), Third (28-42)

**Output Format:**
```json
{
  "risk_score": 0.78,
  "risk_level": "high",
  "risk_factors": [
    {
      "factor": "blood_pressure_systolic",
      "contribution": 0.30,
      "value": 160,
      "normal_range": "90-120 mmHg",
      "severity": "high"
    },
    {
      "factor": "hemoglobin_level",
      "contribution": 0.25,
      "value": 7.2,
      "normal_range": "11-14 g/dL",
      "severity": "high"
    },
    {
      "factor": "previous_preeclampsia",
      "contribution": 0.23,
      "value": true,
      "normal_range": "false",
      "severity": "high"
    },
    {
      "factor": "age",
      "contribution": 0.12,
      "value": 38,
      "normal_range": "18-35 years",
      "severity": "medium"
    },
    {
      "factor": "anc_visits_completed",
      "contribution": 0.10,
      "value": 1,
      "normal_range": "≥4 visits",
      "severity": "medium"
    }
  ],
  "recommendations": [
    "Immediate referral to district hospital for evaluation",
    "Monitor blood pressure every 4 hours",
    "Administer iron supplementation (100mg elemental iron daily)",
    "Urine protein test to rule out preeclampsia",
    "Fetal monitoring (NST) recommended"
  ],
  "urgency": "immediate",
  "model_version": "pregnancy_risk_v1.2.0",
  "inference_timestamp": 1739577600000
}
```

**Risk Level Thresholds:**
- Low: 0.00 - 0.39 (routine care)
- Medium: 0.40 - 0.69 (enhanced monitoring)
- High: 0.70 - 1.00 (immediate intervention)

**Model Performance Requirements:**
- AUC-ROC: >0.80 on validation set
- Sensitivity (recall): >0.85 for high-risk cases
- Specificity: >0.75
- Inference time: <2 seconds (p95)
- Model retraining: Quarterly with new data

#### 1.3.2 Malnutrition Risk Scoring

**Algorithm:** Random Forest Classifier

**Input Features (15 features):**
1. `child_age_months` (integer, 0-60)
2. `weight_kg` (float, kilograms)
3. `height_cm` (float, centimeters)
4. `muac_cm` (float, mid-upper arm circumference)
5. `weight_for_age_zscore` (float, WHO standard)
6. `height_for_age_zscore` (float, WHO standard)
7. `weight_for_height_zscore` (float, WHO standard)
8. `edema_present` (boolean, 0/1)
9. `appetite_status` (integer, encoded: 0=normal, 1=reduced, 2=very_poor)
10. `has_diarrhea` (boolean, 0/1)
11. `has_fever` (boolean, 0/1)
12. `has_cough` (boolean, 0/1)
13. `has_vomiting` (boolean, 0/1)
14. `feeding_practices` (integer, encoded: 0=exclusive_breastfeeding, 1=complementary, 2=inadequate)
15. `immunization_status` (integer, encoded: 0=up_to_date, 1=delayed, 2=incomplete)

**Feature Engineering:**
- Age categories: 0-6 months, 6-12 months, 12-24 months, 24-60 months
- MUAC categories: Severe (<11.5cm), Moderate (11.5-12.5cm), Normal (>12.5cm)
- Combined illness score: Sum of has_diarrhea + has_fever + has_cough + has_vomiting

**Output Format:**
```json
{
  "risk_score": 0.85,
  "risk_level": "high",
  "malnutrition_category": "severe_acute_malnutrition",
  "risk_factors": [
    {
      "factor": "weight_for_height_zscore",
      "contribution": 0.40,
      "value": -3.2,
      "normal_range": ">-2 SD",
      "severity": "high"
    },
    {
      "factor": "muac_cm",
      "contribution": 0.30,
      "value": 10.5,
      "normal_range": ">12.5 cm",
      "severity": "high"
    },
    {
      "factor": "edema_present",
      "contribution": 0.15,
      "value": true,
      "normal_range": "false",
      "severity": "high"
    },
    {
      "factor": "appetite_status",
      "contribution": 0.10,
      "value": "very_poor",
      "normal_range": "normal",
      "severity": "medium"
    },
    {
      "factor": "feeding_practices",
      "contribution": 0.05,
      "value": "inadequate",
      "normal_range": "age_appropriate",
      "severity": "medium"
    }
  ],
  "recommendations": [
    "Immediate enrollment in therapeutic feeding program (RUTF)",
    "Weekly weight monitoring for 4 weeks",
    "Nutritional counseling for caregiver",
    "Treat underlying infections (diarrhea, fever)",
    "Vitamin A supplementation",
    "Deworming if age >12 months"
  ],
  "urgency": "immediate",
  "model_version": "malnutrition_risk_v1.1.0",
  "inference_timestamp": 1739577600000
}
```

**Malnutrition Categories (WHO Classification):**
- Normal: Weight-for-height z-score > -1 SD
- Mild: z-score -1 to -2 SD
- Moderate Acute Malnutrition (MAM): z-score -2 to -3 SD or MUAC 11.5-12.5cm
- Severe Acute Malnutrition (SAM): z-score < -3 SD or MUAC <11.5cm or bilateral edema

**Risk Level Thresholds:**
- Low: 0.00 - 0.39 (normal nutrition)
- Medium: 0.40 - 0.69 (MAM)
- High: 0.70 - 1.00 (SAM)

**Model Performance Requirements:**
- AUC-ROC: >0.82 on validation set
- Sensitivity: >0.90 for SAM cases
- Specificity: >0.78
- Inference time: <2 seconds (p95)

#### 1.3.3 TB Default Probability Prediction

**Algorithm:** Logistic Regression with L2 Regularization

**Input Features (12 features):**
1. `age` (integer, years)
2. `gender` (integer, encoded: 0=male, 1=female)
3. `cough_duration_weeks` (integer, weeks)
4. `fever_present` (boolean, 0/1)
5. `night_sweats` (boolean, 0/1)
6. `weight_loss_kg` (float, kilograms)
7. `hemoptysis` (boolean, 0/1, coughing blood)
8. `chest_pain` (boolean, 0/1)
9. `previous_tb_treatment` (boolean, 0/1)
10. `hiv_positive` (boolean, 0/1)
11. `diabetes_present` (boolean, 0/1)
12. `contact_with_tb_patient` (boolean, 0/1)

**Feature Engineering:**
- Symptom score: Sum of fever + night_sweats + hemoptysis + chest_pain (0-4)
- Risk factor score: Sum of hiv_positive + diabetes_present + previous_tb_treatment (0-3)
- Cough severity: <2 weeks (low), 2-4 weeks (medium), >4 weeks (high)

**Output Format:**
```json
{
  "risk_score": 0.72,
  "risk_level": "high",
  "tb_probability": 0.68,
  "risk_factors": [
    {
      "factor": "cough_duration_weeks",
      "contribution": 0.35,
      "value": 8,
      "normal_range": "<2 weeks",
      "severity": "high"
    },
    {
      "factor": "contact_with_tb_patient",
      "contribution": 0.25,
      "value": true,
      "normal_range": "false",
      "severity": "high"
    },
    {
      "factor": "weight_loss_kg",
      "contribution": 0.12,
      "value": 7,
      "normal_range": "<3 kg",
      "severity": "medium"
    },
    {
      "factor": "night_sweats",
      "contribution": 0.10,
      "value": true,
      "normal_range": "false",
      "severity": "medium"
    },
    {
      "factor": "hemoptysis",
      "contribution": 0.10,
      "value": true,
      "normal_range": "false",
      "severity": "high"
    }
  ],
  "recommendations": [
    "Sputum test (GeneXpert MTB/RIF) required immediately",
    "Chest X-ray (PA view) recommended",
    "Isolate from family members until diagnosis confirmed",
    "Contact tracing for household members",
    "HIV testing if status unknown",
    "Diabetes screening if not done"
  ],
  "urgency": "high",
  "model_version": "tb_risk_v1.0.0",
  "inference_timestamp": 1739577600000
}
```

**Risk Level Thresholds:**
- Low: 0.00 - 0.39 (unlikely TB)
- Medium: 0.40 - 0.69 (possible TB, testing recommended)
- High: 0.70 - 1.00 (probable TB, immediate testing required)

**Model Performance Requirements:**
- AUC-ROC: >0.78 on validation set
- Sensitivity: >0.82 for confirmed TB cases
- Specificity: >0.72
- Inference time: <2 seconds (p95)

### 1.4 Follow-Up & Alert System

#### 1.4.1 Automated Reminder After X Days
**Reminder Schedule:**

**Day 7 Reminder:**
- Trigger: If referral status = submitted OR received_at_phc OR under_evaluation
- Recipients: ASHA worker (primary)
- Channels: In-app notification + SMS
- Message template:
  ```
  Reminder: Referral {referral_id} for patient {patient_name} is pending for 7 days.
  Risk Level: {risk_level}
  Current Status: {status}
  Action: Please follow up with patient and update status in app.
  ```

**Day 14 Reminder:**
- Trigger: If referral status still not completed or closed
- Recipients: ASHA worker + Supervisor
- Channels: In-app + SMS (ASHA), Email + Dashboard alert (Supervisor)
- Message template (ASHA):
  ```
  Urgent: Referral {referral_id} pending for 14 days.
  Patient: {patient_name}, Risk: {risk_level}
  Your supervisor has been notified.
  Please update status immediately.
  ```
- Message template (Supervisor):
  ```
  Subject: Pending Referral Alert - {referral_id}
  
  ASHA Worker: {asha_name}
  Patient: {patient_name}
  Referral Type: {referral_type}
  Risk Level: {risk_level}
  Days Pending: 14
  
  This referral requires immediate attention.
  View details: {dashboard_link}
  ```

**Day 21 Escalation:**
- Trigger: If referral status still not completed or closed
- Recipients: ASHA worker + Supervisor + Block Medical Officer
- Channels: In-app + SMS (ASHA), Email + Dashboard alert (Supervisor, BMO)
- Creates escalation ticket in system
- Message template (BMO):
  ```
  Subject: Escalated Referral - {referral_id}
  
  This high-priority referral has been pending for 21 days.
  
  Patient: {patient_name}
  Risk Level: {risk_level}
  ASHA: {asha_name}
  PHC: {phc_name}
  Supervisor: {supervisor_name}
  
  Immediate action required.
  View details: {dashboard_link}
  ```

#### 1.4.2 Escalation Logic After Missed Follow-Up
**Escalation Criteria:**
- Referral status remains `submitted` or `received_at_phc` for >14 days
- High-risk referral (score >0.7) with no status update for >7 days
- Follow-up date passed with no completion recorded

**Escalation Process:**
1. Create escalation ticket in `Escalations` table
2. Assign escalation level based on days pending:
   - Level 1 (Day 14): Supervisor
   - Level 2 (Day 21): Block Medical Officer
   - Level 3 (Day 30): District Health Officer
3. Send notifications to all escalation level recipients
4. Display escalation badge on dashboard (red alert icon)
5. Add escalation entry to referral status history
6. Log escalation event in audit trail

**Escalation Ticket Structure:**
```json
{
  "escalation_id": "ESC-{YYYYMMDD}-{SEQUENCE}",
  "referral_id": "REF-UP-12-20260215-000123",
  "escalation_level": 1,
  "escalation_date": 1739577600000,
  "assigned_to_user_id": "SUP001",
  "assigned_to_name": "Dr. Rajesh Kumar",
  "assigned_to_role": "supervisor",
  "reason": "Referral pending for 14 days without status update",
  "status": "open",
  "resolution_notes": null,
  "resolved_at": null,
  "resolved_by": null
}
```

**Escalation Dashboard (for Supervisors/BMO/DHO):**
- List of all open escalations
- Sortable by: Escalation date, Days pending, Risk level
- Filterable by: Escalation level, PHC, ASHA worker
- Actions: View referral, Contact ASHA, Mark resolved, Reassign
- Resolution requires notes (min 50 chars)

#### 1.4.3 SMS/Notification Workflow
**SMS Provider:** AWS SNS with Indian SMS gateway integration (e.g., Exotel, MSG91)

**SMS Configuration:**
- Sender ID: BHRTCL (6 chars, registered with telecom operators)
- Message type: Transactional (no DND restrictions)
- Character encoding: Unicode for Hindi/regional languages, GSM-7 for English
- Character limits:
  - English: 160 chars per SMS
  - Unicode (Hindi): 70 chars per SMS
- Delivery priority: High for escalations, Normal for reminders

**Notification Types and Templates:**

1. **Referral Submitted (to Patient):**
   ```
   Your referral {referral_id} submitted to {phc_name}.
   Visit within 3 days. Contact: {phc_phone}
   - BHRTCL
   ```

2. **Referral Submitted (to ASHA):**
   ```
   Referral {referral_id} submitted successfully.
   Risk: {risk_level}. Track status in app.
   - BHRTCL
   ```

3. **Status Updated (to ASHA):**
   ```
   Referral {referral_id} status: {status}
   Patient: {patient_name}
   View details in app.
   - BHRTCL
   ```

4. **Follow-Up Reminder (to ASHA):**
   ```
   Reminder: Follow up on referral {referral_id}
   Patient: {patient_name}, Pending: {days} days
   Update status in app.
   - BHRTCL
   ```

5. **Escalation Alert (to Supervisor):**
   ```
   Alert: Referral {referral_id} escalated
   ASHA: {asha_name}, Pending: {days} days
   Check dashboard for details.
   - BHRTCL
   ```

**SMS Delivery Tracking:**
- Delivery status tracked via SNS delivery receipts
- Status values: sent, delivered, failed, undelivered
- Failed SMS retry logic:
  - Retry 1: After 5 minutes
  - Retry 2: After 15 minutes
  - Retry 3: After 1 hour
  - After 3 failures: Mark as failed, log error, send email fallback
- Delivery reports stored in `SMSLogs` table:
  ```json
  {
    "sms_id": "SMS-{TIMESTAMP}-{SEQUENCE}",
    "recipient_mobile": "9876543210",
    "message": "Your referral...",
    "notification_type": "referral_submitted",
    "referral_id": "REF-UP-12-20260215-000123",
    "sent_at": 1739577600000,
    "delivery_status": "delivered",
    "delivered_at": 1739577605000,
    "failure_reason": null,
    "retry_count": 0
  }
  ```

**In-App Notification System:**
- Notification bell icon in app header with unread count badge
- Notification panel (slide-out drawer):
  - List of notifications (most recent first)
  - Unread notifications highlighted
  - Mark as read on click
  - Mark all as read button
  - Clear all button
- Notification retention: 30 days
- Push notifications (when app in background):
  - Android: Firebase Cloud Messaging (FCM)
  - iOS: Apple Push Notification Service (APNS)
- Notification preferences (user settings):
  - Enable/disable push notifications
  - Enable/disable SMS notifications
  - Quiet hours (no notifications between 10 PM - 7 AM)

### 1.5 Authentication & Authorization

#### 1.5.1 Role-Based Access Control (RBAC)
**Roles:**
1. **ASHA Worker**
   - Primary user of mobile app
   - Submits referrals, tracks status, completes follow-ups
   
2. **PHC Staff**
   - Uses web dashboard
   - Views and updates referrals assigned to their PHC
   - Generates reports
   
3. **Supervisor (Block Level)**
   - Oversees multiple PHCs and ASHA workers
   - Views all referrals in block
   - Receives escalation alerts
   - Manages users in block
   
4. **Admin (District/State Level)**
   - Full system access
   - User management across district/state
   - System configuration
   - Access to all data
   
5. **Data Analyst (Read-Only)**
   - View-only access to all data
   - Generate reports and analytics
   - Export data for analysis
   - No modification permissions

#### 1.5.2 Permission Matrix

| Feature | ASHA Worker | PHC Staff | Supervisor | Admin | Data Analyst |
|---------|-------------|-----------|------------|-------|--------------|
| Submit referral | ✓ | ✗ | ✗ | ✗ | ✗ |
| View own referrals | ✓ | ✗ | ✗ | ✗ | ✗ |
| Edit pending referral (own) | ✓ (within 24h) | ✗ | ✗ | ✗ | ✗ |
| Delete referral | ✗ | ✗ | ✗ | ✓ | ✗ |
| View all referrals (assigned PHC) | ✗ | ✓ | ✓ | ✓ | ✓ |
| View all referrals (block) | ✗ | ✗ | ✓ | ✓ | ✓ |
| View all referrals (district/state) | ✗ | ✗ | ✗ | ✓ | ✓ |
| Update referral status | ✗ | ✓ | ✓ | ✓ | ✗ |
| Complete referral | ✗ | ✓ | ✓ | ✓ | ✗ |
| View patient details | ✓ (own) | ✓ (PHC) | ✓ (block) | ✓ (all) | ✓ (all) |
| View Aadhaar (full) | ✗ | ✓ | ✓ | ✓ | ✗ |
| Generate reports | ✗ | ✓ | ✓ | ✓ | ✓ |
| Export data | ✗ | ✓ (PHC) | ✓ (block) | ✓ (all) | ✓ (all) |
| View analytics dashboard | ✗ | ✓ | ✓ | ✓ | ✓ |
| Manage users (create/edit/delete) | ✗ | ✗ | ✓ (block) | ✓ (all) | ✗ |
| Configure system settings | ✗ | ✗ | ✗ | ✓ | ✗ |
| Access audit logs | ✗ | ✗ | ✓ | ✓ | ✗ |
| View escalations | ✗ | ✗ | ✓ | ✓ | ✗ |
| Resolve escalations | ✗ | ✗ | ✓ | ✓ | ✗ |

#### 1.5.3 Authentication Methods

**Mobile App (ASHA Workers):**
- Primary: Mobile number + OTP
- OTP: 6 digits, valid for 10 minutes
- OTP delivery: SMS via AWS SNS
- OTP generation: Cryptographically secure random number
- Rate limiting: Max 3 OTP requests per 15 minutes per mobile number
- Session duration: 7 days (refresh token)
- Biometric authentication: Optional (fingerprint/face ID) after initial OTP login
- Device binding: Optional, limit to 2 devices per user

**Web Dashboard (PHC Staff, Supervisors, Admins):**
- Primary: Email + password
- Password requirements:
  - Minimum 12 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character (!@#$%^&*)
  - Cannot contain username or email
  - Cannot be same as last 5 passwords
- Password expiry: 90 days (configurable)
- Session timeout: 60 minutes of inactivity
- Remember me: Optional, extends session to 30 days
- Multi-factor authentication (MFA):
  - Required for Admin role
  - Optional for other roles
  - Methods: TOTP (Google Authenticator, Authy), SMS OTP
- Password reset:
  - Email link with token (valid 1 hour)
  - Security questions (optional additional layer)
  - OTP to registered mobile (if available)

**Session Management:**
- JWT tokens for API authentication
- Access token expiry: 1 hour
- Refresh token expiry: 7 days (mobile), 30 days (web with remember me)
- Token refresh: Automatic before expiry
- Concurrent sessions: Allowed (max 3 active sessions per user)
- Force logout: Admin can force logout all sessions for a user
- Session activity log: Track login time, IP address, device, logout time

## 2. Non-Functional Requirements

### 2.1 Availability
- Target uptime: 99.5% (excluding planned maintenance)
- Maximum unplanned downtime: 4 hours per month
- Planned maintenance window: Sunday 2:00 AM - 4:00 AM IST (monthly)
- Advance notice for maintenance: 7 days via email and in-app notification
- Disaster recovery RTO (Recovery Time Objective): 4 hours
- Disaster recovery RPO (Recovery Point Objective): 1 hour
- Multi-AZ deployment for high availability
- Automated failover for critical services

### 2.2 Performance
- API response time (non-ML endpoints): <300ms at 95th percentile
- API response time (ML inference): <2000ms at 95th percentile
- Mobile app launch time: <3 seconds (cold start), <1 second (warm start)
- Web dashboard initial page load: <2 seconds
- Web dashboard subsequent navigation: <500ms
- Database query response: <100ms at 95th percentile
- Concurrent users supported:
  - 10,000 ASHA workers (mobile app)
  - 2,000 PHC staff (web dashboard)
  - 500 supervisors/admins (web dashboard)
- Referral submission throughput: 500 submissions per minute
- Voice transcription processing: <10 seconds for 60-second audio
- PDF generation: <5 seconds per referral slip
- Report export (10,000 records): <10 seconds
- Heatmap rendering (500 villages): <3 seconds

### 2.3 Security
**Data Encryption:**
- At rest: AES-256 encryption using AWS KMS
- In transit: TLS 1.3 (minimum TLS 1.2)
- Aadhaar number: Field-level encryption with separate KMS key
- Database: Encryption enabled for DynamoDB tables
- S3 buckets: Server-side encryption (SSE-KMS)
- Backup encryption: Enabled for all backups

**API Security:**
- Authentication: JWT tokens with RS256 signing
- Token expiry: Access token 1 hour, refresh token 7 days
- Rate limiting: 100 requests per minute per user
- IP-based rate limiting: 1000 requests per minute per IP
- DDoS protection: AWS Shield Standard (free tier)
- WAF rules: OWASP Top 10 protection
- SQL injection prevention: Parameterized queries, input validation
- XSS prevention: Input sanitization, output encoding, CSP headers
- CSRF protection: Token-based validation for state-changing operations

**Access Control:**
- Principle of least privilege enforced
- IAM roles for AWS service access
- Resource-based policies for S3, DynamoDB
- API Gateway authorizers for endpoint protection
- Row-level security: Users can only access data within their jurisdiction

**Audit Logging:**
- All data access logged (read operations)
- All data modifications logged (create, update, delete)
- Authentication events logged (login, logout, failed attempts)
- Authorization failures logged
- Log retention: 7 years (compliance requirement)
- Log integrity: Immutable logs in S3 with versioning

### 2.4 Scalability
- Target patient records: 1 million
- Target referrals per year: 500,000
- Target ASHA workers: 50,000
- Target PHCs: 5,000
- Database: DynamoDB with on-demand capacity mode (auto-scaling)
- API: Lambda with reserved concurrency (1000 concurrent executions)
- Storage: S3 with lifecycle policies
  - Hot data (0-90 days): S3 Standard
  - Warm data (90 days - 2 years): S3 Intelligent-Tiering
  - Cold data (2+ years): S3 Glacier
- ML inference: SageMaker auto-scaling
  - Min instances: 2
  - Max instances: 10
  - Target invocations per instance: 100/minute
  - Scale-up threshold: 70% utilization
  - Scale-down threshold: 30% utilization
- CDN: CloudFront for static assets and API caching
- Horizontal scaling: All services designed to scale horizontally

### 2.5 Offline Capability
**Mobile App Offline Features:**
- Offline tolerance: 48 hours without connectivity
- Local storage capacity: 500 referrals + 100 patient records
- Offline functionality:
  - Submit new referrals (queued for sync)
  - View cached referrals and patient data
  - Record follow-up notes
  - Voice recording (stored locally)
  - View cached analytics (last synced data)
- Online-only functionality:
  - Real-time status updates
  - AI risk scoring (cached for viewed referrals)
  - Live analytics and reports
  - User management
- Sync conflict resolution:
  - Server timestamp wins for status updates
  - Local changes logged in conflict_log table
  - User notified of conflicts with option to review
- Sync indicators:
  - Network status icon (online/offline)
  - Pending sync count badge
  - Last sync timestamp displayed
- Background sync:
  - Automatic when network available
  - Manual sync button available
  - Sync progress notification

### 2.6 Compliance
**Data Residency:**
- All data stored in AWS Mumbai region (ap-south-1)
- No data replication outside India
- Backup storage: Same region only

**PHI (Protected Health Information) Handling:**
- HIPAA-equivalent controls implemented
- Encryption at rest and in transit
- Access logs for all PHI access
- Audit trails for all modifications
- Data minimization: Collect only necessary data
- Purpose limitation: Data used only for stated purpose

**Data Retention:**
- Patient records: 7 years (as per Indian medical records guidelines)
- Referral records: 7 years
- Audit logs: 7 years
- SMS logs: 1 year
- Voice recordings: 2 years
- Analytics data: 5 years

**Data Deletion:**
- Soft delete: Records marked as deleted, retained for 90 days
- Hard delete: After 90-day recovery window
- Right to erasure: Patient can request data deletion (GDPR-like)
- Deletion process: Automated job runs weekly
- Deletion audit: All deletions logged with reason and approver

**Consent Management:**
- Patient consent recorded at referral submission
- Consent text: "I consent to share my health information with PHC and healthcare providers for treatment purposes"
- Consent withdrawal: Patient can withdraw consent (data access restricted)
- Consent audit: All consent actions logged

### 2.7 Monitoring & Logging
**Application Logs:**
- Log aggregation: CloudWatch Logs
- Log groups by service: API, Lambda functions, Mobile app, Web dashboard
- Log retention: 90 days in CloudWatch, archived to S3 for 7 years
- Log levels: ERROR, WARN, INFO, DEBUG
- Structured logging: JSON format with standard fields
  - timestamp, level, service, function, user_id, request_id, message, metadata

**Audit Logs:**
- Storage: S3 bucket with versioning and MFA delete
- Format: JSON Lines (JSONL)
- Fields: timestamp, user_id, action, resource_type, resource_id, ip_address, user_agent, result, details
- Retention: 7 years
- Access: Restricted to admins and auditors
- Integrity: SHA-256 hash for each log entry

**Metrics:**
- CloudWatch Metrics for:
  - API latency (p50, p95, p99)
  - API error rates (4xx, 5xx)
  - Lambda invocations, duration, errors
  - DynamoDB read/write capacity, throttles
  - SageMaker inference latency, errors
  - User activity (logins, referrals submitted, status updates)
- Custom metrics:
  - Referrals by risk level (daily)
  - Completion rate (daily)
  - Average time to completion (daily)
  - Escalation count (daily)
- Metric retention: 15 months

**Alerts:**
- Alert channels: SNS → Email, SMS, Slack
- Alert rules:
  - API error rate >5% for 5 minutes → Critical
  - API latency p95 >500ms for 10 minutes → Warning
  - ML inference failures >10% for 5 minutes → Critical
  - Database throttling detected → Warning
  - Lambda concurrent executions >80% of limit → Warning
  - Disk space >80% → Warning
  - Failed login attempts >10 in 5 minutes (same user) → Security alert
  - Escalation count >50 (daily) → Warning to DHO
- On-call rotation: PagerDuty integration for critical alerts

**Dashboard:**
- Real-time system health monitoring (CloudWatch Dashboard)
- Widgets:
  - API request rate and latency
  - Error rate by endpoint
  - Lambda invocations and errors
  - Database performance metrics
  - ML inference metrics
  - Active users count
  - Referral submission rate
- Refresh interval: 1 minute
- Historical view: Last 24 hours, 7 days, 30 days

## 3. Data Requirements

### 3.1 Database Schema (DynamoDB)

#### Table: Patients
```
Table Name: bharat-carelink-patients
Primary Key: patient_id (String)
GSI1: aadhaar_number (PK) - for lookup by Aadhaar
GSI2: created_by_asha_id (PK) + created_at (SK) - for ASHA's patient list
GSI3: village_code (PK) + created_at (SK) - for village-wise reports

Attributes:
- patient_id (String, format: {ASHA_CODE}-{YYYYMMDD}-{SEQUENCE})
- aadhaar_number (String, encrypted, 12 digits)
- full_name (String, max 100 chars)
- age (Number, 0-120)
- gender (String, enum: male|female|other)
- mobile_number (String, 10 digits)
- village_code (String)
- village_name (String)
- address (String, max 200 chars)
- created_by_asha_id (String)
- created_by_asha_name (String)
- created_at (Number, Unix timestamp milliseconds)
- updated_at (Number, Unix timestamp milliseconds)
- is_deleted (Boolean, default: false)
```

#### Table: Referrals
```
Table Name: bharat-carelink-referrals
Primary Key: referral_id (String)
Sort Key: created_at (Number)
GSI1: phc_code (PK) + risk_score (SK, descending) - for PHC queue sorted by risk
GSI2: asha_id (PK) + created_at (SK) - for ASHA's referral list
GSI3: status (PK) + created_at (SK) - for status-based filtering
GSI4: patient_id (PK) + created_at (SK) - for patient's referral history

Attributes:
- referral_id (String, format: REF-{STATE}-{DISTRICT}-{YYYYMMDD}-{SEQUENCE})
- patient_id (String)
- patient_name (String, denormalized for display)
- patient_age (Number, denormalized)
- patient_gender (String, denormalized)
- referral_type (String, enum: pregnancy|malnutrition|tb_suspect|chronic_disease)
- form_data (Map, all form fields as key-value pairs)
- risk_score (Number, 0.00-1.00, 2 decimal precision)
- risk_level (String, enum: low|medium|high)
- risk_factors (List of Maps, top 5 contributing factors)
- ai_summary (String, max 1000 chars)
- ai_summary_hindi (String, max 1000 chars, optional)
- recommendations (List of Strings)
- asha_id (String)
- asha_name (String)
- asha_mobile (String)
- phc_code (String)
- phc_name (String)
- village_code (String)
- village_name (String)
- status (String, enum: submitted|received_at_phc|under_evaluation|completed|follow_up_required|closed)
- status_history (List of Maps: {status, timestamp, updated_by, notes})
- geolocation (Map: {lat: Number, lon: Number})
- audio_file_s3_keys (List of Strings)
- pdf_s3_key (String, referral slip PDF)
- created_at (Number, Unix timestamp)
- updated_at (Number, Unix timestamp)
- completed_at (Number, Unix timestamp, nullable)
- completion_data (Map, nullable, includes diagnosis, treatment, outcome)
- is_deleted (Boolean, default: false)
```

#### Table: Users
```
Table Name: bharat-carelink-users
Primary Key: user_id (String, UUID)
GSI1: email (PK) - for login by email
GSI2: mobile_number (PK) - for login by mobile
GSI3: phc_code (PK) + role (SK) - for PHC staff listing

Attributes:
- user_id (String, UUID)
- email (String, unique)
- mobile_number (String, 10 digits, unique)
- password_hash (String, bcrypt)
- full_name (String, max 100 chars)
- role (String, enum: asha_worker|phc_staff|supervisor|admin|data_analyst)
- asha_code (String, nullable, for ASHA workers)
- phc_code (String, nullable)
- phc_name (String, nullable)
- block_code (String, nullable)
- block_name (String, nullable)
- district_code (String, nullable)
- district_name (String, nullable)
- state_code (String)
- state_name (String)
- is_active (Boolean, default: true)
- mfa_enabled (Boolean, default: false)
- mfa_secret (String, encrypted, nullable)
- created_at (Number, Unix timestamp)
- updated_at (Number, Unix timestamp)
- last_login_at (Number, Unix timestamp)
- password_changed_at (Number, Unix timestamp)
- failed_login_attempts (Number, default: 0)
- locked_until (Number, Unix timestamp, nullable)
```

#### Table: FollowUps
```
Table Name: bharat-carelink-followups
Primary Key: follow_up_id (String, UUID)
GSI1: referral_id (PK) + scheduled_date (SK) - for referral's follow-ups
GSI2: asha_id (PK) + scheduled_date (SK) - for ASHA's follow-up list
GSI3: status (PK) + scheduled_date (SK) - for pending follow-ups

Attributes:
- follow_up_id (String, UUID)
- referral_id (String)
- patient_id (String)
- patient_name (String, denormalized)
- asha_id (String)
- scheduled_date (Number, Unix timestamp)
- status (String, enum: pending|completed|missed|cancelled)
- completed_date (Number, Unix timestamp, nullable)
- outcome_notes (String, max 300 chars, nullable)
- outcome_status (String, enum: patient_visited|patient_unreachable|patient_refused|other, nullable)
- next_action_required (Boolean, nullable)
- next_follow_up_date (Number, Unix timestamp, nullable)
- completed_by_user_id (String, nullable)
- reminder_sent_at (Number, Unix timestamp)
- reminder_count (Number, default: 0)
- created_at (Number, Unix timestamp)
- updated_at (Number, Unix timestamp)
```

#### Table: Escalations
```
Table Name: bharat-carelink-escalations
Primary Key: escalation_id (String, format: ESC-{YYYYMMDD}-{SEQUENCE})
GSI1: referral_id (PK) + escalation_date (SK) - for referral's escalations
GSI2: assigned_to_user_id (PK) + status (SK) - for user's escalation queue
GSI3: status (PK) + escalation_level (SK) - for open escalations by level

Attributes:
- escalation_id (String)
- referral_id (String)
- patient_name (String, denormalized)
- asha_id (String)
- asha_name (String)
- phc_code (String)
- escalation_level (Number, 1-3)
- escalation_date (Number, Unix timestamp)
- assigned_to_user_id (String)
- assigned_to_name (String)
- assigned_to_role (String)
- reason (String, max 500 chars)
- status (String, enum: open|in_progress|resolved|closed)
- resolution_notes (String, max 1000 chars, nullable)
- resolved_at (Number, Unix timestamp, nullable)
- resolved_by_user_id (String, nullable)
- resolved_by_name (String, nullable)
- created_at (Number, Unix timestamp)
- updated_at (Number, Unix timestamp)
```

#### Table: AuditLogs
```
Table Name: bharat-carelink-audit-logs
Primary Key: log_id (String, UUID)
Sort Key: timestamp (Number)
GSI1: user_id (PK) + timestamp (SK) - for user's activity log
GSI2: resource_type (PK) + timestamp (SK) - for resource-based audit
GSI3: action (PK) + timestamp (SK) - for action-based audit

Attributes:
- log_id (String, UUID)
- user_id (String)
- user_name (String)
- user_role (String)
- action (String, e.g., create_referral, update_status, view_patient, delete_user)
- resource_type (String, e.g., referral, patient, user)
- resource_id (String)
- ip_address (String)
- user_agent (String)
- timestamp (Number, Unix timestamp)
- result (String, enum: success|failure)
- failure_reason (String, nullable)
- details (Map, additional context)
- request_id (String, for correlation)
```

#### Table: SMSLogs
```
Table Name: bharat-carelink-sms-logs
Primary Key: sms_id (String, format: SMS-{TIMESTAMP}-{SEQUENCE})
GSI1: referral_id (PK) + sent_at (SK) - for referral's SMS history
GSI2: recipient_mobile (PK) + sent_at (SK) - for recipient's SMS history
GSI3: delivery_status (PK) + sent_at (SK) - for failed SMS tracking

Attributes:
- sms_id (String)
- recipient_mobile (String, 10 digits)
- recipient_name (String)
- message (String, max 160 chars)
- notification_type (String, e.g., referral_submitted, status_updated, reminder)
- referral_id (String, nullable)
- sent_at (Number, Unix timestamp)
- delivery_status (String, enum: sent|delivered|failed|undelivered)
- delivered_at (Number, Unix timestamp, nullable)
- failure_reason (String, nullable)
- retry_count (Number, default: 0)
- sns_message_id (String)
- cost (Number, in INR, nullable)
```

### 3.2 Example JSON Structures

#### Patient Record Example
```json
{
  "patient_id": "ASH001-20260215-001",
  "aadhaar_number": "encrypted_aadhaar_value_here",
  "full_name": "Priya Sharma",
  "age": 24,
  "gender": "female",
  "mobile_number": "9876543210",
  "village_code": "UP12-V001",
  "village_name": "Rampur",
  "address": "House No 45, Rampur Village, Sitapur District, Uttar Pradesh",
  "created_by_asha_id": "ASH001",
  "created_by_asha_name": "Sunita Devi",
  "created_at": 1739577600000,
  "updated_at": 1739577600000,
  "is_deleted": false
}
```

#### Referral Record Example (Pregnancy)
```json
{
  "referral_id": "REF-UP-12-20260215-000123",
  "patient_id": "ASH001-20260215-001",
  "patient_name": "Priya Sharma",
  "patient_age": 24,
  "patient_gender": "female",
  "referral_type": "pregnancy",
  "form_data": {
    "gravida": 2,
    "parity": 1,
    "gestational_age_weeks": 32,
    "lmp_date": "2025-07-01",
    "edd_date": "2026-04-07",
    "hemoglobin_level": 8.5,
    "blood_pressure_systolic": 150,
    "blood_pressure_diastolic": 95,
    "weight_kg": 58.5,
    "height_cm": 155,
    "bmi": 24.3,
    "anc_visits_completed": 3,
    "high_risk_symptoms": ["severe_headache", "blurred_vision", "swelling"],
    "previous_complications": ["preeclampsia"],
    "referral_reason": "High BP with symptoms of preeclampsia, requires immediate evaluation"
  },
  "risk_score": 0.78,
  "risk_level": "high",
  "risk_factors": [
    {
      "factor": "blood_pressure_systolic",
      "contribution": 0.30,
      "value": 150,
      "normal_range": "90-120 mmHg",
      "severity": "high"
    },
    {
      "factor": "hemoglobin_level",
      "contribution": 0.25,
      "value": 8.5,
      "normal_range": "11-14 g/dL",
      "severity": "high"
    },
    {
      "factor": "previous_preeclampsia",
      "contribution": 0.23,
      "value": true,
      "normal_range": "false",
      "severity": "high"
    }
  ],
  "ai_summary": "32-week pregnant woman with history of preeclampsia presenting with elevated BP (150/95), moderate anemia (Hb 8.5), and concerning symptoms including severe headache, blurred vision, and swelling. Immediate evaluation required to rule out preeclampsia recurrence. Recommend BP monitoring, urine protein test, and consideration for early delivery planning.",
  "recommendations": [
    "Immediate referral to district hospital for evaluation",
    "Monitor blood pressure every 4 hours",
    "Administer iron supplementation (100mg elemental iron daily)",
    "Urine protein test to rule out preeclampsia",
    "Fetal monitoring (NST) recommended"
  ],
  "asha_id": "ASH001",
  "asha_name": "Sunita Devi",
  "asha_mobile": "9876543211",
  "phc_code": "PHC-UP-12-001",
  "phc_name": "Rampur Primary Health Centre",
  "village_code": "UP12-V001",
  "village_name": "Rampur",
  "status": "submitted",
  "status_history": [
    {
      "status": "submitted",
      "timestamp": 1739577600000,
      "updated_by": "ASH001",
      "updated_by_name": "Sunita Devi",
      "notes": null
    }
  ],
  "geolocation": {
    "lat": 27.5706,
    "lon": 80.6783
  },
  "audio_file_s3_keys": [
    "audio/2026/02/15/ASH001-1739577600000-symptoms.mp3",
    "audio/2026/02/15/ASH001-1739577600001-history.mp3"
  ],
  "pdf_s3_key": "referral-slips/2026/02/REF-UP-12-20260215-000123.pdf",
  "created_at": 1739577600000,
  "updated_at": 1739577600000,
  "completed_at": null,
  "completion_data": null,
  "is_deleted": false
}
```

#### Risk Model Input Schema (Pregnancy)
```json
{
  "model_type": "pregnancy_risk",
  "model_version": "v1.2.0",
  "features": {
    "age": 24,
    "gravida": 2,
    "parity": 1,
    "gestational_age_weeks": 32,
    "hemoglobin_level": 8.5,
    "blood_pressure_systolic": 150,
    "blood_pressure_diastolic": 95,
    "bmi": 24.3,
    "anc_visits_completed": 3,
    "has_bleeding": false,
    "has_severe_headache": true,
    "has_blurred_vision": true,
    "has_convulsions": false,
    "has_reduced_fetal_movement": false,
    "has_fever": false,
    "has_swelling": true,
    "previous_preeclampsia": true,
    "previous_gestational_diabetes": false,
    "previous_preterm_birth": false,
    "previous_stillbirth": false,
    "previous_cesarean": false,
    "rural_location": true,
    "distance_to_phc_km": 12.5
  }
}
```

## 4. Acceptance Criteria

### 4.1 ASHA Mobile App
- [ ] Voice input successfully transcribes Hindi/Tamil/Telugu/Bengali with >85% accuracy
- [ ] All form fields validate correctly (data types, ranges, required fields)
- [ ] Referral submission generates unique ID within 3 seconds
- [ ] Offline mode stores minimum 500 records without performance degradation
- [ ] Sync completes within 5 minutes for 100 pending referrals on 3G network
- [ ] Status updates display within 30 seconds of server change (WebSocket or polling)
- [ ] Follow-up reminders trigger correctly at day 7 and day 14
- [ ] App functions offline for 48 hours without data loss
- [ ] App launch time <3 seconds on mid-range Android device (4GB RAM)
- [ ] Battery consumption <5% per hour of active use

### 4.2 PHC Web Dashboard
- [ ] Referral queue loads within 2 seconds with 1000 records
- [ ] Risk score sorting displays highest risk first by default
- [ ] Filters apply within 500ms and update URL for bookmarking
- [ ] AI case summary generates within 3 seconds using Bedrock
- [ ] Status update saves and notifies ASHA within 5 seconds
- [ ] Analytics dashboard loads within 3 seconds with all widgets
- [ ] Heatmap displays correctly for 500+ villages with clustering
- [ ] Export to CSV completes within 10 seconds for 10,000 records
- [ ] Dashboard responsive on tablets (iPad, Android tablets)
- [ ] All charts interactive with drill-down capability

### 4.3 AI Risk Scoring Engine
- [ ] Pregnancy risk model achieves AUC >0.80 on validation set
- [ ] Malnutrition risk model achieves AUC >0.82 on validation set
- [ ] TB risk model achieves AUC >0.78 on validation set
- [ ] Inference completes within 2 seconds at 95th percentile
- [ ] Risk factors correctly ranked by contribution (SHAP values)
- [ ] Model outputs match defined JSON schema 100% of time
- [ ] Recommendations generated for all high-risk cases
- [ ] Model handles missing features gracefully (imputation)
- [ ] Model versioning tracked and logged for each prediction

### 4.4 Follow-Up & Alert System
- [ ] Day 7 reminder sent to ASHA worker via SMS and in-app notification
- [ ] Day 14 reminder sent to ASHA + supervisor notification via email
- [ ] Day 21 escalation creates ticket and notifies Block Medical Officer
- [ ] SMS delivery success rate >95% (measured over 30 days)
- [ ] In-app notifications display within 10 seconds of trigger
- [ ] Escalation dashboard shows all pending escalations with correct counts
- [ ] Follow-up completion updates referral status and creates audit log
- [ ] Reminder snooze functionality works correctly (2 days, 5 days, custom)
- [ ] Escalation emails contain correct referral details and dashboard link

### 4.5 Authentication & Authorization
- [ ] OTP delivered within 30 seconds via SMS
- [ ] Login completes within 3 seconds after OTP verification
- [ ] Permission matrix enforced for all API endpoints (tested with automated tests)
- [ ] Unauthorized access attempts logged and blocked with 403 response
- [ ] Session timeout enforced (30 min mobile, 60 min web)
- [ ] MFA required for admin role (cannot bypass)
- [ ] Password complexity requirements enforced on registration and reset
- [ ] Failed login attempts (>5) lock account for 30 minutes
- [ ] Biometric authentication works on supported devices (Android/iOS)

### 4.6 Performance & Scalability
- [ ] API response time <300ms for 95% of non-ML requests (measured with load testing)
- [ ] ML inference <2000ms for 95% of requests (measured with load testing)
- [ ] System supports 10,000 concurrent ASHA users (load test verified)
- [ ] Database handles 500 referral submissions per minute (load test verified)
- [ ] System maintains 99.5% uptime over 30-day period (monitored)
- [ ] Auto-scaling triggers correctly under load (scale-up and scale-down)
- [ ] CloudFront cache hit rate >80% for static assets
- [ ] DynamoDB read/write capacity scales without throttling

### 4.7 Security & Compliance
- [ ] All data encrypted at rest using AES-256 (verified in AWS console)
- [ ] All API calls use TLS 1.3 (verified with SSL Labs test)
- [ ] Aadhaar numbers encrypted with separate KMS key (field-level encryption)
- [ ] Audit logs capture all data access and modifications (spot-checked)
- [ ] Rate limiting prevents abuse (100 req/min per user, tested)
- [ ] SQL injection tests pass (OWASP ZAP scan)
- [ ] XSS tests pass (OWASP ZAP scan)
- [ ] CSRF protection enabled for all state-changing operations
- [ ] Data stored only in ap-south-1 region (verified in AWS console)
- [ ] Data retention policy enforced (7 years, automated cleanup job)
- [ ] Penetration testing completed with no critical vulnerabilities
- [ ] VAPT (Vulnerability Assessment and Penetration Testing) report approved

### 4.8 Offline Capability
- [ ] Mobile app stores 500 referrals locally without performance issues
- [ ] Sync completes successfully after 48 hours offline
- [ ] Conflict resolution works correctly (server timestamp wins)
- [ ] User notified of sync conflicts with details
- [ ] Offline indicator displays correctly (online/offline status)
- [ ] Pending sync count badge updates in real-time
- [ ] Manual sync button triggers sync immediately

### 4.9 Monitoring & Logging
- [ ] CloudWatch dashboard displays all key metrics in real-time
- [ ] Alerts trigger correctly for defined thresholds (tested)
- [ ] Audit logs contain all required fields (spot-checked)
- [ ] Log retention policies enforced (90 days CloudWatch, 7 years S3)
- [ ] On-call rotation receives critical alerts via PagerDuty
- [ ] System health monitoring accessible to ops team 24/7
