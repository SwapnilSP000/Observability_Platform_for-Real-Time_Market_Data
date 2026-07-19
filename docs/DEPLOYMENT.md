# Production & Cloud Deployment Strategy - DeltaOps

## 1. Cloud Architecture Overview

DeltaOps target deployment relies on a cloud-native Kubernetes architecture (AWS EKS or GCP GKE) provisioned via Terraform.

```
                        ┌─────────────────────────┐
                        │    AWS Route53 / Cloud  │
                        └────────────┬────────────┘
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │   AWS ALB Ingress / NGINX│
                        └────────────┬────────────┘
                                     │
              ┌──────────────────────┴──────────────────────┐
              │                                             │
              ▼                                             ▼
   ┌──────────────────────┐                      ┌──────────────────────┐
   │ API Gateway Pods     │                      │ Web Dashboard Pods   │
   │ (Autoscaled HPA)     │                      │ (Nginx static bundle)│
   └──────────┬───────────┘                      └──────────────────────┘
              │
              ▼
   ┌──────────────────────┐
   │ Core OMS & Risk Pods │
   └──────────┬───────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
┌──────────────┐  ┌──────────────┐
│ AWS RDS Postgres│  │ AWS ElastiCache│
│ (Multi-AZ DB)│  │ (Redis Cluster)│
└──────────────┘  └──────────────┘
```

---

## 2. Infrastructure as Code (Terraform)

- Module Location: `terraform/`
- Resources Provisioned:
  - VPC with public/private subnet topology across 3 Availability Zones.
  - EKS Kubernetes Cluster with managed node groups.
  - RDS PostgreSQL Aurora cluster.
  - ElastiCache Redis Cluster.
  - IAM roles for Service Accounts (IRSA) for OpenTelemetry export permissions.

---

## 3. Kubernetes Helm Deployment

- Helm Chart Location: `kubernetes/`
- Environments: `staging` and `production` values overrides.
- Features: HPA (Horizontal Pod Autoscaler) configured on CPU > 70% and memory > 80%.
