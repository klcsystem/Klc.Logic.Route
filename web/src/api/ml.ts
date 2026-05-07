import api from './client'
import type { ApiResponse } from '../types'

export interface MlModel {
  id: string
  name: string
  type: 'DeliveryTimePrediction' | 'DelayRisk' | 'CostAnomaly'
  version: string
  accuracy: number
  rmse?: number
  r2Score?: number
  trainedAt: string
  recordCount: number
  status: 'Active' | 'Training' | 'Failed'
}

export interface DeliveryTimePrediction {
  shipmentId: string
  predictedHours: number
  confidencePercent: number
  factors: { name: string; impact: number }[]
}

export interface DelayRiskPrediction {
  shipmentId: string
  riskLevel: 'Low' | 'Medium' | 'High'
  riskPercent: number
  reasons: string[]
}

export interface CostAnomalyPrediction {
  shipmentId: string
  anomalyScore: number
  isAnomaly: boolean
  expectedCost: number
  actualCost: number
  deviationPercent: number
}

export interface PredictionVsActual {
  predicted: number
  actual: number
  label: string
}

export const mlApi = {
  getModels: () =>
    api.get<ApiResponse<MlModel[]>>('/ml/models').then(r => r.data),

  triggerTraining: (modelType: string) =>
    api.post<ApiResponse<{ jobId: string }>>('/ml/training/trigger', { modelType }).then(r => r.data),

  getDeliveryTimePrediction: (shipmentId: string) =>
    api.get<ApiResponse<DeliveryTimePrediction>>(`/ml/predictions/delivery-time/${shipmentId}`).then(r => r.data),

  getDelayRiskPrediction: (shipmentId: string) =>
    api.get<ApiResponse<DelayRiskPrediction>>(`/ml/predictions/delay-risk/${shipmentId}`).then(r => r.data),

  getCostAnomalyPrediction: (shipmentId: string) =>
    api.get<ApiResponse<CostAnomalyPrediction>>(`/ml/predictions/cost-anomaly/${shipmentId}`).then(r => r.data),

  getPredictionVsActual: (modelType: string) =>
    api.get<ApiResponse<PredictionVsActual[]>>(`/ml/models/${modelType}/predictions-vs-actual`).then(r => r.data),
}
