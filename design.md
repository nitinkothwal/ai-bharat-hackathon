# Bharat CareLink – System Design Specification

## Table of Contents
1. [High-Level Architecture](#1-high-level-architecture)
2. [Detailed Component Design](#2-detailed-component-design)
3. [Monitoring & Observability](#3-monitoring--observability)
4. [Security & Compliance Strategy](#4-security--compliance-strategy)

## 1. High-Level Architecture


### 1.1 Architecture Diagram

![Bharat CareLink AWS Architecture](bharat_carelink_architecture.png)

#### Technical Flow (Mermaid)
graph TD
    subgraph Clients ["Client Layer"]
        ASHA["ASHA Mobile App (React Native)"]
        PHC["PHC Web Dashboard (React)"]
        Supervisor["Supervisor Dashboard (React)"]
    end

    subgraph Entry ["Edge & Gateway"]
        CF["CloudFront (CDN + WAF)"]
        AGW["API Gateway (REST + WS)"]
        Cognito["Cognito (Auth)"]
    end

    subgraph Logic ["Serverless Logic"]
        Lambda["Lambda Functions (Node.js)"]
        EB["EventBridge (Events)"]
    end

    subgraph AI ["AI & ML Services"]
        Transcribe["Transcribe (Voice input)"]
        Translate["Translate (Language)"]
        SageMaker["SageMaker (Risk Scoring)"]
        Bedrock["Bedrock (Claude 3.5 Sonnet)"]
    end

    subgraph Storage ["Data & Storage"]
        DDB["DynamoDB (NoSQL)"]
        S3["S3 (Storage)"]
        KMS["KMS (Encryption)"]
    end

    subgraph Notify ["Notifications"]
        SNS["SNS (SMS + Push)"]
        SES["SES (Email)"]
    end

    subgraph Monitor ["Monitoring"]
        CW["CloudWatch (Logs + Metrics)"]
    end

    %% Connections
    ASHA --> CF
    PHC --> CF
    Supervisor --> CF
    CF --> AGW
    AGW --> Cognito
    AGW --> Lambda
    Lambda --> EB
    Lambda --> DDB
    Lambda --> S3
    Lambda --> SageMaker
    Lambda --> Bedrock
    Lambda --> SNS
    Lambda --> Transcribe
    Lambda --> Translate
    EB --> Lambda
    DDB -.-> KMS
    S3 -.-> KMS
    Lambda --> CW
```


### 1.2 Data Flow: End-to-End Referral Process

**Step 1: Voice Input Capture (ASHA Mobile App)**
1. ASHA worker opens referral form in mobile app
2. Taps microphone icon for specific form field
3. Audio recorded locally using device microphone (max 60 seconds)
4. Audio file saved to local storage: `{local_db}/audio/{timestamp}.mp3`
5. Transcription button appears after recording

**Step 2: Voice Transcription (AWS Transcribe)**
1. When network available, audio uploaded to S3 bucket: `bharat-carelink-audio-input/{asha_id}/{YYYY}/{MM}/{DD}/{timestamp}.mp3`
2. S3 event triggers Lambda function `transcribe-audio-handler`
3. Lambda starts Transcribe job:
   ```javascript
   const params = {
     TranscriptionJobName: `transcribe-${timestamp}`,
     LanguageCode: 'hi-IN', // or auto-detect
     MediaFormat: 'mp3',
     Media: { MediaFileUri: s3Uri },
     OutputBucketName: 'bharat-carelink-transcriptions',
     Settings: {
       ShowAlternatives: true,
       MaxAlternatives: 3
     }
   };
   ```
4. Transcribe processes audio (async, 5-10 seconds)
5. Completion triggers Lambda `process-transcription`
6. Lambda extracts text and confidence score
7. If confidence >0.85: Auto-fill form field
8. If confidence <0.85: Show transcription with "Confirm or Edit" prompt
9. Transcription result sent to mobile app via WebSocket or polling

**Step 3: Form Submission & Referral Creation**
1. ASHA completes form (voice + manual input)
2. Clicks "Submit Referral" button
3. App validates all required fields locally
4. If offline: Store in SQLite `pending_referrals` table, show "Queued for sync" message
5. If online: POST request to API Gateway `/v1/referrals`
   ```json
   POST /v1/referrals
   Authorization: Bearer {jwt_token}
   Content-Type: application/json
   
   {
     "patient_id": "ASH001-20260215-001",
     "referral_type": "pregnancy",
     "form_data": {...},
     "geolocation": {"lat": 27.5706, "lon": 80.6783},
     "audio_file_keys": ["audio/..."]
   }
   ```
6. API Gateway validates JWT token via Cognito Authorizer
7. API Gateway invokes Lambda function `create-referral`

**Step 4: Referral ID Generation & Storage**
1. Lambda `create-referral` generates unique referral ID:
   ```javascript
   // Use DynamoDB atomic counter
   const counterResult = await dynamodb.update({
     TableName: 'bharat-carelink-counters',
     Key: { counter_type: 'referral', date: '20260215' },
     UpdateExpression: 'ADD sequence_number :inc',
     ExpressionAttributeValues: { ':inc': 1 },
     ReturnValues: 'UPDATED_NEW'
   });
   
   const referralId = `REF-UP-12-20260215-${String(counterResult.Attributes.sequence_number).padStart(6, '0')}`;
   ```
2. Store patient data in `Patients` table (if new patient):
   ```javascript
   await dynamodb.put({
     TableName: 'bharat-carelink-patients',
     Item: {
       patient_id: patientId,
       aadhaar_number: await encryptAadhaar(aadhaarNumber),
       full_name: fullName,
       // ... other fields
       created_at: Date.now()
     },
     ConditionExpression: 'attribute_not_exists(patient_id)' // Prevent duplicates
   });
   ```
3. Store referral data in `Referrals` table:
   ```javascript
   await dynamodb.put({
     TableName: 'bharat-carelink-referrals',
     Item: {
       referral_id: referralId,
       patient_id: patientId,
       referral_type: referralType,
       form_data: formData,
       status: 'submitted',
       status_history: [{
         status: 'submitted',
         timestamp: Date.now(),
         updated_by: ashaId
       }],
       // ... other fields
       created_at: Date.now()
     }
   });
   ```

**Step 5: AI Risk Scoring (SageMaker)**
1. Lambda `create-referral` invokes Lambda `score-risk` asynchronously
2. `score-risk` extracts features from form_data:
   ```javascript
   const features = {
     age: formData.age,
     gravida: formData.gravida,
     hemoglobin_level: formData.hemoglobin_level,
     blood_pressure_systolic: formData.blood_pressure_systolic,
     // ... all 23 features
   };
   ```
3. Call appropriate SageMaker endpoint based on referral_type:
   ```javascript
   const endpointName = referralType === 'pregnancy' 
     ? 'pregnancy-risk-endpoint-v1-2-0'
     : referralType === 'malnutrition'
     ? 'malnutrition-risk-endpoint-v1-1-0'
     : 'tb-risk-endpoint-v1-0-0';
   
   const response = await sagemakerRuntime.invokeEndpoint({
     EndpointName: endpointName,
     ContentType: 'application/json',
     Body: JSON.stringify({ features })
   });
   
   const prediction = JSON.parse(response.Body.toString());
   // prediction = { risk_score: 0.78, risk_level: 'high', risk_factors: [...] }
   ```
4. Update referral record with risk scoring results:
   ```javascript
   await dynamodb.update({
     TableName: 'bharat-carelink-referrals',
     Key: { referral_id: referralId },
     UpdateExpression: 'SET risk_score = :score, risk_level = :level, risk_factors = :factors',
     ExpressionAttributeValues: {
       ':score': prediction.risk_score,
       ':level': prediction.risk_level,
       ':factors': prediction.risk_factors
     }
   });
   ```

**Step 6: AI Case Summary Generation (Bedrock)**
1. Lambda `generate-summary` invoked asynchronously (non-blocking)
2. Construct prompt for Bedrock Claude 3.5 Sonnet:
   ```javascript
   const prompt = `Generate a clinical case summary for the following patient referral:
   
   Patient: ${age} year old ${gender}
   Referral Type: ${referralType}
   Risk Score: ${riskScore} (${riskLevel})
   
   Clinical Data:
   ${formatFormData(formData)}
   
   Top Risk Factors:
   ${formatRiskFactors(riskFactors)}
   
   Provide a 150-300 word summary highlighting:
   1. Key clinical findings
   2. Primary risk factors
   3. Recommended immediate actions
   4. Urgency level assessment
   
   Use clear, professional medical language suitable for PHC staff.`;
   ```
3. Call Bedrock API:
   ```javascript
   const response = await bedrockRuntime.invokeModel({
     modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
     contentType: 'application/json',
     accept: 'application/json',
     body: JSON.stringify({
       anthropic_version: 'bedrock-2023-05-31',
       max_tokens: 500,
       messages: [{
         role: 'user',
         content: prompt
       }],
       temperature: 0.3 // Low temperature for consistent medical summaries
     })
   });
   
   const result = JSON.parse(response.body.toString());
   const aiSummary = result.content[0].text;
   ```
4. Translate summary to Hindi using AWS Translate (optional):
   ```javascript
   const translatedSummary = await translate.translateText({
     Text: aiSummary,
     SourceLanguageCode: 'en',
     TargetLanguageCode: 'hi'
   });
   ```
5. Update referral record with AI summary:
   ```javascript
   await dynamodb.update({
     TableName: 'bharat-carelink-referrals',
     Key: { referral_id: referralId },
     UpdateExpression: 'SET ai_summary = :summary, ai_summary_hindi = :summary_hi',
     ExpressionAttributeValues: {
       ':summary': aiSummary,
       ':summary_hi': translatedSummary.TranslatedText
     }
   });
   ```

**Step 7: Event Publishing (EventBridge)**
1. Lambda `create-referral` publishes event to EventBridge:
   ```javascript
   await eventBridge.putEvents({
     Entries: [{
       Source: 'bharat-carelink',
       DetailType: 'ReferralCreated',
       Detail: JSON.stringify({
         referral_id: referralId,
         patient_id: patientId,
         risk_level: riskLevel,
         risk_score: riskScore,
         referral_type: referralType,
         phc_code: phcCode,
         asha_id: ashaId,
         timestamp: Date.now()
       }),
       EventBusName: 'bharat-carelink-events'
     }]
   });
   ```

**Step 8: Notification Dispatch (SNS)**
1. EventBridge rule matches `ReferralCreated` event
2. Rule triggers Lambda function `send-notifications`
3. Lambda retrieves patient and ASHA contact info from DynamoDB
4. Generate PDF referral slip:
   ```javascript
   const pdfBuffer = await generatePDF({
     referralId,
     patientName,
     formData,
     riskScore,
     phcDetails
   });
   
   await s3.putObject({
     Bucket: 'bharat-carelink-referral-slips',
     Key: `2026/02/${referralId}.pdf`,
     Body: pdfBuffer,
     ContentType: 'application/pdf',
     ServerSideEncryption: 'aws:kms'
   });
   ```
5. Send SMS to patient (if mobile available):
   ```javascript
   await sns.publish({
     PhoneNumber: `+91${patientMobile}`,
     Message: `Your referral ${referralId} submitted to ${phcName}. Visit within 3 days. Contact: ${phcPhone} - BHRTCL`,
     MessageAttributes: {
       'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: 'BHRTCL' },
       'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' }
     }
   });
   ```
6. Send SMS to ASHA worker:
   ```javascript
   await sns.publish({
     PhoneNumber: `+91${ashaMobile}`,
     Message: `Referral ${referralId} submitted successfully. Risk: ${riskLevel}. Track status in app. - BHRTCL`
   });
   ```
7. Send push notification to ASHA mobile app:
   ```javascript
   await sns.publish({
     TargetArn: ashaDeviceEndpointArn,
     Message: JSON.stringify({
       default: 'Referral submitted successfully',
       GCM: JSON.stringify({
         notification: {
           title: 'Referral Submitted',
           body: `Referral ${referralId} created. Risk: ${riskLevel}`,
           sound: 'default'
         },
         data: {
           referral_id: referralId,
           type: 'referral_created'
         }
       })
     }),
     MessageStructure: 'json'
   });
   ```
8. Log SMS delivery in `SMSLogs` table

**Step 9: PHC Dashboard Display**
1. PHC staff logs into web dashboard (React app hosted on S3 + CloudFront)
2. Dashboard makes API call:
   ```javascript
   GET /v1/referrals?phc_code=PHC-UP-12-001&sort=risk_score_desc&limit=50&offset=0
   Authorization: Bearer {jwt_token}
   ```
3. API Gateway invokes Lambda `get-referrals`
4. Lambda queries DynamoDB GSI1 (phc_code + risk_score):
   ```javascript
   const result = await dynamodb.query({
     TableName: 'bharat-carelink-referrals',
     IndexName: 'GSI1-phc-risk',
     KeyConditionExpression: 'phc_code = :phc',
     ExpressionAttributeValues: { ':phc': phcCode },
     ScanIndexForward: false, // Descending order (highest risk first)
     Limit: 50
   });
   ```
5. Lambda returns paginated list with LastEvaluatedKey for next page
6. React dashboard renders referral queue table with color coding

**Step 10: Referral Status Update**
1. PHC staff clicks referral row, views patient detail page
2. Clicks "Update Status" button, fills completion form
3. Submits form:
   ```javascript
   PUT /v1/referrals/{referral_id}/status
   Authorization: Bearer {jwt_token}
   Content-Type: application/json
   
   {
     "status": "completed",
     "completion_data": {
       "diagnosis": "Preeclampsia confirmed",
       "treatment_provided": "Antihypertensive medication started...",
       "outcome": "improved",
       "phc_staff_notes": "Patient stable, scheduled for follow-up"
     }
   }
   ```
4. API Gateway invokes Lambda `update-referral-status`
5. Lambda updates DynamoDB:
   ```javascript
   await dynamodb.update({
     TableName: 'bharat-carelink-referrals',
     Key: { referral_id: referralId },
     UpdateExpression: 'SET #status = :status, completion_data = :data, completed_at = :timestamp, status_history = list_append(status_history, :history)',
     ExpressionAttributeNames: { '#status': 'status' },
     ExpressionAttributeValues: {
       ':status': 'completed',
       ':data': completionData,
       ':timestamp': Date.now(),
       ':history': [{
         status: 'completed',
         timestamp: Date.now(),
         updated_by: userId,
         updated_by_name: userName,
         notes: completionData.phc_staff_notes
       }]
     }
   });
   ```
6. Lambda publishes `ReferralStatusUpdated` event to EventBridge
7. EventBridge triggers `send-notifications` Lambda
8. Notification sent to ASHA worker via SMS and push notification

**Step 11: Follow-Up Scheduling (EventBridge Scheduler)**
1. When referral created, Lambda `create-referral` creates scheduled event:
   ```javascript
   await scheduler.createSchedule({
     Name: `follow-up-reminder-${referralId}-day7`,
     ScheduleExpression: `at(${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()})`,
     Target: {
       Arn: 'arn:aws:lambda:ap-south-1:ACCOUNT_ID:function:send-follow-up-reminder',
       Input: JSON.stringify({ referral_id: referralId, reminder_day: 7 })
     },
     FlexibleTimeWindow: { Mode: 'OFF' }
   });
   ```
2. At day 7, EventBridge Scheduler triggers Lambda `send-follow-up-reminder`
3. Lambda checks referral status:
   ```javascript
   const referral = await dynamodb.get({
     TableName: 'bharat-carelink-referrals',
     Key: { referral_id: referralId }
   });
   
   if (referral.Item.status !== 'completed' && referral.Item.status !== 'closed') {
     // Send reminder
     await sendReminderNotification(referral.Item);
     
     // Create follow-up record
     await dynamodb.put({
       TableName: 'bharat-carelink-followups',
       Item: {
         follow_up_id: uuidv4(),
         referral_id: referralId,
         scheduled_date: Date.now(),
         status: 'pending',
         reminder_sent_at: Date.now()
       }
     });
   }
   ```
4. Similar schedules created for day 14 and day 21 with escalation logic

## 2. Detailed Component Design

### 2.1 Frontend Applications

#### 2.1.1 ASHA Mobile App (React Native)

**Technology Stack:**
- React Native 0.73.2
- TypeScript 5.3
- Redux Toolkit 2.0 for state management
- React Navigation 6.x for routing
- SQLite (react-native-sqlite-storage 6.0) for offline storage
- AWS Amplify SDK 6.x for API calls and authentication
- React Native Voice 3.2 for audio recording
- React Native Push Notifications (FCM/APNS)
- React Native NetInfo for network status
- React Native Geolocation for GPS coordinates

**Project Structure:**
```
src/
├── components/
│   ├── VoiceInputButton.tsx
│   ├── ReferralForm.tsx
│   ├── StatusBadge.tsx
│   └── SyncIndicator.tsx
├── screens/
│   ├── AuthScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── ReferralFormScreen.tsx
│   ├── StatusTrackerScreen.tsx
│   └── FollowUpScreen.tsx
├── services/
│   ├── api.ts (API client with retry logic)
│   ├── offline.ts (Offline sync manager)
│   ├── voice.ts (Voice recording and transcription)
│   └── auth.ts (Authentication service)
├── store/
│   ├── referralsSlice.ts
│   ├── authSlice.ts
│   └── syncSlice.ts
├── utils/
│   ├── validation.ts
│   ├── encryption.ts
│   └── calculations.ts (BMI, z-scores)
└── database/
    └── schema.ts (SQLite schema)
```

**Key Components:**

**VoiceInputButton Component:**
```typescript
interface VoiceInputButtonProps {
  fieldName: string;
  onTranscriptionComplete: (text: string, confidence: number) => void;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ fieldName, onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  
  const startRecording = async () => {
    await Voice.start('hi-IN'); // Hindi language
    setIsRecording(true);
  };
  
  const stopRecording = async () => {
    const result = await Voice.stop();
    setIsRecording(false);
    setAudioFile(result.uri);
    
    // Upload to S3 and get transcription
    const transcription = await uploadAndTranscribe(result.uri);
    onTranscriptionComplete(transcription.text, transcription.confidence);
  };
  
  return (
    <TouchableOpacity onPress={isRecording ? stopRecording : startRecording}>
      <Icon name={isRecording ? 'stop' : 'microphone'} />
    </TouchableOpacity>
  );
};
```

**Offline Sync Manager:**
```typescript
class OfflineSyncManager {
  private db: SQLiteDatabase;
  private syncQueue: PriorityQueue<PendingReferral>;
  
  async syncPendingReferrals() {
    const pending = await this.db.query('SELECT * FROM pending_referrals ORDER BY risk_score DESC');
    
    for (const referral of pending) {
      try {
        const response = await api.post('/referrals', referral.data);
        await this.db.delete('pending_referrals', referral.local_id);
        await this.db.insert('cached_referrals', {
          referral_id: response.referral_id,
          data: JSON.stringify(response)
        });
      } catch (error) {
        if (error.code === 'NETWORK_ERROR') {
          break; // Stop syncing if network unavailable
        }
        // Log error and continue with next referral
      }
    }
  }
  
  async handleConflict(localData: any, serverData: any) {
    // Server timestamp wins
    await this.db.update('cached_referrals', serverData);
    await this.db.insert('conflict_log', {
      referral_id: serverData.referral_id,
      local_data: JSON.stringify(localData),
      server_data: JSON.stringify(serverData),
      resolved_at: Date.now()
    });
  }
}
```

**SQLite Schema:**
```sql
CREATE TABLE pending_referrals (
  local_id TEXT PRIMARY KEY,
  patient_data TEXT NOT NULL,
  form_data TEXT NOT NULL,
  referral_type TEXT NOT NULL,
  risk_score REAL DEFAULT 0,
  audio_files TEXT,
  geolocation TEXT,
  created_at INTEGER NOT NULL,
  sync_status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0
);

CREATE INDEX idx_pending_sync_status ON pending_referrals(sync_status, risk_score DESC);

CREATE TABLE cached_referrals (
  referral_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  cached_at INTEGER NOT NULL
);

CREATE TABLE conflict_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referral_id TEXT,
  local_data TEXT,
  server_data TEXT,
  resolved_at INTEGER
);
```

#### 2.1.2 PHC Web Dashboard (React)

**Technology Stack:**
- React 18.2 with TypeScript
- Material-UI (MUI) 5.14 component library
- React Query 5.x for data fetching and caching
- Recharts 2.x for data visualization
- React Leaflet 4.x for heatmap
- AWS Amplify 6.x for authentication
- React Router 6.x for navigation

**Project Structure:**
```
src/
├── components/
│   ├── ReferralQueueTable.tsx
│   ├── PatientDetailView.tsx
│   ├── RiskScoreGauge.tsx
│   ├── AnalyticsDashboard.tsx
│   └── VillageHeatmap.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── ReferralDetailPage.tsx
│   └── AnalyticsPage.tsx
├── hooks/
│   ├── useReferrals.ts
│   ├── useAnalytics.ts
│   └── useAuth.ts
├── services/
│   ├── api.ts
│   └── auth.ts
└── utils/
    ├── formatters.ts
    └── exporters.ts
```

**Key Components:**

**ReferralQueueTable Component:**
```typescript
const ReferralQueueTable: React.FC = () => {
  const [filters, setFilters] = useState<ReferralFilters>({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  
  const { data, isLoading } = useQuery({
    queryKey: ['referrals', filters, page, pageSize],
    queryFn: () => api.getReferrals({ ...filters, page, pageSize }),
    refetchInterval: 60000 // Auto-refresh every 60 seconds
  });
  
  const columns: GridColDef[] = [
    { field: 'referral_id', headerName: 'Referral ID', width: 200 },
    { field: 'patient_name', headerName: 'Patient', width: 150 },
    { 
      field: 'risk_score', 
      headerName: 'Risk Score', 
      width: 120,
      renderCell: (params) => (
        <RiskScoreBadge score={params.value} level={params.row.risk_level} />
      )
    },
    // ... more columns
  ];
  
  return (
    <DataGrid
      rows={data?.referrals || []}
      columns={columns}
      pageSize={pageSize}
      rowCount={data?.total || 0}
      paginationMode="server"
      onPageChange={setPage}
      loading={isLoading}
    />
  );
};
```

### 2.2 API Gateway Configuration

**API Gateway Setup:**
- Type: REST API (for full feature support including caching, request validation)
- Region: ap-south-1 (Mumbai)
- Endpoint Type: Regional
- Custom Domain: `api.bharatcarelink.gov.in`
- Certificate: AWS Certificate Manager (ACM) certificate
- TLS: Minimum version 1.3

**API Resources and Methods:**
```
/v1
  /auth
    POST /login
    POST /verify-otp
    POST /refresh-token
    POST /logout
  
  /patients
    POST /patients
    GET /patients/{patient_id}
    PUT /patients/{patient_id}
    GET /patients (query: asha_id, village_code)
  
  /referrals
    POST /referrals
    GET /referrals/{referral_id}
    PUT /referrals/{referral_id}/status
    GET /referrals (query: phc_code, status, risk_level, date_from, date_to, sort, limit, offset)
    GET /referrals/{referral_id}/pdf
  
  /follow-ups
    GET /follow-ups (query: asha_id, status)
    POST /follow-ups/{follow_up_id}/complete
  
  /analytics
    GET /analytics/dashboard (query: phc_code, date_from, date_to)
    GET /analytics/heatmap (query: district_code, metric)
  
  /voice
    POST /voice/upload
    GET /voice/transcription/{job_id}
```

**Authorization Configuration:**
```json
{
  "type": "COGNITO_USER_POOLS",
  "authorizerUri": "arn:aws:cognito-idp:ap-south-1:ACCOUNT_ID:userpool/ap-south-1_XXXXXXXXX",
  "identitySource": "method.request.header.Authorization",
  "authorizerResultTtlInSeconds": 300
}
```

**Request Validation:**
```json
{
  "validateRequestBody": true,
  "validateRequestParameters": true,
  "requestValidatorName": "Validate body and parameters"
}
```

**Request/Response Models:**
```json
// POST /referrals Request Model
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "required": ["patient_id", "referral_type", "form_data"],
  "properties": {
    "patient_id": { "type": "string", "pattern": "^ASH[0-9]{3}-[0-9]{8}-[0-9]{3}$" },
    "referral_type": { "type": "string", "enum": ["pregnancy", "malnutrition", "tb_suspect", "chronic_disease"] },
    "form_data": { "type": "object" },
    "geolocation": {
      "type": "object",
      "properties": {
        "lat": { "type": "number", "minimum": -90, "maximum": 90 },
        "lon": { "type": "number", "minimum": -180, "maximum": 180 }
      }
    }
  }
}
```

**Rate Limiting:**
```json
{
  "throttle": {
    "burstLimit": 200,
    "rateLimit": 100
  },
  "quota": {
    "limit": 10000,
    "period": "DAY"
  }
}
```

**CORS Configuration:**
```json
{
  "allowOrigins": ["https://dashboard.bharatcarelink.gov.in", "https://app.bharatcarelink.gov.in"],
  "allowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "allowHeaders": ["Content-Type", "Authorization", "X-Api-Key", "X-Request-ID"],
  "exposeHeaders": ["X-Request-ID"],
  "maxAge": 3600,
  "allowCredentials": true
}
```

### 2.3 Lambda Functions

**Function: create-referral**
- Runtime: Node.js 20.x
- Memory: 512 MB
- Timeout: 30 seconds
- Reserved Concurrency: 100
- Environment Variables:
  - `PATIENTS_TABLE`: bharat-carelink-patients
  - `REFERRALS_TABLE`: bharat-carelink-referrals
  - `KMS_KEY_ID`: arn:aws:kms:ap-south-1:ACCOUNT_ID:key/XXXXXXXX
  - `EVENT_BUS_NAME`: bharat-carelink-events

**Function: score-risk**
- Runtime: Python 3.11
- Memory: 1024 MB
- Timeout: 10 seconds
- Reserved Concurrency: 50
- Environment Variables:
  - `PREGNANCY_ENDPOINT`: pregnancy-risk-endpoint-v1-2-0
  - `MALNUTRITION_ENDPOINT`: malnutrition-risk-endpoint-v1-1-0
  - `TB_ENDPOINT`: tb-risk-endpoint-v1-0-0

**Function: generate-summary**
- Runtime: Node.js 20.x
- Memory: 512 MB
- Timeout: 15 seconds
- Environment Variables:
  - `BEDROCK_MODEL_ID`: anthropic.claude-3-5-sonnet-20241022-v2:0
  - `REFERRALS_TABLE`: bharat-carelink-referrals

**Function: send-notifications**
- Runtime: Node.js 20.x
- Memory: 256 MB
- Timeout: 10 seconds
- Environment Variables:
  - `SNS_TOPIC_ARN`: arn:aws:sns:ap-south-1:ACCOUNT_ID:bharat-carelink-notifications
  - `SMS_SENDER_ID`: BHRTCL

**IAM Roles and Policies:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-south-1:ACCOUNT_ID:table/bharat-carelink-*",
        "arn:aws:dynamodb:ap-south-1:ACCOUNT_ID:table/bharat-carelink-*/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:Encrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "arn:aws:kms:ap-south-1:ACCOUNT_ID:key/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sagemaker:InvokeEndpoint"
      ],
      "Resource": "arn:aws:sagemaker:ap-south-1:ACCOUNT_ID:endpoint/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:ap-south-1::foundation-model/anthropic.claude-3-5-sonnet-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "events:PutEvents"
      ],
      "Resource": "arn:aws:events:ap-south-1:ACCOUNT_ID:event-bus/bharat-carelink-events"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2.4 DynamoDB Configuration

**Table: bharat-carelink-referrals**
- Billing Mode: On-Demand (auto-scaling)
- Encryption: AWS KMS (customer managed key)
- Point-in-Time Recovery: Enabled
- Streams: Enabled (NEW_AND_OLD_IMAGES)
- TTL: Disabled (manual archival to S3)

**Global Secondary Indexes:**
```json
{
  "GSI1": {
    "IndexName": "GSI1-phc-risk",
    "KeySchema": [
      { "AttributeName": "phc_code", "KeyType": "HASH" },
      { "AttributeName": "risk_score", "KeyType": "RANGE" }
    ],
    "Projection": { "ProjectionType": "ALL" }
  },
  "GSI2": {
    "IndexName": "GSI2-asha-created",
    "KeySchema": [
      { "AttributeName": "asha_id", "KeyType": "HASH" },
      { "AttributeName": "created_at", "KeyType": "RANGE" }
    ],
    "Projection": { "ProjectionType": "ALL" }
  },
  "GSI3": {
    "IndexName": "GSI3-status-created",
    "KeySchema": [
      { "AttributeName": "status", "KeyType": "HASH" },
      { "AttributeName": "created_at", "KeyType": "RANGE" }
    ],
    "Projection": { "ProjectionType": "ALL" }
  }
}
```

### 2.5 ML Model Design (SageMaker)

#### 2.5.1 Pregnancy Risk Model

**Algorithm:** XGBoost Classifier
**Framework:** XGBoost 1.7.6, scikit-learn 1.3.0
**Instance Type:** ml.m5.xlarge (4 vCPU, 16 GB RAM)
**Auto-Scaling:**
- Min instances: 2
- Max instances: 10
- Target invocations per instance: 100/minute
- Scale-up cooldown: 60 seconds
- Scale-down cooldown: 300 seconds

**Training Configuration:**
```python
xgb_params = {
    'objective': 'binary:logistic',
    'max_depth': 6,
    'learning_rate': 0.1,
    'n_estimators': 200,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'min_child_weight': 3,
    'gamma': 0.1,
    'reg_alpha': 0.1,
    'reg_lambda': 1.0,
    'scale_pos_weight': 3.0,  # Handle class imbalance
    'random_state': 42
}
```

**Feature Preprocessing:**
```python
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

numeric_features = ['age', 'hemoglobin_level', 'blood_pressure_systolic', 
                    'blood_pressure_diastolic', 'bmi', 'gestational_age_weeks',
                    'gravida', 'parity', 'anc_visits_completed', 'distance_to_phc_km']

boolean_features = ['has_bleeding', 'has_severe_headache', 'has_blurred_vision',
                    'has_convulsions', 'has_reduced_fetal_movement', 'has_fever',
                    'has_swelling', 'previous_preeclampsia', 'previous_gestational_diabetes',
                    'previous_preterm_birth', 'previous_stillbirth', 'previous_cesarean',
                    'rural_location']

preprocessor = ColumnTransformer([
    ('num', StandardScaler(), numeric_features),
    ('bool', 'passthrough', boolean_features)
])
```

**Model Evaluation Metrics:**
- AUC-ROC: 0.83 (target: >0.80)
- Sensitivity (Recall): 0.87 (target: >0.85)
- Specificity: 0.78 (target: >0.75)
- Precision: 0.72
- F1-Score: 0.79

**SHAP Values for Explainability:**
```python
import shap

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

# Get top 5 contributing features
feature_importance = np.abs(shap_values).mean(axis=0)
top_features_idx = np.argsort(feature_importance)[-5:][::-1]
```

**Inference Endpoint:**
```python
# inference.py
import json
import joblib
import numpy as np

def model_fn(model_dir):
    model = joblib.load(f"{model_dir}/model.joblib")
    preprocessor = joblib.load(f"{model_dir}/preprocessor.joblib")
    return {'model': model, 'preprocessor': preprocessor}

def input_fn(request_body, content_type):
    if content_type == 'application/json':
        data = json.loads(request_body)
        return data['features']
    raise ValueError(f"Unsupported content type: {content_type}")

def predict_fn(input_data, model_dict):
    model = model_dict['model']
    preprocessor = model_dict['preprocessor']
    
    # Preprocess features
    X = preprocessor.transform([list(input_data.values())])
    
    # Get prediction and probability
    prob = model.predict_proba(X)[0][1]
    risk_level = 'high' if prob > 0.7 else 'medium' if prob > 0.4 else 'low'
    
    # Get SHAP values for feature importance
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)[0]
    
    # Get top 5 contributing features
    feature_names = list(input_data.keys())
    contributions = list(zip(feature_names, shap_values, list(input_data.values())))
    contributions.sort(key=lambda x: abs(x[1]), reverse=True)
    top_5 = contributions[:5]
    
    risk_factors = [
        {
            'factor': factor,
            'contribution': abs(shap_val) / sum(abs(s[1]) for s in contributions),
            'value': value,
            'severity': 'high' if abs(shap_val) > 0.1 else 'medium'
        }
        for factor, shap_val, value in top_5
    ]
    
    return {
        'risk_score': round(prob, 2),
        'risk_level': risk_level,
        'risk_factors': risk_factors,
        'model_version': 'v1.2.0'
    }

def output_fn(prediction, accept):
    if accept == 'application/json':
        return json.dumps(prediction), accept
    raise ValueError(f"Unsupported accept type: {accept}")
```

### 2.6 Event Flow Design (EventBridge)

**Event Bus:** bharat-carelink-events

**Event Patterns and Rules:**

**Rule 1: ReferralCreated → Send Notifications**
```json
{
  "source": ["bharat-carelink"],
  "detail-type": ["ReferralCreated"],
  "detail": {
    "risk_level": ["high", "medium", "low"]
  }
}
```
Target: Lambda function `send-notifications`

**Rule 2: ReferralCreated (High Risk) → Alert Supervisor**
```json
{
  "source": ["bharat-carelink"],
  "detail-type": ["ReferralCreated"],
  "detail": {
    "risk_level": ["high"],
    "risk_score": [{ "numeric": [">=", 0.7] }]
  }
}
```
Target: Lambda function `alert-supervisor`

**Rule 3: ReferralStatusUpdated → Notify ASHA**
```json
{
  "source": ["bharat-carelink"],
  "detail-type": ["ReferralStatusUpdated"]
}
```
Target: Lambda function `send-notifications`

**Rule 4: FollowUpMissed → Create Escalation**
```json
{
  "source": ["bharat-carelink"],
  "detail-type": ["FollowUpMissed"],
  "detail": {
    "days_pending": [{ "numeric": [">=", 14] }]
  }
}
```
Target: Lambda function `create-escalation`

**EventBridge Scheduler Rules:**

**Schedule 1: Daily Follow-Up Check**
```json
{
  "Name": "daily-follow-up-check",
  "ScheduleExpression": "cron(0 9 * * ? *)",
  "Target": {
    "Arn": "arn:aws:lambda:ap-south-1:ACCOUNT_ID:function:check-pending-follow-ups"
  }
}
```

**Schedule 2: Weekly Analytics Report**
```json
{
  "Name": "weekly-analytics-report",
  "ScheduleExpression": "cron(0 8 ? * MON *)",
  "Target": {
    "Arn": "arn:aws:lambda:ap-south-1:ACCOUNT_ID:function:generate-weekly-report"
  }
}
```

### 2.7 Security & Compliance Design

#### 2.7.1 Cognito User Pool Configuration

**User Pool Settings:**
- Pool Name: bharat-carelink-users
- Sign-in options: Email, Phone number
- MFA: Optional (required for admin role)
- Password policy:
  - Minimum length: 12 characters
  - Require uppercase: Yes
  - Require lowercase: Yes
  - Require numbers: Yes
  - Require special characters: Yes
  - Temporary password validity: 7 days

**App Clients:**
```json
{
  "MobileApp": {
    "ClientName": "bharat-carelink-mobile",
    "RefreshTokenValidity": 7,
    "AccessTokenValidity": 1,
    "IdTokenValidity": 1,
    "TokenValidityUnits": {
      "RefreshToken": "days",
      "AccessToken": "hours",
      "IdToken": "hours"
    },
    "AuthFlows": ["ALLOW_CUSTOM_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  },
  "WebDashboard": {
    "ClientName": "bharat-carelink-web",
    "RefreshTokenValidity": 30,
    "AccessTokenValidity": 1,
    "IdTokenValidity": 1,
    "AuthFlows": ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  }
}
```

**Lambda Triggers:**
- Pre-authentication: Validate user status, check account lock
- Post-authentication: Update last_login_at, reset failed_login_attempts
- Pre-token-generation: Add custom claims (role, phc_code, permissions)

#### 2.7.2 KMS Encryption Configuration

**Customer Managed Keys:**

**Key 1: General Data Encryption**
- Alias: alias/bharat-carelink-data
- Key Spec: SYMMETRIC_DEFAULT
- Key Usage: ENCRYPT_DECRYPT
- Key Policy: Allow DynamoDB, S3, Lambda to use key
- Automatic Rotation: Enabled (yearly)

**Key 2: Aadhaar Encryption**
- Alias: alias/bharat-carelink-aadhaar
- Key Spec: SYMMETRIC_DEFAULT
- Key Usage: ENCRYPT_DECRYPT
- Key Policy: Restricted to specific Lambda functions only
- Automatic Rotation: Enabled (yearly)

**Field-Level Encryption for Aadhaar:**
```javascript
const AWS = require('aws-sdk');
const kms = new AWS.KMS();

async function encryptAadhaar(aadhaarNumber) {
  const params = {
    KeyId: 'alias/bharat-carelink-aadhaar',
    Plaintext: Buffer.from(aadhaarNumber)
  };
  
  const result = await kms.encrypt(params).promise();
  return result.CiphertextBlob.toString('base64');
}

async function decryptAadhaar(encryptedAadhaar) {
  const params = {
    CiphertextBlob: Buffer.from(encryptedAadhaar, 'base64')
  };
  
  const result = await kms.decrypt(params).promise();
  return result.Plaintext.toString('utf-8');
}
```

#### 2.7.3 Audit Logging Strategy

**CloudWatch Logs Configuration:**
- Log Group: /aws/bharat-carelink/audit
- Retention: 90 days
- Encryption: Enabled with KMS
- Subscription Filter: Stream to S3 for long-term storage

**Audit Log Format:**
```json
{
  "timestamp": "2026-02-15T10:30:45.123Z",
  "log_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "USR001",
  "user_name": "Dr. Rajesh Kumar",
  "user_role": "phc_staff",
  "action": "view_patient",
  "resource_type": "patient",
  "resource_id": "ASH001-20260215-001",
  "ip_address": "203.0.113.42",
  "user_agent": "Mozilla/5.0...",
  "request_id": "abc123-def456",
  "result": "success",
  "details": {
    "fields_accessed": ["full_name", "age", "aadhaar_number"],
    "reason": "referral_review"
  }
}
```

**S3 Audit Log Bucket:**
- Bucket: bharat-carelink-audit-logs
- Versioning: Enabled
- MFA Delete: Enabled
- Object Lock: Enabled (Compliance mode, 7 years)
- Lifecycle Policy:
  - Transition to Glacier after 1 year
  - Retain for 7 years
- Access Logging: Enabled
- Encryption: SSE-KMS

### 2.8 Deployment Strategy

#### 2.8.1 CI/CD Pipeline (AWS CodePipeline)

**Pipeline Stages:**

**Stage 1: Source**
- Source Provider: GitHub
- Repository: bharatcarelink/platform
- Branch: main
- Trigger: Webhook on push

**Stage 2: Build (CodeBuild)**
```yaml
# buildspec.yml
version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
      - npm install
      - npm run test
      - npm run lint
  build:
    commands:
      - echo Build started on `date`
      - npm run build
      - docker build -t bharat-carelink-api:$CODEBUILD_RESOLVED_SOURCE_VERSION .
      - docker tag bharat-carelink-api:$CODEBUILD_RESOLVED_SOURCE_VERSION $ECR_REGISTRY/bharat-carelink-api:latest
  post_build:
    commands:
      - docker push $ECR_REGISTRY/bharat-carelink-api:latest
      - aws s3 sync ./build s3://bharat-carelink-web-assets/
artifacts:
  files:
    - '**/*'
```

**Stage 3: Test (CodeBuild)**
- Run integration tests
- Run security scans (OWASP ZAP)
- Run performance tests (Artillery)

**Stage 4: Deploy to Staging**
- CloudFormation stack update
- Lambda function deployment
- SageMaker endpoint update (if model changed)
- Smoke tests

**Stage 5: Manual Approval**
- Approval required from DevOps lead

**Stage 6: Deploy to Production**
- Blue/Green deployment for Lambda
- CloudFront cache invalidation
- Database migration (if needed)
- Post-deployment verification

#### 2.8.2 Infrastructure as Code (CloudFormation)

**Main Stack Template Structure:**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Bharat CareLink Platform Infrastructure'

Parameters:
  Environment:
    Type: String
    AllowedValues: [dev, staging, prod]
    Default: dev
  
  DomainName:
    Type: String
    Default: api.bharatcarelink.gov.in

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-bharat-carelink-vpc'
  
  # DynamoDB Tables
  PatientsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${Environment}-bharat-carelink-patients'
      BillingMode: PAY_PER_REQUEST
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref DataEncryptionKey
      AttributeDefinitions:
        - AttributeName: patient_id
          AttributeType: S
        - AttributeName: aadhaar_number
          AttributeType: S
        - AttributeName: created_by_asha_id
          AttributeType: S
        - AttributeName: created_at
          AttributeType: N
      KeySchema:
        - AttributeName: patient_id
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: GSI1-aadhaar
          KeySchema:
            - AttributeName: aadhaar_number
              KeyType: HASH
          Projection:
            ProjectionType: ALL
        - IndexName: GSI2-asha-created
          KeySchema:
            - AttributeName: created_by_asha_id
              KeyType: HASH
            - AttributeName: created_at
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
  
  ReferralsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${Environment}-bharat-carelink-referrals'
      BillingMode: PAY_PER_REQUEST
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      # ... (similar configuration as PatientsTable)
  
  # S3 Buckets
  AudioInputBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-bharat-carelink-audio-input'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref DataEncryptionKey
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldAudio
            Status: Enabled
            ExpirationInDays: 730
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt TranscribeAudioFunction.Arn
  
  # Lambda Functions
  CreateReferralFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${Environment}-create-referral'
      Runtime: nodejs20.x
      Handler: index.handler
      Code:
        S3Bucket: !Ref LambdaCodeBucket
        S3Key: create-referral.zip
      MemorySize: 512
      Timeout: 30
      ReservedConcurrentExecutions: 100
      Environment:
        Variables:
          PATIENTS_TABLE: !Ref PatientsTable
          REFERRALS_TABLE: !Ref ReferralsTable
          KMS_KEY_ID: !Ref AadhaarEncryptionKey
          EVENT_BUS_NAME: !Ref EventBus
      Role: !GetAtt CreateReferralFunctionRole.Arn
  
  # API Gateway
  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${Environment}-bharat-carelink-api'
      EndpointConfiguration:
        Types:
          - REGIONAL
  
  # Cognito User Pool
  UserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: !Sub '${Environment}-bharat-carelink-users'
      MfaConfiguration: OPTIONAL
      EnabledMfas:
        - SOFTWARE_TOKEN_MFA
        - SMS_MFA
      Policies:
        PasswordPolicy:
          MinimumLength: 12
          RequireUppercase: true
          RequireLowercase: true
          RequireNumbers: true
          RequireSymbols: true
  
  # EventBridge Event Bus
  EventBus:
    Type: AWS::Events::EventBus
    Properties:
      Name: !Sub '${Environment}-bharat-carelink-events'
  
  # KMS Keys
  DataEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: Encryption key for general data
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
  
  AadhaarEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: Encryption key for Aadhaar numbers
      EnableKeyRotation: true
      # ... (restricted key policy)

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
  
  UserPoolId:
    Description: Cognito User Pool ID
    Value: !Ref UserPool
```

#### 2.8.3 Environment Separation

**Development Environment:**
- AWS Account: dev-account
- Domain: dev-api.bharatcarelink.gov.in
- Database: Smaller capacity, sample data
- ML Models: Older versions for testing
- Monitoring: Basic CloudWatch
- Cost: ~$500/month

**Staging Environment:**
- AWS Account: staging-account
- Domain: staging-api.bharatcarelink.gov.in
- Database: Production-like capacity
- ML Models: Latest versions
- Monitoring: Full CloudWatch + alerts
- Cost: ~$2,000/month

**Production Environment:**
- AWS Account: prod-account
- Domain: api.bharatcarelink.gov.in
- Database: Full capacity with auto-scaling
- ML Models: Validated production versions
- Monitoring: Full observability stack
- Cost: ~$8,000/month (estimated for 50,000 users)

**Environment Variables Management:**
```javascript
// config/environments.js
module.exports = {
  dev: {
    apiEndpoint: 'https://dev-api.bharatcarelink.gov.in',
    cognitoUserPoolId: 'ap-south-1_DEVPOOL',
    cognitoClientId: 'dev-client-id',
    s3Bucket: 'dev-bharat-carelink-assets',
    logLevel: 'debug'
  },
  staging: {
    apiEndpoint: 'https://staging-api.bharatcarelink.gov.in',
    cognitoUserPoolId: 'ap-south-1_STAGPOOL',
    cognitoClientId: 'staging-client-id',
    s3Bucket: 'staging-bharat-carelink-assets',
    logLevel: 'info'
  },
  prod: {
    apiEndpoint: 'https://api.bharatcarelink.gov.in',
    cognitoUserPoolId: 'ap-south-1_PRODPOOL',
    cognitoClientId: 'prod-client-id',
    s3Bucket: 'prod-bharat-carelink-assets',
    logLevel: 'warn'
  }
};
```

## 3. Monitoring & Observability

### 3.1 CloudWatch Dashboard

**Dashboard Name:** BharatCareLink-Production-Monitoring

**Widgets:**

**Row 1: API Metrics**
- API Request Count (last 1 hour)
- API Error Rate (4xx, 5xx)
- API Latency (p50, p95, p99)
- API Throttles

**Row 2: Lambda Metrics**
- Lambda Invocations by Function
- Lambda Duration (p95)
- Lambda Errors
- Lambda Concurrent Executions

**Row 3: Database Metrics**
- DynamoDB Read Capacity
- DynamoDB Write Capacity
- DynamoDB Throttled Requests
- DynamoDB Latency

**Row 4: ML Metrics**
- SageMaker Invocations
- SageMaker Model Latency
- SageMaker Errors
- Bedrock API Calls

**Row 5: Business Metrics**
- Referrals Submitted (last 24 hours)
- High-Risk Referrals (%)
- Average Risk Score
- Completion Rate

### 3.2 CloudWatch Alarms

**Critical Alarms (PagerDuty):**
```yaml
APIErrorRateHigh:
  MetricName: 5XXError
  Threshold: 5
  EvaluationPeriods: 2
  Period: 300
  Statistic: Average
  ComparisonOperator: GreaterThanThreshold
  AlarmActions:
    - !Ref PagerDutyTopic

MLInferenceFailureHigh:
  MetricName: ModelInvocationErrors
  Threshold: 10
  EvaluationPeriods: 1
  Period: 300
  Statistic: Sum
  ComparisonOperator: GreaterThanThreshold
  AlarmActions:
    - !Ref PagerDutyTopic

DatabaseThrottling:
  MetricName: UserErrors
  Threshold: 10
  EvaluationPeriods: 2
  Period: 60
  Statistic: Sum
  ComparisonOperator: GreaterThanThreshold
  AlarmActions:
    - !Ref PagerDutyTopic
```

**Warning Alarms (Email/Slack):**
```yaml
APILatencyHigh:
  MetricName: Latency
  Threshold: 500
  EvaluationPeriods: 3
  Period: 300
  Statistic: p95
  ComparisonOperator: GreaterThanThreshold
  AlarmActions:
    - !Ref SlackTopic

LambdaConcurrencyHigh:
  MetricName: ConcurrentExecutions
  Threshold: 800
  EvaluationPeriods: 2
  Period: 60
  Statistic: Maximum
  ComparisonOperator: GreaterThanThreshold
  AlarmActions:
    - !Ref SlackTopic
```

### 3.3 X-Ray Tracing

**Enabled Services:**
- API Gateway: Active tracing enabled
- Lambda Functions: Active tracing enabled
- DynamoDB: Trace all requests

**Trace Sampling Rules:**
```json
{
  "version": 2,
  "rules": [
    {
      "description": "Trace all errors",
      "priority": 1,
      "fixed_rate": 1.0,
      "reservoir_size": 1,
      "service_name": "*",
      "http_method": "*",
      "url_path": "*",
      "resource_arn": "*",
      "attributes": {
        "http.status_code": "5*"
      }
    },
    {
      "description": "Trace 10% of successful requests",
      "priority": 100,
      "fixed_rate": 0.1,
      "reservoir_size": 10,
      "service_name": "*",
      "http_method": "*",
      "url_path": "*",
      "resource_arn": "*"
    }
  ],
  "default": {
    "fixed_rate": 0.05,
    "reservoir_size": 1
  }
}
```

## 4. Disaster Recovery Plan

### 4.1 Backup Strategy

**DynamoDB:**
- Point-in-Time Recovery: Enabled (35-day retention)
- On-Demand Backups: Daily at 2:00 AM IST
- Cross-Region Replication: Disabled (data residency requirement)
- Backup Retention: 90 days

**S3:**
- Versioning: Enabled
- Cross-Region Replication: Disabled
- Lifecycle Policy: Transition to Glacier after 2 years
- MFA Delete: Enabled for audit logs

**RDS (if used for analytics):**
- Automated Backups: Daily at 3:00 AM IST
- Backup Retention: 30 days
- Multi-AZ: Enabled

### 4.2 Recovery Procedures

**Scenario 1: DynamoDB Table Corruption**
1. Identify corruption timestamp
2. Restore from Point-in-Time Recovery to new table
3. Validate data integrity
4. Update application to use new table
5. Delete corrupted table after verification

**Scenario 2: Complete Region Failure**
1. Activate disaster recovery plan
2. Deploy infrastructure to backup region (manual process, 4 hours)
3. Restore DynamoDB from backups
4. Restore S3 data from backups
5. Update DNS to point to new region
6. Validate all services operational

**Scenario 3: Data Breach**
1. Immediately revoke all access tokens
2. Rotate all KMS keys
3. Audit all access logs
4. Notify affected users
5. Implement additional security controls
6. Conduct security review

---

## 5. Cost Estimation

**Monthly Cost Breakdown (Production - 50,000 users):**

| Service | Usage | Cost |
|---------|-------|------|
| API Gateway | 10M requests | $35 |
| Lambda | 50M invocations, 512MB avg | $250 |
| DynamoDB | 10GB storage, on-demand | $500 |
| S3 | 500GB storage, 1M requests | $150 |
| SageMaker | 2-10 instances, ml.m5.xlarge | $2,500 |
| Bedrock | 100K invocations | $300 |
| Transcribe | 50K minutes | $750 |
| SNS | 500K SMS | $1,500 |
| CloudFront | 1TB transfer | $85 |
| CloudWatch | Logs + Metrics | $200 |
| Cognito | 50K MAU | $275 |
| KMS | 100K requests | $10 |
| Data Transfer | 500GB out | $45 |
| **Total** | | **~$6,600/month** |

**Scaling Projections:**
- 100K users: ~$12,000/month
- 500K users: ~$45,000/month
- 1M users: ~$80,000/month

---

**Document Version:** 1.0  
**Last Updated:** February 15, 2026  
**Authors:** Cloud Architecture Team, Bharat CareLink Project
## 5. AWS Cost Optimization (FinOps) Strategy

To ensure sustainability at a national scale, Bharat CareLink implements the following cost-saving measures:

- **Serverless First:** Utilizing AWS Lambda and DynamoDB (On-Demand) ensures zero cost when the system is idle.
- **Bedrock Provisioned Throughput:** For high-volume districts, switching to provisioned throughput for Claude 3.5 Sonnet to reduce per-token costs.
- **S3 Intelligent-Tiering:** Automatically moving audio logs and old referral clips to colder storage tiers (Glacier) after 90 days.
- **SageMaker Serverless Inference:** Using serverless endpoints for risk scoring models to avoid 24/7 instance costs.
- **Event-Driven Architecture:** Using EventBridge and SNS instead of polling to significantly reduce compute time and API costs.
