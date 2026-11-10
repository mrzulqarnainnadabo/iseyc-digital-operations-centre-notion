# ISEYC departmental operating architecture

Code-level diagram (not a generated image). Reflects the implementation on `feat/doc-operational-workflows`.

```mermaid
flowchart TB
  N[ISEYC National Institutional Coordination<br/>Digital Operations Centre]
  N --> D1[Education]
  N --> D2[Health]
  N --> D3[Digital Systems]
  N --> D4[Civic Affairs]
  D1 --> F[Department functions<br/>mandate · activities · outputs]
  D2 --> F
  D3 --> F
  D4 --> F
  F --> P[Programmes API<br/>Draft / Planning only]
  P --> W[Work plans API<br/>Planned]
  W --> R[Reports API<br/>Draft]
  P -.->|requires env| E1[NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID]
  W -.->|requires env| E2[NOTION_DEPARTMENT_WORKPLANS_DATABASE_ID]
  R -.->|requires env| E3[NOTION_DEPARTMENT_REPORTS_DATABASE_ID]
  F --> S[Shared registers — live Partial]
  S --> A[Actions]
  S --> M[Meetings]
  S --> C[Communications]
  S --> CH[Chamber]
  S --> X[External engagement]
```

**Live Partial:** Actions, Meetings, Communications, Chamber, External engagement.  
**Implemented, unconfigured until env + share:** Programmes, Work plans, Reports.  
**Disabled:** Approval, publication, dispatch, formal closure, appointment-based authority.
