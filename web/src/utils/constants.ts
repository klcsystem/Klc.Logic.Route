export const ROUTE_STATUS = {
  Planned: 'Planned',
  InProgress: 'InProgress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
} as const

export const VEHICLE_STATUS = {
  Available: 'Available',
  OnRoute: 'OnRoute',
  Maintenance: 'Maintenance',
  OutOfService: 'OutOfService',
} as const

export const ORDER_STATUS = {
  Pending: 'Pending',
  Assigned: 'Assigned',
  InTransit: 'InTransit',
  Delivered: 'Delivered',
  Failed: 'Failed',
  Cancelled: 'Cancelled',
} as const

export const USER_ROLES = {
  Admin: 'Admin',
  Manager: 'Manager',
  Planner: 'Planner',
  Dispatcher: 'Dispatcher',
  Driver: 'Driver',
} as const

export const DEFAULT_PAGE_SIZE = 25
export const DEFAULT_MAP_CENTER = { lat: 41.0082, lng: 28.9784 } // Istanbul
export const DEFAULT_MAP_ZOOM = 10
